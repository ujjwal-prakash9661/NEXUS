const { ingestText } = require("./ingest.service")

async function evaluateEvent(event) {
  const { type, actor, target, meta } = event

  let risk = 0

  if (type === "LOGIN_FAILED") risk += 20
  if (type === "LOCKED_USER") risk += 50
  if (type === "FORCE_LOCK_USER") risk += 80
  if (type === "MESSAGE_SENT" && meta?.includes("password")) risk += 40

  const insight = `Event: ${type}, Actor: ${actor}, Target: ${target}, RiskScore: ${risk}`

  await ingestText(insight, { source: "ai-decision", risk })

  return { risk, insight }
}

module.exports = { evaluateEvent }
