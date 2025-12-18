const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const { randomUUID } = require('crypto')
const QRCode = require('qrcode')
const { WebSocketServer } = require('ws')

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
app.use(
  cors({
    origin: true,
    credentials: true
  })
)

const socketsBySessionId = new Map()

async function createBaileysSession(sessionId) {
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

  return sock
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

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true })
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected' }))
})
