const bcrypt = require('bcryptjs')
const User = require('../models/User')

exports.enrollFace = async (req, res) => {
  const { descriptors } = req.body

  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    return res.status(400).json({ message: 'Invalid face data' })
  }

  req.user.faceDescriptors = descriptors
  await req.user.save()

  res.json({ message: 'Face enrollment complete' })
}

function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0))
}

exports.verifyFace = async (req, res) => {
  const { descriptor } = req.body
  const stored = req.user.faceDescriptors

  if (!stored || stored.length === 0) {
    return res.status(400).json({ message: 'No enrolled face found' })
  }

  const distances = stored.map(d => euclidean(d, descriptor))
  const min = Math.min(...distances)

  if (min < 0.45) {
    return res.json({ match: true })
  } else {
    return res.json({ match: false })
  }
}


exports.setPin = async (req, res) => {
  const { pin, fingerprintId } = req.body
  const hash = await bcrypt.hash(pin, 10)
  req.user.pinHash = hash
  req.user.fingerprintId = fingerprintId
  await req.user.save()
  res.json({ message: 'PIN & Fingerprint saved' })
}

exports.presenceCheck = async (req, res) => {
  console.log(`[Presence] Checking ${req.user.email} - ${new Date().toISOString()}`)
  const { descriptor } = req.body

  const stored = req.user.faceDescriptors

  // If user has no face enrolled, skip presence check (allow them to enroll)
  if (!stored || stored.length === 0) {
    return res.json({ status: 'ACTIVE', note: 'NO_FACE_ENROLLED' })
  }

  const distances = stored.map(d => euclidean(d, descriptor))
  const min = Math.min(...distances)

  if (min < 0.45) {
    req.user.lastSeen = new Date()
    await req.user.save()
    return res.json({ status: 'ACTIVE' })
  }

  return res.status(403).json({ status: 'LOCKED' })
}
