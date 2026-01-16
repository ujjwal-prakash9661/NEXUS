const RiskProfile = require("../models/RiskProfile")
const User = require("../models/User")

async function applyRisk(userId, reason, score) {
  const user = await User.findById(userId)
  if (!user) return

  user.riskScore += score
  user.riskFlags.push({ reason })

  if (user.riskScore >= 100) {
    user.status = "LOCKED"
    user.sessionVersion += 1
    user.online = false
  }

  if(user.status === "LOCKED")
  {
    user.lastRiskEvaluation = new Date()
  }

    if(user.riskScore >= 50 && user.status !== "LOCKED") 
    {
        user.status = "LOCKED"
        user.riskFlags.push("AUTO_LOCKED")
    }

  await user.save()
}

async function enforceIfDangerous(userId, score) {
  if (score >= 100) {
    await User.findByIdAndUpdate(userId, { status: "LOCKED" })
  }
}

module.exports = { applyRisk }
