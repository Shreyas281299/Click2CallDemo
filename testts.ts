import axios from "axios";

const initialTokens = {
  accessToken: "",
  refreshToken:
    "NWJhNjdlZDItYjdiNy00YjQ3LTliYzMtNWQ0OTBiNDgwMDBiNTVlNmU0ZTAtZGQ3_P0A1_881af7bb-8586-4b10-9ded-43d95f715190",
};

async function renewTheAccessToken(refreshToken) {
  const httpData = {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id:
      "C3364a1a913302e99cf948159917c2d8a644f9ba20e8335839efbfe40164c3500",
    client_secret:
      "52b1eff29d0c37838b7d73ec17f3a4d3460b98dbb806023d2d29e9c0aaaab663",
  };

  const response = await axios.post(
    "https://webexapis.com/v1/access_token",
    httpData
  );

  const data = await response.data;

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  };
}

// Guest access token via Service App
async function getGuestAccessToken() {
  const access_token = initialTokens.accessToken;

  const response = await axios.post(
    "https://webexapis.com/v1/guests/token",
    {
      subject: "Guest token for Webex Calling SDK Sample App",
      displayName: "Calling Guest User",
    },
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.accessToken;
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

// Endpoint handler
export const handler = async (event) => {
  let guestToken = "";

  try {
    guestToken = await getGuestAccessToken();
  } catch (error) {
    // 1. regenerate the SA access and refresh token and update the initialTokens
    // 2. Generate the guest access token again with the updated SA tokens

    try {
      console.log("Coming here");
      await handleGuestTokenFailure();
      guestToken = await getGuestAccessToken();
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify(`Error getting guest token: ${error}`),
      };
    }
  }

  return {
    statusCode: 200,
    body: guestToken,
  };
};
