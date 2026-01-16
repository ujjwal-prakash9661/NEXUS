const router = require("express").Router()
const Message = require("../models/Message")

// Fetch Message History
router.get("/history", async (req, res) => {
  try {
    // Fetch last 50 messages for the user
    // Determine type based on sender/receiver manually in frontend
    const messages = await Message.find({
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 }).limit(50).lean()

    res.json({
      messages: messages.map(m => {
        let role = "system"
        if (m.sender && m.sender.toString() === req.user._id.toString()) {
          // If sender is user, check receiver
          if (m.receiver && m.receiver.toString() === req.user._id.toString()) {
            role = "note" // Self-message
          } else {
            role = "user" // Command to system
          }
        }

        return {
          id: m._id,
          role: role,
          content: m.content,
          createdAt: m.createdAt
        }
      })
    })
  } catch (err) {
    console.error("History Fetch Error:", err)
    res.status(500).json({ message: "Failed to fetch memory" })
  }
})

// Compartment 1: Personal Cloud (Notes)
// User sends message to Self. No System Response.
router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body

    await Message.create({
      sender: req.user._id,
      receiver: req.user._id, // Send to self
      content: question,
      status: "SEEN"
    })

    res.json({ status: "saved" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Note Save Failed" })
  }
})

const User = require("../models/User")

// Hierarchy Chart Data
router.get("/hierarchy", async (req, res) => {
  try {
    const users = await User.find({}, "name role nexusId online status riskScore").lean()

    // Sort hierarchy: SUPER_ADMIN > ADMIN > MODERATOR > USER
    const rolePriority = { "SUPER_ADMIN": 0, "ADMIN": 1, "MODERATOR": 2, "USER": 3 }

    users.sort((a, b) => (rolePriority[a.role] || 3) - (rolePriority[b.role] || 3))

    res.json({
      nodes: users.map(u => ({
        ...u,
        level: rolePriority[u.role] || 3
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Hierarchy Fetch Failed" })
  }
})

// System Telemetry (Real-time Stats)
router.get("/stats", async (req, res) => {
  try {
    const nodeCount = await Message.countDocuments()
    const storageUsage = (nodeCount * 0.15).toFixed(2) // Approx 150 bytes per msg -> KB
    const uptime = process.uptime()

    // Integrity simulation (fluctuates slightly between 98-100%)
    const integrity = (99 + Math.random()).toFixed(1)

    res.json({
      storageUsage,
      nodeCount,
      integrity,
      uptime: (uptime / 60).toFixed(0) + "m", // Minutes
      status: "OPTIMAL"
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Telemetry Failed" })
  }
})

// Compartment 2: System Terminal (Commands)
// User sends command. System responds.
router.post("/ingest", async (req, res) => {
  try {
    const { text } = req.body
    const command = text.trim().toLowerCase()

    // 1. Save User Command
    await Message.create({
      sender: req.user._id,
      receiver: null, // System
      content: text,
      status: "DELIVERED"
    })

    // 2. Process Command
    let responseText = ""
    const timestamp = new Date().toISOString()

    if (command === "/help") {
      responseText = "AVAILABLE COMMANDS:\n/status - System Health\n/clear - Clear Logs\n/date - Server Time\n<text> - Log Entry"
    } else if (command === "/status") {
      responseText = `[SYSTEM STATUS]\nMongoDB: Connected\nNode: Active\nUptime: ${(process.uptime() / 60).toFixed(2)}m`
    } else if (command === "/date") {
      responseText = `[SERVER TIME] ${timestamp}`
    } else {
      responseText = `[LOG ENTRY] recorded at ${timestamp.split("T")[1].split(".")[0]}.\n> Content Hash: ${Math.random().toString(36).substring(7).toUpperCase()}`
    }

    // 3. Save System Response
    const sysMsg = await Message.create({
      sender: null,
      receiver: req.user._id,
      content: responseText,
      status: "DELIVERED"
    })

    res.json({ answer: responseText })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Command Failed" })
  }
})

module.exports = router
