const { WebSocketServer } = require('ws')

class LogManager {
  constructor() {
    this.history = []
    this.maxHistory = 100
    this.clients = new Set()
  }

  initialize(server) {
    this.wss = new WebSocketServer({ server, path: '/logs' })
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws)
      
      // Send history immediately upon connection
      ws.send(JSON.stringify({ 
        type: 'history', 
        events: this.history 
      }))
      
      ws.on('close', () => {
        this.clients.delete(ws)
      })
      
      ws.on('error', (err) => {
        console.error('WebSocket client error:', err)
        this.clients.delete(ws)
      })
    })
  }

  emitEvent(eventType, sessionId, payload = {}) {
    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: eventType,
      sessionId,
      ...payload
    }

    // Add to history
    this.history.push(event)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }

    // Broadcast to all clients
    const message = JSON.stringify({ type: 'event', event })
    for (const client of this.clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message)
      }
    }
  }
}

// We need crypto for randomUUID, but it's available in global or via require in Node 20
const crypto = require('crypto')

module.exports = new LogManager()
