const { OAuth2Client } = require('google-auth-library')
const User = require('../models/User')
const createNexusId = require('../services/nexusId.service')
const createToken = require('../services/jwt.service')
const audit = require('../services/audit.service')
const { applyRisk } = require("../ai/riskEngine.service")
const bcrypt = require('bcryptjs')
const axios = require('axios')

function euclidean(a, b) {
  return Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0))
}


const client = new OAuth2Client()

exports.googleAuth = async (req, res) => {
  try {
    const { idToken, accessToken } = req.body

    let email, name;

    if (accessToken) {
      // Access Token Flow (from custom button)
      const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
      email = userResponse.data.email
      name = userResponse.data.name
    } else if (idToken) {
      // ID Token Flow (Legacy/Standard)
      const ticket = await client.verifyIdToken({ idToken })
      const payload = ticket.getPayload()
      email = payload.email
      name = payload.name
    } else {
      return res.status(400).json({ message: "Token missing" })
    }

    let user = await User.findOne({ email })

    if (!user) {
      user = await User.create({
        email,
        name,
        oauthProvider: 'GOOGLE',
        nexusId: createNexusId()
      })
    }

    if (user.status !== 'APPROVED') {
      await audit.log(
        null,
        "ACCESS_DENIED",
        user._id.toString(),
        req.ip,
        { status: user.status }
      )

      return res.status(403).json({
        message: `Access denied: ${user.status}`
      })
    }

    await audit.log(
      user._id,
      "USER_LOGIN",
      null,
      req.ip,
      { email: user.email }
    )

    const token = createToken({ id: user._id, role: user.role, sv: user.sessionVersion })

    user.accessToken = token;
    user.online = true;
    await user.save();

    res.json({ token, status: user.status, user: { id: user._id, name: user.name, role: user.role, nexusId: user.nexusId, email: user.email } })

  } catch (err) {
    console.error(err)

    if (err?.decoded?.id) {
      await applyRisk(err.decoded.id, "AUTH_FAILURE", 10)
    }

    res.status(401).json({ message: "Authentication failed" })
  }
}

exports.demoAuth = async (req, res) => {
  try {
    const demoEmail = "demo@nexus.sys"

    let user = await User.findOne({ email: demoEmail })

    if (!user) {
      user = await User.create({
        email: demoEmail,
        name: "Nexus Demo User",
        oauthProvider: "DEMO",
        nexusId: createNexusId(),
        status: "APPROVED"
      })
    }

    // Always log successful demo login
    await audit.log(
      user._id,
      "DEMO_LOGIN",
      null,
      req.ip,
      { email: user.email }
    )

    const token = createToken({ id: user._id, role: user.role, sv: user.sessionVersion })

    user.accessToken = token;
    user.online = true;
    await user.save();

    res.json({ token, status: user.status, user: { id: user._id, name: user.name, role: user.role, nexusId: user.nexusId, email: user.email } })

  } catch (err) {
    console.error("Demo Auth Error:", err)
    res.status(500).json({ message: "Demo Login Failed" })
  }
}


exports.faceRegister = async (req, res) => {
  try {
    const { email, name, descriptor } = req.body

    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({ message: "Invalid face descriptor" })
    }

    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({ message: "User already exists" })
    }

    user = await User.create({
      email,
      name,
      faceDescriptors: [descriptor],
      oauthProvider: 'FACE',
      nexusId: createNexusId(),
      status: 'APPROVED' // Auto-approve for demo simplicity, restricted in real prod
    })

    await audit.log(user._id, "FACE_REGISTER", null, req.ip, { email })

    const token = createToken({ id: user._id, role: user.role, sv: user.sessionVersion })

    user.accessToken = token;
    user.online = true;
    await user.save();

    res.json({ token, user: { id: user._id, name: user.name, role: user.role, nexusId: user.nexusId, email: user.email } })

  } catch (err) {
    console.error("Face Register Error:", err)
    res.status(500).json({ message: "Registration failed" })
  }
}

exports.faceLogin = async (req, res) => {
  try {
    const { descriptor } = req.body

    if (!descriptor || descriptor.length !== 128) {
      return res.status(400).json({ message: "Invalid descriptor" })
    }

    // optimizing: strictly, we should use a vector db. 
    // for this demo/prototype, we fetch all users with face data.
    // In production with many users, this is NOT scalable.
    const users = await User.find({ faceDescriptors: { $not: { $size: 0 } } })

    let matchUser = null
    let minDistance = 1.0

    for (const user of users) {
      for (const storedDesc of user.faceDescriptors) {
        const dist = euclidean(storedDesc, descriptor)
        if (dist < 0.45 && dist < minDistance) {
          minDistance = dist
          matchUser = user
        }
      }
    }

    if (!matchUser) {
      return res.status(401).json({ message: "Face not recognized" })
    }

    await audit.log(matchUser._id, "FACE_LOGIN", null, req.ip, { distance: minDistance })
    const token = createToken({ id: matchUser._id, role: matchUser.role, sv: matchUser.sessionVersion })

    matchUser.accessToken = token;
    matchUser.online = true;
    await matchUser.save();

    res.json({ token, user: { id: matchUser._id, name: matchUser.name, role: matchUser.role, nexusId: matchUser.nexusId, email: matchUser.email } })

  } catch (err) {
    console.error("Face Login Error:", err)
    res.status(500).json({ message: "Login failed" })
  }
}

exports.refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const oldToken = authHeader && authHeader.split(' ')[1]

    if (!oldToken) return res.status(401).json({ message: "No token provided" })

    // Verify it matches DB record
    const user = await User.findOne({ accessToken: oldToken })
    if (!user) {
      return res.status(403).json({ message: "Invalid session or token revoked" })
    }

    // Generate new token
    const newToken = createToken({ id: user._id, role: user.role, sv: user.sessionVersion })

    // Update DB
    user.accessToken = newToken
    await user.save()

    res.json({ token: newToken })

  } catch (err) {
    console.error("Refresh Token Error:", err)
    res.status(500).json({ message: "Refresh failed" })
  }
}

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (user) {
      user.accessToken = null
      user.online = false
      await user.save()
    }

    // Also emit socket logout if needed
    // const io = require('../socketInstance').get()
    // io.to(user._id.toString()).emit('force-logout')

    res.json({ message: "Logged out successfully" })
  } catch (err) {
    console.error("Logout Error:", err)
    res.status(500).json({ message: "Logout failed" })
  }
}
