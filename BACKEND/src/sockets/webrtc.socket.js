const jwt = require('jsonwebtoken')
const User = require('../models/User')

module.exports = (io) => {

  const nsp = io.of('/webrtc')

  nsp.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) return next(new Error('NO_TOKEN'))

      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)

      if (!user) return next(new Error('NO_USER'))
      if (user.status !== 'APPROVED') return next(new Error('ACCESS_DENIED'))

      socket.user = user
      next()
    } catch {
      next(new Error('AUTH_FAILED'))
    }
  })

  nsp.on('connection', (socket) => {

    const userId = socket.user._id.toString()
    socket.join(userId)

    socket.on('offer', ({ to, offer }) => {
      nsp.to(to).emit('offer', { from: userId, offer })
    })

    socket.on('answer', ({ to, answer }) => {
      nsp.to(to).emit('answer', { from: userId, answer })
    })

    socket.on('ice-candidate', ({ to, candidate }) => {
      nsp.to(to).emit('ice-candidate', { from: userId, candidate })
    })

  })
}
