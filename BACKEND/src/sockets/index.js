const User = require('../models/User')
const jwt = require('jsonwebtoken')
const Message = require('../models/Message')
const redis = require('../services/redis.service')
const audit = require('../services/audit.service')

module.exports = (io) => {

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error("NO_TOKEN"))

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)

      if (!user) return next(new Error("NO_USER"))
      if (user.status === "LOCKED") return next(new Error("ACCOUNT_LOCKED"))

      socket.user = user
      next()
    } catch (err) {
      next(new Error("AUTH_FAILED"))
    }
  })

  io.on('connection', async (socket) => {

    const userId = socket.user._id.toString()
    socket.join(userId)

    async function deliverQueue() {
      let msgId
      while (msgId = await redis.lPop(`queue:user:${userId}`)) {
        const message = await Message.findById(msgId)
        if (!message) continue

        socket.emit('incoming-message', message)
        message.status = 'DELIVERED'
        await message.save()
      }
    }

    await deliverQueue()

    await User.findByIdAndUpdate(userId, {
      online: true,
      lastSeen: new Date()
    })

    socket.on('message-delivered', async (messageId) => {
      await Message.findByIdAndUpdate(messageId, {
        status: 'DELIVERED'
      })
    })

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(userId, {
        online: false,
        lastSeen: new Date()
      })

      await audit.log(socket.user._id, "USER_LOGOUT", null, socket.handshake.address)
    })

    socket.on("webrtc-offer", ({ to, offer, isDataOnly }) => {
      // Debug log
      console.log(`[SIGNALING] Offer from ${socket.user._id} to ${to} (DataOnly: ${isDataOnly})`)
      io.to(to).emit("webrtc-offer", {
        from: socket.user._id.toString(),
        offer,
        isDataOnly
      })
    })

    socket.on("webrtc-answer", ({ to, answer }) => {
      console.log(`[SIGNALING] Answer from ${socket.user._id} to ${to}`)
      io.to(to).emit("webrtc-answer", {
        from: socket.user._id.toString(),
        answer
      })
    })

    socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
      console.log(`[SIGNALING] ICE Candidate from ${socket.user._id} to ${to}`)
      io.to(to).emit("webrtc-ice-candidate", {
        from: socket.user._id.toString(),
        candidate
      })
    })

    socket.on("ping-user", async ({ targetId }) => {
      console.log(`[PING] From ${socket.user._id} to ${targetId}`)
      io.to(targetId).emit("ping-received", {
        from: socket.user._id,
        fromName: socket.user.name,
        fromNexusId: socket.user.nexusId,
        timestamp: new Date()
      })
    })

    socket.on("force-logout", () => {
      console.log("User force logged out")
      socket.disconnect(true)
    })
  })
  // require('./webrtc.socket')(io) -- Removing to use single namespace signaling
}

