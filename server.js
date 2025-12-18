const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const { randomUUID } = require('crypto')
const QRCode = require('qrcode')
const logManager = require('./logManager')

const {
  default: makeWASocket,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys')

dotenv.config()

const PORT = Number(process.env.PORT) || 8080
const SESSIONS_ROOT = path.join(__dirname, 'sessions')

if (!fs.existsSync(SESSIONS_ROOT)) {
  fs.mkdirSync(SESSIONS_ROOT, { recursive: true })
}

const app = express()

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(
  cors({
    origin: true,
    credentials: true
  })
)

const socketsBySessionId = new Map()
const activeReactors = new Map()

async function createBaileysSession(sessionId, options = {}) {
  const sessionPath = path.join(SESSIONS_ROOT, sessionId)
  await fs.promises.mkdir(sessionPath, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      logManager.emitEvent('qr', sessionId)
    }

    if (connection) {
       logManager.emitEvent('connection', sessionId, { status: connection })
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const reason = lastDisconnect?.error?.message

      logManager.emitEvent('disconnected', sessionId, { statusCode, reason })

      if (statusCode === 429) {
          logManager.emitEvent('rate-limit', sessionId, { backoff: true })
      }

      const loggedOut = statusCode === DisconnectReason.loggedOut
      if (loggedOut) {
        socketsBySessionId.delete(sessionId)
  if (!options.skipConnectionHandler) {
    sock.ev.on('connection.update', (update) => {
      if (update.connection === 'close') {
        const statusCode = update.lastDisconnect?.error?.output?.statusCode
        const loggedOut = statusCode === DisconnectReason.loggedOut
        if (loggedOut) {
          socketsBySessionId.delete(sessionId)
        }
      }

      if (update.connection === 'open') {
        socketsBySessionId.set(sessionId, sock)
      }
    })
  }

  return sock
}

let wss = null

async function broadcastToClients(message) {
  if (!wss) return
  const payload = JSON.stringify(message)
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      client.send(payload)
    }
  }
}

    if (connection === 'open') {
      logManager.emitEvent('connected', sessionId)
      socketsBySessionId.set(sessionId, sock)
class AutoReactor {
  constructor(sessionId, channelId, emoji) {
    this.sessionId = sessionId
    this.channelId = channelId
    this.emoji = emoji
    this.sock = null
    this.reactedMessages = new Set()
    this.isRunning = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.isBackingOff = false
    this.messageHandler = null
    this.connectionHandler = null
  }

  async start() {
    if (this.isRunning) {
      return
    }

  sock.ev.on('messages.upsert', (m) => {
    if (m.messages && m.messages.length > 0) {
      for (const msg of m.messages) {
        if (msg.message && msg.message.reactionMessage) {
           logManager.emitEvent('reacted', sessionId, {
             text: msg.message.reactionMessage.text,
             key: msg.message.reactionMessage.key
           })
        }
      }
    }
  })

  return sock
    this.isRunning = true
    await this.connect()
  }

  async connect() {
    try {
      const sessionPath = path.join(SESSIONS_ROOT, this.sessionId)
      
      if (!fs.existsSync(sessionPath)) {
        throw new Error('Session not found')
      }

      if (this.sock) {
        try {
          if (this.messageHandler) {
            this.sock.ev.off('messages.upsert', this.messageHandler)
          }
          if (this.connectionHandler) {
            this.sock.ev.off('connection.update', this.connectionHandler)
          }
        } catch (err) {
        }
      }

      this.sock = await createBaileysSession(this.sessionId, { skipConnectionHandler: true })

      this.connectionHandler = async (update) => {
        if (update.connection === 'open') {
          this.reconnectAttempts = 0
          await broadcastToClients({
            type: 'reactor_status',
            status: 'connected',
            sessionId: this.sessionId
          })
        }

        if (update.connection === 'close') {
          const statusCode = update.lastDisconnect?.error?.output?.statusCode
          const loggedOut = statusCode === DisconnectReason.loggedOut

          await broadcastToClients({
            type: 'reactor_status',
            status: 'disconnected',
            sessionId: this.sessionId,
            reason: loggedOut ? 'logged_out' : 'connection_lost'
          })

          if (loggedOut) {
            this.isRunning = false
            activeReactors.delete(this.sessionId)
            return
          }

          if (this.isRunning && this.reconnectAttempts < this.maxReconnectAttempts) {
            await this.reconnect()
          }
        }
      }

      this.messageHandler = async (update) => {
        if (update.type !== 'notify') {
          return
        }
        const messages = update.messages || []
        for (const msg of messages) {
          await this.handleMessage(msg)
        }
      }

      this.sock.ev.on('connection.update', this.connectionHandler)
      this.sock.ev.on('messages.upsert', this.messageHandler)

      await broadcastToClients({
        type: 'reactor_status',
        status: 'starting',
        sessionId: this.sessionId
      })

    } catch (error) {
      await broadcastToClients({
        type: 'reactor_error',
        error: error.message,
        sessionId: this.sessionId
      })
      throw error
    }
  }

  async reconnect() {
    this.reconnectAttempts++
    const backoffMs = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000)

    await broadcastToClients({
      type: 'reactor_status',
      status: 'reconnecting',
      sessionId: this.sessionId,
      attempt: this.reconnectAttempts,
      delayMs: backoffMs
    })

    await new Promise(resolve => setTimeout(resolve, backoffMs))

    if (this.isRunning) {
      await this.connect()
    }
  }

  async handleMessage(msg) {
    try {
      if (!msg.message || msg.key.fromMe) {
        return
      }

      const messageId = msg.key.id
      const remoteJid = msg.key.remoteJid

      if (!remoteJid.includes(this.channelId)) {
        return
      }

      if (this.reactedMessages.has(messageId)) {
        await broadcastToClients({
          type: 'reactor_skip',
          reason: 'already_reacted',
          messageId,
          sessionId: this.sessionId
        })
        return
      }

      if (this.isBackingOff) {
        await broadcastToClients({
          type: 'reactor_skip',
          reason: 'backing_off',
          messageId,
          sessionId: this.sessionId
        })
        return
      }

      await this.reactToMessage(msg.key)

    } catch (error) {
      await broadcastToClients({
        type: 'reactor_error',
        error: error.message,
        sessionId: this.sessionId
      })
    }
  }

  async reactToMessage(messageKey) {
    try {
      await this.sock.sendMessage(messageKey.remoteJid, {
        react: {
          text: this.emoji,
          key: messageKey
        }
      })

      this.reactedMessages.add(messageKey.id)

      await broadcastToClients({
        type: 'reactor_reacted',
        messageId: messageKey.id,
        emoji: this.emoji,
        sessionId: this.sessionId
      })

    } catch (error) {
      if (error.output?.statusCode === 429 || error.message?.includes('429') || error.message?.includes('rate')) {
        await this.handleRateLimit()
      } else {
        throw error
      }
    }
  }

  async handleRateLimit() {
    this.isBackingOff = true

    await broadcastToClients({
      type: 'reactor_status',
      status: 'rate_limited',
      sessionId: this.sessionId,
      backoffSeconds: 30
    })

    await new Promise(resolve => setTimeout(resolve, 30000))

    this.isBackingOff = false

    await broadcastToClients({
      type: 'reactor_status',
      status: 'resumed',
      sessionId: this.sessionId
    })
  }

  async stop() {
    this.isRunning = false

    if (this.messageHandler && this.sock) {
      this.sock.ev.off('messages.upsert', this.messageHandler)
    }

    if (this.connectionHandler && this.sock) {
      this.sock.ev.off('connection.update', this.connectionHandler)
    }

    if (this.sock) {
      await this.sock.end()
    }

    await broadcastToClients({
      type: 'reactor_status',
      status: 'stopped',
      sessionId: this.sessionId
    })

    activeReactors.delete(this.sessionId)
  }
}

function waitForQr(sock, { timeoutMs = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out waiting for QR'))
    }, timeoutMs)

    const onConnectionUpdate = (update) => {
      if (update.qr) {
        cleanup()
        resolve(update.qr)
        return
      }

      if (update.connection === 'close') {
        cleanup()
        reject(new Error('Connection closed before QR was received'))
      }
    }

    const cleanup = () => {
      clearTimeout(timer)
      sock.ev.off('connection.update', onConnectionUpdate)
    }

    sock.ev.on('connection.update', onConnectionUpdate)
  })
}

app.post('/qr', async (req, res) => {
  try {
    const sessionId = randomUUID()
    const sock = await createBaileysSession(sessionId)

    const qrString = await waitForQr(sock)

    const qrPngBuffer = await QRCode.toBuffer(qrString, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320
    })

    const qrBase64 = qrPngBuffer.toString('base64')
    const qrDataUrl = `data:image/png;base64,${qrBase64}`

    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    })

    res.status(200).json({ qr: qrBase64, qrDataUrl })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to generate QR' })
  }
})

app.post('/start', async (req, res) => {
  try {
    const { channelId, emoji } = req.body
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id']

    if (!sessionId) {
      return res.status(401).json({ error: 'No session found' })
    }

    if (!channelId || !emoji) {
      return res.status(400).json({ error: 'channelId and emoji are required' })
    }

    const sessionPath = path.join(SESSIONS_ROOT, sessionId)
    if (!fs.existsSync(sessionPath)) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (activeReactors.has(sessionId)) {
      return res.status(409).json({ error: 'Reactor already running for this session' })
    }

    const reactor = new AutoReactor(sessionId, channelId, emoji)
    activeReactors.set(sessionId, reactor)

    await reactor.start()

    res.status(200).json({ 
      success: true,
      sessionId,
      channelId,
      emoji
    })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to start reactor' })
  }
})

app.post('/stop', async (req, res) => {
  try {
    const sessionId = req.cookies?.sessionId || req.headers['x-session-id']

    if (!sessionId) {
      return res.status(401).json({ error: 'No session found' })
    }

    const reactor = activeReactors.get(sessionId)

    if (!reactor) {
      return res.status(404).json({ error: 'No active reactor found for this session' })
    }

    await reactor.stop()

    res.status(200).json({ 
      success: true,
      sessionId
    })
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to stop reactor' })
  }
})

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true })
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

logManager.initialize(server)
wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected' }))
})
