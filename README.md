# Webex Click-to-Call Application

A web-based click-to-call application that enables users to make phone calls directly from their browser using the Webex Calling SDK. This application provides a simple interface for initiating calls to predefined destinations through Webex's telephony services.

## 🚀 Features

- **Guest Authentication**: Generate temporary guest tokens for Webex access
- **Secure Call Routing**: Use JWE (JSON Web Encryption) tokens for secure call destination routing
- **Real-time Call Management**: Handle call states (progress, connect, established, disconnect)
- **Audio Streaming**: Manage local microphone and remote audio streams
- **Intuitive UI**: Clean, responsive interface with real-time status updates
- **Call Controls**: Start and disconnect calls with proper state management

## 📋 Prerequisites

Before running this application, ensure you have:

1. **Webex Service Application Token**: A valid service application token from Webex
2. **Valid Destination Number**: A properly configured destination number/queue
3. **Modern Web Browser**: Chrome, Firefox, Safari, or Edge with WebRTC support
4. **Microphone Access**: Browser permission for microphone usage

## 🛠️ Setup Instructions

### 1. Clone or Download

Download the project files to your local machine.

### 2. Configure Service Token

Edit `app.js` and update the `service_app_token` variable:

```javascript
const service_app_token = "YOUR_WEBEX_SERVICE_APP_TOKEN_HERE";
```

### 3. Configure Destination Number

Update the destination number in the `getJweToken()` function:

```javascript
const payload = JSON.stringify({
  calledNumber: "+17753106968", // Update with your destination number
  guestName: "Harvey",
});
```

### 4. Serve the Application

Since this application uses ES6 modules and makes API calls, it must be served through a web server:

**Option A: Using Python**

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Using Node.js**

```bash
npx http-server -p 8000
```

**Option C: Using Live Server (VS Code)**
Install the Live Server extension and right-click on `index.html` → "Open with Live Server"

### 5. Access the Application

Open your browser and navigate to `http://localhost:8000`

## 🎯 How to Use

### Method 1: Automatic Flow (Recommended)

1. Click the **"Call"** button
2. The application will automatically:
   - Generate a guest token
   - Generate a JWE token for the destination
   - Initialize the Webex SDK
   - Initiate the call
3. Use the **"Disconnect"** button to end the call

### Method 2: Manual Token Generation

1. Click **"Generate Guest Token"** to create authentication token
2. Click **"Generate JWE"** to create destination routing token
3. Click **"Call"** to initiate the call
4. Use **"Disconnect"** to end the call

## 📁 File Structure

```
App/
├── index.html          # Main HTML interface
├── app.js             # Core application logic and Webex integration
├── Ringback.mp3       # Audio file for ringback tone
└── README.md          # This documentation file
```

## 🔧 Configuration Options

### Webex SDK Configuration

The application includes several configurable options in the `getWebexConfig()` function:

- **Logging Level**: Adjust debug output level
- **Reconnection**: Enable/disable automatic reconnection
- **RTX**: Real-time Transport Protocol settings
- **Encryption**: KMS timeout and batch settings

### Calling Client Configuration

Configure calling behavior in the `getCallingConfig()` function:

- **Region**: Service region for optimal routing (default: US-EAST)
- **Country**: Country code for compliance (default: US)
- **Guest Name**: Identifier for guest calling sessions

## 🎵 Audio Management

The application handles two audio streams:

1. **Local Audio**: Captures microphone input for outgoing audio
2. **Remote Audio**: Plays incoming audio from the called party

Audio elements are automatically managed, but ensure your browser allows microphone access.

## 🔍 Call States

The application manages the following call states:

- **Progress**: Call is being routed/ringing
- **Connect**: Destination has answered the call
- **Established**: Two-way audio communication is active
- **Disconnect**: Call has ended

## 🐛 Troubleshooting

### Common Issues

**Token Generation Fails**

- Verify your service application token is valid
- Check network connectivity
- Ensure CORS is properly configured

**Call Doesn't Connect**

- Verify the destination number is correct and reachable
- Check that the JWE token was generated successfully
- Ensure your Webex service has calling permissions

**No Audio**

- Grant microphone permissions in your browser
- Check browser compatibility with WebRTC
- Verify audio devices are working

**CORS Errors**

- Serve the application through a web server (not file://)
- Check browser console for specific CORS issues

### Debug Mode

The application includes comprehensive logging. Open browser developer tools (F12) to view detailed logs for troubleshooting.

## 🔒 Security Considerations

- **Token Security**: Service application tokens should be kept secure and not exposed in production
- **Guest Tokens**: Guest tokens are temporary and automatically expire
- **JWE Encryption**: Call routing information is encrypted using JWE tokens
- **HTTPS**: Use HTTPS in production for secure token transmission

## 🌐 Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

**Note**: WebRTC support is required for audio functionality.

## 📞 Support

For Webex API support and documentation:

- [Webex for Developers](https://developer.webex.com/)
- [Webex Calling SDK Documentation](https://developer.webex.com/docs/sdks/browser)

## 📄 License

This project is provided as-is for demonstration purposes. Please refer to Webex terms of service for API usage.
