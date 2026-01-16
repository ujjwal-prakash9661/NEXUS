const Audit = require("../models/AuditLog")
const { evaluateEvent } = require("../ai/decision.engine")

exports.log = async (userId, action, target, ip, meta = {}) => {
  try {
    const entry = await Audit.create({
      actor: userId,
      action,
      target,
      ip,
      meta
    })

    // Fire and forget evaluation to prevent blocking
    evaluateEvent({
      type: action,
      actor: userId,
      target,
      meta
    }).catch(err => console.error("Audit AI Evaluation Failed:", err.message))

    return entry
  } catch (err) {
    console.error("Audit Log Failed:", err.message)
    // Do not throw, return null to allow flow to continue
    return null
  }
}

