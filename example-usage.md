# Example Usage

This document shows how to use the auto-reactor API.

## Step 1: Start the Server

```bash
npm start
# Server listening on port 8080
```

## Step 2: Generate QR Code

```bash
curl -X POST http://localhost:8080/qr \
  -H "Content-Type: application/json" \
  -c cookies.txt
```

Response:
```json
{
  "qr": "base64_qr_string",
  "qrDataUrl": "data:image/png;base64,..."
}
```

Scan the QR code with WhatsApp to authenticate.

## Step 3: Start Auto-Reactor

```bash
curl -X POST http://localhost:8080/start \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "channelId": "123456789",
    "emoji": "👍"
  }'
```

Response:
```json
{
  "success": true,
  "sessionId": "uuid",
  "channelId": "123456789",
  "emoji": "👍"
}
```

## Step 4: Monitor Status (WebSocket)

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data);
  
  // Examples:
  // { type: 'connected' }
  // { type: 'reactor_status', status: 'starting', sessionId: '...' }
  // { type: 'reactor_status', status: 'connected', sessionId: '...' }
  // { type: 'reactor_reacted', messageId: '...', emoji: '👍', sessionId: '...' }
  // { type: 'reactor_skip', reason: 'already_reacted', messageId: '...', sessionId: '...' }
  // { type: 'reactor_status', status: 'rate_limited', backoffSeconds: 30, sessionId: '...' }
};
```

## Step 5: Stop Auto-Reactor

```bash
curl -X POST http://localhost:8080/stop \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

Response:
```json
{
  "success": true,
  "sessionId": "uuid"
}
```

## Using x-session-id Header (Alternative to Cookies)

If you prefer not to use cookies, you can pass the session ID in the header:

```bash
# Extract sessionId from the QR response
SESSION_ID="your-session-id-here"

# Start reactor
curl -X POST http://localhost:8080/start \
  -H "Content-Type: application/json" \
  -H "x-session-id: $SESSION_ID" \
  -d '{
    "channelId": "123456789",
    "emoji": "❤️"
  }'

# Stop reactor
curl -X POST http://localhost:8080/stop \
  -H "Content-Type: application/json" \
  -H "x-session-id: $SESSION_ID"
```

## Channel ID Format

WhatsApp uses different JID formats:
- **Groups**: `123456789@g.us`
- **Channels**: `123456789@newsletter`
- **Individual Chats**: `1234567890@s.whatsapp.net`

The `channelId` should be the numeric part (before the `@`). The system will match any message where the remote JID includes this ID.

## Testing Rate Limiting

The system automatically detects and handles 429 rate limit errors:
1. When a rate limit is detected, the reactor enters backoff mode
2. Waits 30 seconds before resuming
3. Messages received during backoff are skipped
4. WebSocket emits `rate_limited` and `resumed` status events

## Testing Auto-Reconnect

If the connection drops:
1. The reactor automatically attempts to reconnect
2. Uses exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
3. Maximum 10 reconnection attempts
4. WebSocket emits `reconnecting` status events with attempt number and delay

## Session Persistence

Sessions are stored in the `sessions/` directory:
```
sessions/
  ├── <session-id-1>/
  │   ├── creds.json
  │   └── ... (other Baileys auth files)
  └── <session-id-2>/
      ├── creds.json
      └── ...
```

These persist across server restarts, so you don't need to re-scan QR codes.
