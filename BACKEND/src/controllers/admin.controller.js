const User = require('../models/User')
const { sendMail } = require('../services/mail.service')
const audit = require("../services/audit.service")
const { getIO } = require('../socketInstance')
const socketStore = require('../socketInstance')

const Message = require('../models/Message')
const { applyRisk } = require("../ai/riskEngine.service")
const RiskProfile = require("../models/RiskProfile")


exports.getPendingUsers = async (req, res) => {
  const users = await User.find({ status: 'PENDING' })
  res.json(users)
}

exports.approveUser = async (req, res) => {
  console.log("APPROVE API HIT", req.body.userId)

  const user = await User.findByIdAndUpdate(
    req.body.userId,
    { status: 'APPROVED' },
    { new: true }
  )

  console.log("UPDATED USER:", user)

  if (!user) return res.status(404).json({ message: 'User not found' })

  await audit.log(req.user._id, "APPROVED_USER", user._id.toString(), req.ip)

  res.json({ message: 'User approved', user })
}

exports.lockUser = async (req, res) => {
  const { userId } = req.body

  const user = await User.findByIdAndUpdate(userId, { status: 'LOCKED' }, { new: true })

  await sendMail(
    user.email,
    'NEXUS Access Locked',
    `<h2>Security Alert</h2><p>Your account has been locked.</p>`
  )

  await audit.log(req.user._id, "LOCKED_USER", user._id.toString(), req.ip)

  await applyRisk(user._id.toString(), "ADMIN_LOCK", 30)


  res.json({ message: 'User locked & email sent' })
}

exports.getOverview = async (req, res) => {
  const totalUsers = await User.countDocuments()
  const onlineUsers = await User.countDocuments({ online: true })
  const pendingUsers = await User.countDocuments({ status: 'PENDING' })

  res.json({ totalUsers, onlineUsers, pendingUsers })
}

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select('-faceDescriptors -pinHash')
  res.json(users)
}

const Audit = require('../models/AuditLog')

exports.getActivityLog = async (req, res) => {
  try {
    const logs = await Audit.find()
      .populate('actor', 'name nexusId email')
      .sort({ createdAt: -1 })
      .limit(50)
    res.json(logs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch activity logs" })
  }
}

exports.forceLockUser = async (req, res) => {
  const { userId } = req.body

  const user = await User.findById(userId)
  if (!user) return res.status(404).json({ message: 'User not found' })

  user.status = 'LOCKED'
  user.online = false
  await user.save()

  await audit.log(
    req.user._id.toString(),
    "FORCE_LOCK_USER",
    user._id.toString(),
    req.ip,
    {}
  )

  await applyRisk(user._id.toString(), "FORCE_LOCK", 50)

  const io = socketStore.get()
  io.to(userId).emit("force-logout")

  res.json({ message: 'User locked immediately & session terminated' })
}

exports.getDashboardSummary = async (req, res) => {
  const totalUsers = await User.countDocuments()
  const onlineUsers = await User.countDocuments({ online: true })
  const pendingUsers = await User.countDocuments({ status: 'PENDING' })
  const lockedUsers = await User.countDocuments({ status: 'LOCKED' })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const messagesToday = await Message.countDocuments({
    createdAt: { $gte: today }
  })

  res.json({
    totalUsers,
    onlineUsers,
    pendingUsers,
    lockedUsers,
    messagesToday
  })
}

exports.getRiskProfile = async (req, res) => {
  const profile = await RiskProfile.findOne({ user: req.params.id })
  res.json(profile)
}

