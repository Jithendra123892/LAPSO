import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  // Device subscriptions: userId -> Set of deviceIds
  const deviceSubscriptions = new Map()

  io.on('connection', (socket) => {
    const { userId, token } = socket.handshake.auth || {}
    if (!userId) {
      socket.disconnect()
      return
    }

    console.log(`[WS] User ${userId} connected`)

    // Track user's device subscriptions
    if (!deviceSubscriptions.has(userId)) {
      deviceSubscriptions.set(userId, new Set())
    }

    // Subscribe to a device's live updates
    socket.on('subscribe:device', (deviceId) => {
      deviceSubscriptions.get(userId)?.add(deviceId)
      socket.join(`device:${deviceId}`)
      console.log(`[WS] User ${userId} subscribed to device ${deviceId}`)
    })

    // Unsubscribe
    socket.on('unsubscribe:device', (deviceId) => {
      deviceSubscriptions.get(userId)?.delete(deviceId)
      socket.leave(`device:${deviceId}`)
    })

    // Disconnect cleanup
    socket.on('disconnect', () => {
      deviceSubscriptions.delete(userId)
      console.log(`[WS] User ${userId} disconnected`)
    })
  })

  // Expose io globally for API routes to emit events
  global.lapsoIO = io

  const PORT = process.env.PORT || 3000
  httpServer.listen(PORT, () => {
    console.log(`> LAPSO ready on http://localhost:${PORT}`)
    console.log(`> WebSocket server running`)
  })
})