const jwt = require('jsonwebtoken')
const User = require('../models/User')

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) return res.status(401).json({ message: 'No token' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)

    if (!user) return res.status(401).json({ message: 'User not found' })

    if (user.status === 'LOCKED')
      return res.status(403).json({ message: 'ACCOUNT_LOCKED' })

    if (user.status !== 'APPROVED')
      return res.status(403).json({ message: 'AWAITING_APPROVAL' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'INVALID_TOKEN' })
  }
}
