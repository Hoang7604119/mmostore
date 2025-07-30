const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = process.env.PORT || 3000

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? 'http://localhost:3000' : [
        process.env.NEXT_PUBLIC_APP_URL,
        'https://mmostore.site',
        'https://www.mmostore.site',
        /\.vercel\.app$/
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  })

  // Store io instance globally for use in API routes
  global.io = io

  // Handle Socket.io connections
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Join user to their personal room for notifications
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`)
      console.log(`User ${userId} joined their room`)
    })

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation-${conversationId}`)
      console.log(`User joined conversation: ${conversationId}`)
    })

    // Leave conversation room
    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conversation-${conversationId}`)
      console.log(`User left conversation: ${conversationId}`)
    })

    // Handle new message
    socket.on('new-message', (data) => {
      console.log('New message received:', data)
      // Broadcast to conversation room
      socket.to(`conversation-${data.conversationId}`).emit('message-received', data)
      // Note: Removed notification emission for messages - they should only appear in MessageIcon
    })

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
        userId: data.userId,
        username: data.username
      })
    })

    socket.on('typing-stop', (data) => {
      socket.to(`conversation-${data.conversationId}`).emit('user-stopped-typing', {
        userId: data.userId
      })
    })

    // Handle message read status
    socket.on('message-read', (data) => {
      socket.to(`conversation-${data.conversationId}`).emit('message-read-update', data)
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.io server initialized')
    })
})