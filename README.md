# Consent Track Backend

WhatsApp auto-reactor service using Baileys library.

## Features

- WhatsApp QR code authentication
- Auto-react to messages in specified channels
- Rate limiting protection (429 handling)
- Auto-reconnect with exponential backoff
- Real-time WebSocket status updates
- Session persistence across restarts

## API Endpoints

### POST /qr
Generate QR code for WhatsApp authentication.

**Response:**
```json
{
  "qr": "base64_encoded_qr",
  "qrDataUrl": "data:image/png;base64,..."
}
```

Sets `sessionId` cookie for subsequent requests.

### POST /start
Start auto-reactor for a channel.

**Headers:**
- `Cookie: sessionId=<session-id>` or
- `x-session-id: <session-id>`

**Body:**
```json
{
  "channelId": "123456789",
  "emoji": "👍"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid",
  "channelId": "123456789",
  "emoji": "👍"
}
```

### POST /stop
Stop active auto-reactor.

**Headers:**
- `Cookie: sessionId=<session-id>` or
- `x-session-id: <session-id>`

**Response:**
```json
{
  "success": true,
  "sessionId": "uuid"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "ok": true
}
```

## WebSocket Events

Connect to WebSocket at `ws://localhost:8080` to receive real-time status updates.

### Event Types

**reactor_status**
```json
{
  "type": "reactor_status",
  "status": "starting|connected|disconnected|reconnecting|rate_limited|resumed|stopped",
  "sessionId": "uuid",
  "attempt": 1,
  "delayMs": 1000,
  "backoffSeconds": 30,
  "reason": "logged_out|connection_lost"
}
```

**reactor_reacted**
```json
{
  "type": "reactor_reacted",
  "messageId": "msg_id",
  "emoji": "👍",
  "sessionId": "uuid"
}
```

**reactor_skip**
```json
{
  "type": "reactor_skip",
  "reason": "already_reacted|backing_off",
  "messageId": "msg_id",
  "sessionId": "uuid"
}
```

**reactor_error**
```json
{
  "type": "reactor_error",
  "error": "error message",
  "sessionId": "uuid"
}
```

## Guards & Safety Features

### 1. Single Reaction Per Message
Each message is tracked in memory to prevent duplicate reactions.

### 2. Auto-Reconnect with Exponential Backoff
- Automatically reconnects on connection loss
- Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
- Maximum 10 reconnection attempts
- Stops on logout

### 3. Rate Limit Protection
- Detects HTTP 429 errors
- Automatically backs off for 30 seconds
- Resumes operation after backoff period
- Queued messages are skipped during backoff

## Environment Variables

Create a `.env` file:

```
PORT=8080
```

## Development

```bash
# Install dependencies
npm install

# Start development server (with watch mode)
npm run dev

# Start production server
npm start
```

## Session Persistence

WhatsApp authentication sessions are stored in the `sessions/` directory and persist across server restarts. Each session is identified by a UUID.

## Architecture

- **Express**: HTTP server and REST API
- **Baileys**: WhatsApp Web API library
- **WebSocket**: Real-time event streaming
- **Multi-file Auth State**: Persistent session storage
# Consent Track

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/aliiiiiii-1/Consent-track)

A privacy-focused consent management and tracking application built with React and Node.js. This application helps organizations manage user consent in compliance with GDPR and other privacy regulations.

## 🚀 Features

- **Consent Management**: Create, update, and track user consent preferences
- **GDPR Compliance**: Built-in features to help with GDPR and privacy regulation compliance
- **User Dashboard**: Intuitive interface for users to manage their consent preferences
- **Analytics**: Track consent rates and user engagement
- **Multi-platform Deployment**: Ready for Railway.app and Render.com deployment
- **Docker Support**: Multi-stage Docker build for optimal image size

## 🛠 Tech Stack

- **Frontend**: React.js with modern hooks and components
- **Backend**: Node.js with Express.js
- **Database**: (Configurable - supports various databases)
- **Deployment**: Docker, Railway.app, Render.com
- **Package Manager**: npm

## 📦 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/aliiiiiii-1/Consent-track.git
   cd Consent-track
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

This will start both the client and server in development mode.

### Building for Production

```bash
npm run build
npm start
```

## 🚀 Deployment

### Deploy on Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/aliiiiiii-1/Consent-track)

Click the button above to deploy directly to Railway.app. Railway provides automatic deployments from your GitHub repository.

### Deploy on Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/aliiiiiii-1/Consent-track)

Alternatively, you can deploy to Render.com using the button above.

### Manual Deployment

#### Using Docker

```bash
# Build the Docker image
docker build -t consent-track .

# Run the container
docker run -p 8080:8080 consent-track
```

#### Manual Railway Deployment

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Deploy: `railway up`

#### Manual Render Deployment

1. Connect your GitHub repository to Render.com
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Deploy

## 🔧 Environment Variables

The following environment variables are supported:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment mode | `production` |

### Railway Environment Variables

Set these in your Railway dashboard:
- `PORT=8080`
- `NODE_ENV=production`

### Render Environment Variables

Set these in your Render dashboard:
- `PORT=8080`
- `NODE_ENV=production`

## 📁 Project Structure

```
consent-track/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/
│   ├── models/
│   └── package.json
├── sessions/              # Session storage
├── Dockerfile            # Multi-stage Docker build
├── railway.json          # Railway deployment config
├── render.yaml           # Render deployment config
├── package.json          # Root package.json
├── .env.example          # Environment variables template
└── README.md
```

## 🐳 Docker Image Size

The final Docker image is optimized to be approximately 80 MB through multi-stage builds:
- Stage 1: Build dependencies and React frontend
- Stage 2: Runtime with only production dependencies

## 📝 Scripts

- `npm start` - Start the production server
- `npm run client:build` - Build the React frontend
- `npm run build` - Build for production
- `npm run dev` - Start development servers
- `npm run install:all` - Install all dependencies (root, client, server)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Privacy & Security

This application is designed with privacy-first principles:
- Minimal data collection
- User consent tracking
- GDPR compliance features
- Secure session management

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the existing [Issues](https://github.com/aliiiiiii-1/Consent-track/issues)
2. Create a new issue with detailed information
3. Contact the development team

---

**Built with ❤️ for privacy and consent management**
