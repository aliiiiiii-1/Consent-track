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
