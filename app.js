// Globals
let service_app_token =
  "7035c947d20ed12407a413d4e4220bd3604274cd80de6d337a7c030778ca6b72"; // Update this value with your token

const initialTokens = {
  accessToken: "",
  refreshToken:
    "NWJhNjdlZDItYjdiNy00YjQ3LTliYzMtNWQ0OTBiNDgwMDBiNTVlNmU0ZTAtZGQ3_P0A1_881af7bb-8586-4b10-9ded-43d95f715190",
};

const guestToken = document.querySelector("#guest-token");
const jweToken = document.querySelector("#jwt-token-for-dest");
const message = document.querySelector("#message");

async function renewTheAccessToken(refreshToken) {
  const httpData = {
    grant_type: "authorization_code",
    client_id:
      "C1416de9b2acf9240c112eb7edb0279e996d5fce7b545a1cfc395d25edebd02e5",
    client_secret:
      "48974c9cba949a8ca0bac9883551078c6380b5ffa9da7d4fa58948176afea759",
  };

  const response = await fetch("https://webexapis.com/v1/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(httpData),
  });

  const data = await response.json();
  console.log("Data:", data);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}

async function handleGuestTokenFailure() {
  try {
    const tokens = await renewTheAccessToken(initialTokens.refreshToken);
    initialTokens.accessToken = tokens.access_token;
    initialTokens.refreshToken = tokens.refresh_token;
  } catch (error) {
    console.error("Error handling guest token failure:", error.message);
    throw error;
  }
}

async function getGuestToken() {
  try {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("Authorization", `Bearer ${initialTokens.accessToken}`);

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

    const response = await fetch(
      "https://webexapis.com/v1/guests/token",
      request
    );
    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    if (data.accessToken) {
      guestToken.value = data.accessToken;
    }
  } catch (error) {
    console.error("Error getting guest token:", error);
    throw error;
  }
}

async function getJweToken() {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Authorization", `Bearer ${service_app_token}`);

  const payload = JSON.stringify({
    calledNumber: "QUEUE_NUMBER", // Update destination queue number here
    guestName: "Harvey",
  });

  const request = {
    method: "POST",
    headers: myHeaders,
    body: payload,
    redirect: "follow",
  };

  const response = await fetch(
    "https://webexapis.com/v1/telephony/click2call/callToken",
    request
  );
  const result = await response.json();
  if (result.callToken) {
    jweToken.value = result.callToken;
  }
}

async function getWebexConfig() {
  const webexConfig = {
    config: {
      logger: {
        level: "debug", // set the desired log level
      },
      meetings: {
        reconnection: {
          enabled: true,
        },
        enableRtx: true,
      },
      encryption: {
        kmsInitialTimeout: 8000,
        kmsMaxTimeout: 40000,
        batcherMaxCalls: 30,
        caroots: null,
      },
      dss: {},
    },
    credentials: {
      access_token: guestToken.value,
    },
  };

  return webexConfig;
}

async function getCallingConfig() {
  const clientConfig = {
    calling: true,
    callHistory: true,
  };

  const loggerConfig = {
    level: "info",
  };

  const serviceData = {
    indicator: "guestcalling",
    domain: "",
    guestName: "Harvey",
  };

  const callingClientConfig = {
    logger: loggerConfig,
    discovery: {
      region: "US-EAST",
      country: "US",
    },
    serviceData,
    jwe: jweToken.value,
  };

  const callingConfig = {
    clientConfig: clientConfig,
    callingClientConfig: callingClientConfig,
    logger: loggerConfig,
  };

  return callingConfig;
}

// Function to initialize Webex and make a call
const initializeCallingAndMakeCall = async () => {
  const webexConfig = await getWebexConfig();
  const callingConfig = await getCallingConfig();
  message.textContent = "Please wait...connecting to the available agent";

  let callingClient;
  try {
    // Initialize the Webex Calling SDK
    const calling = await Calling.init({ webexConfig, callingConfig });

    // Create a call
    calling.on("ready", () => {
      calling.register().then(async () => {
        callingClient = window.callingClient = calling.callingClient;

        const localAudioStream = await Calling.createMicrophoneStream({
          audio: true,
        });
        const line = Object.values(callingClient.getLines())[0];

        line.on("registered", (lineInfo) => {
          console.log("Line information: ", lineInfo);

          // Create call object
          const call = line.makeCall();

          // Setup outbound call events
          call.on("progress", (correlationId) => {
            // Add ringback on progress
          });

          call.on("connect", (correlationId) => {
            message.textContent = "";
          });

          call.on("remote_media", (track) => {});

          call.on("disconnect", (correlationId) => {});

          // Trigger an outbound call
          call.dial(localAudioStream);
        });
        line.register();
      });
    });
  } catch (error) {
    console.error("Error initiating call", error);
  }
};

// Add event listener to the button
document
  .getElementById("callButton")
  .addEventListener("click", initializeCallingAndMakeCall);

// Endpoint handler
handler = async (event) => {
  let guestToken = "";

  try {
    console.log("Coming here");
    await handleGuestTokenFailure();
    guestToken = await getGuestToken();
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(`Error getting guest token: ${error}`),
    };
  }

  return {
    statusCode: 200,
    body: guestToken,
  };
};

window.handler = handler;
