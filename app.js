const guestToken = document.querySelector("#guest-token");
const jweToken = document.querySelector("#jwt-token-for-dest");
const message = document.querySelector("#message");

/**
 * Webex Click-to-Call Application
 *
 * This application implements a click-to-call functionality using Webex APIs.
 * Flow:
 * 1. Generate guest token for authentication
 * 2. Generate JWE token for call destination
 * 3. Initialize Webex SDK with configurations
 * 4. Make call and handle call events
 * 5. Manage call disconnect functionality
 */

/**
 * Service application token for Webex API authentication
 * Initial token storage object
 * Global call object to manage active calls
 * DOM element references for UI interaction
 */
const service_app_token = "";

const initialTokens = {
  accessToken: "",
};
let callObject;

// ============================================================================
// GUEST TOKEN MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Generates a guest token for Webex authentication
 *
 * This function creates a guest user token that allows temporary access
 * to Webex services without requiring a full user account.
 *
 * @returns {Promise<void>} Updates the guest token input field on success
 */
async function getGuestToken() {
  console.log("🔑 Starting guest token generation...");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", `Bearer ${service_app_token}`);

  const raw = JSON.stringify({
    subject: "Webex Click To Call Demo",
    displayName: "WebexOne Demo",
  });

  const request = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  console.log("🌐 Requesting guest token from Webex API...");
  const response = await fetch(
    "https://webexapis.com/v1/guests/token",
    request
  );
  const data = await response.json();

  if (data.accessToken) {
    console.log("✅ Guest token generated successfully");
    guestToken.value = data.accessToken;
  } else {
    console.error("❌ Failed to generate guest token:", data);
  }
}

/**
 * Generates a JWE (JSON Web Encryption) token for call destination
 *
 * This token contains encrypted information about the call destination
 * and is required for initiating calls to specific numbers or queues.
 *
 * @returns {Promise<void>} Updates the JWE token input field on success
 */
async function getJweToken() {
  console.log("🔐 Starting JWE token generation...");

  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", `Bearer ${service_app_token}`);

  const payload = JSON.stringify({
    calledNumber: "1234567890", // Update destination queue number here
    guestName: "Harvey",
  });

  const request = {
    method: "POST",
    headers: myHeaders,
    body: payload,
    redirect: "follow",
  };

  console.log("🌐 Requesting JWE token from Webex API...");
  const response = await fetch(
    "https://webexapis.com/v1/telephony/click2call/callToken",
    request
  );
  const result = await response.json();

  if (result.callToken) {
    console.log("✅ JWE token generated successfully");
    jweToken.value = result.callToken;
  } else {
    console.error("❌ Failed to generate JWE token:", result);
  }
}

// ============================================================================
// WEBEX SDK CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Creates Webex SDK configuration object
 *
 * This configuration includes logging settings, meeting options,
 * encryption parameters, and authentication credentials.
 *
 * @returns {Promise<Object>} Webex configuration object
 */
async function getWebexConfig() {
  console.log("⚙️ Building Webex SDK configuration...");

  const webexConfig = {
    config: {
      logger: {
        level: "debug", // set the desired log level
      },
      meetings: {
        reconnection: {
          enabled: true, // Enable automatic reconnection
        },
        enableRtx: true, // Enable Real-time Transport Protocol
      },
      encryption: {
        kmsInitialTimeout: 8000,
        kmsMaxTimeout: 40000,
        batcherMaxCalls: 30,
        caroots: null,
      },
      dss: {}, // Directory Search Service configuration
    },
    credentials: {
      access_token: guestToken.value, // Use the generated guest token
    },
  };

  console.log("✅ Webex configuration created successfully");
  return webexConfig;
}

/**
 * Creates calling client configuration object
 *
 * This configuration includes calling options, logging settings,
 * service discovery parameters, and JWE token for call routing.
 *
 * @returns {Promise<Object>} Calling configuration object
 */
async function getCallingConfig() {
  console.log("📞 Building calling client configuration...");

  const clientConfig = {
    calling: true, // Enable calling functionality
    callHistory: true, // Enable call history tracking
  };

  const loggerConfig = {
    level: "info", // Set logging level for calling client
  };

  const serviceData = {
    indicator: "guestcalling", // Indicates this is a guest calling session
    domain: "", // Domain for service discovery
    guestName: "Harvey-", // Guest user identifier
  };

  const callingClientConfig = {
    logger: loggerConfig,
    discovery: {
      region: "US-EAST", // Service region for optimal routing
      country: "US", // Country code for compliance
    },
    serviceData,
    jwe: jweToken.value, // JWE token for call destination routing
  };

  const callingConfig = {
    clientConfig: clientConfig,
    callingClientConfig: callingClientConfig,
    logger: loggerConfig,
  };

  console.log("✅ Calling configuration created successfully");
  return callingConfig;
}

/**
 * Main function to initialize Webex SDK and initiate a call
 *
 * This is the primary function that orchestrates the entire calling process:
 * 1. Gets configuration objects
 * 2. Initializes Webex Calling SDK
 * 3. Registers the calling client
 * 4. Sets up audio streams
 * 5. Creates and manages call events
 * 6. Handles UI state changes
 */
const initializeCallingAndMakeCall = async () => {
  console.log("🚀 Starting call initialization process...");

  // Get configuration objects
  const webexConfig = await getWebexConfig();
  const callingConfig = await getCallingConfig();

  // Update UI to show connection progress
  message.textContent = "Please wait...connecting to the available agent";
  console.log("🔄 Connecting to Webex services...");

  let callingClient;
  try {
    // Initialize the Webex Calling SDK
    console.log("📦 Initializing Webex Calling SDK...");
    const calling = await Calling.init({ webexConfig, callingConfig });

    // Set up calling client and register
    calling.on("ready", () => {
      console.log("✅ Webex Calling SDK ready, registering client...");

      calling.register().then(async () => {
        console.log("📋 Client registered successfully");
        callingClient = window.callingClient = calling.callingClient;

        // Create local audio stream for outgoing call
        console.log("🎤 Creating local audio stream...");
        const localAudioStream = await Calling.createMicrophoneStream({
          audio: true,
        });

        console.log("🎵 Local audio stream created:", localAudioStream);

        // Get the first available line for making calls
        const line = Object.values(callingClient.getLines())[0];
        console.log("📱 Using calling line for outbound call");

        // Set up line registration and call handling
        line.on("registered", (lineInfo) => {
          console.log("📞 Line registered, creating call object...");

          // Create call object and store globally for disconnect functionality
          const call = line.makeCall();
          callObject = call;

          // ================================================================
          // CALL EVENT HANDLERS
          // ================================================================

          /**
           * Call Progress Event - Call is being routed/ringing
           * This indicates the call is in progress but not yet connected
           */
          call.on("progress", (correlationId) => {
            console.log("📞 Call in progress - routing to destination...");
            message.textContent = "Call in progress";

            // Update UI: disable call button, enable disconnect button
            document.getElementById("callButton").disabled = true;
            document.getElementById("callDisconnect").disabled = false;
          });

          /**
           * Call Connect Event - Call has been answered
           * This indicates the destination has picked up the call
           */
          call.on("connect", (correlationId) => {
            console.log("🤝 Call connected - destination answered");
            message.textContent = "Call connected";
          });

          /**
           * Call Established Event - Call is fully established with media
           * This indicates two-way audio communication is active
           */
          call.on("established", (correlationId) => {
            console.log("✅ Call established - two-way audio active");
            message.textContent = "Call established";
          });

          /**
           * Remote Media Event - Incoming audio stream received
           * This handles the audio stream from the remote party
           */
          call.on("remote_media", (track) => {
            console.log("🔊 Remote media received - setting up audio playback");
            message.textContent = "Setting up remote media";

            // Connect remote audio to the audio element for playback
            document.getElementById("remote-audio").srcObject = new MediaStream(
              [track]
            );
          });

          /**
           * Call Disconnect Event - Call has ended
           * This handles cleanup when the call terminates
           */
          call.on("disconnect", (correlationId) => {
            console.log("📴 Call disconnected - cleaning up resources");
            message.textContent = "Call disconnected";

            // Reset UI state: enable call button, disable disconnect button
            document.getElementById("callButton").disabled = false;
            document.getElementById("callDisconnect").disabled = true;

            // Clear the global call object
            callObject = null;
          });

          // Initiate the actual call with local audio stream
          console.log("📞 Dialing call with local audio stream...");
          call.dial(localAudioStream);
        });

        // Register the line to enable call functionality
        console.log("📝 Registering line for outbound calls...");
        line.register();
      });
    });
  } catch (error) {
    console.error("❌ Error initiating call:", error);
    message.textContent = "Error: Failed to initiate call";
  }
};

// ============================================================================
// CALL DISCONNECT
// ============================================================================

const disconnectCall = async () => {
  console.log("🔌 Disconnect call requested...");

  if (callObject) {
    console.log("📴 Ending active call...");
    callObject.end();

    // Update UI immediately for better user feedback
    message.textContent = "Call disconnected";
    document.getElementById("callDisconnect").disabled = true;
    document.getElementById("callButton").disabled = false;

    console.log("✅ Call disconnected successfully");
  } else {
    console.log("⚠️ No active call to disconnect");
  }
};

window.getGuestToken = getGuestToken;
window.initializeCallingAndMakeCall = initializeCallingAndMakeCall;
window.disconnectCall = disconnectCall;

console.log("✅ Webex Click-to-Call application loaded successfully");
