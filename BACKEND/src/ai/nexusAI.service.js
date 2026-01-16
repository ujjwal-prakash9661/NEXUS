const { retrieveContext } = require("./rag.service")
const { ingestText } = require("./ingest.service")
const { buildPrompt } = require("./prompt.service")
const { askLLM } = require("../services/llm.service")
const User = require("../models/User")

async function askNexus(userId, question) {

  const user = await User.findById(userId)

  const context = await retrieveContext(question)

  const prompt = buildPrompt(
    context + `\nUser Risk Score: ${user.riskScore}`,
    question
  )

  const answer = await askLLM(prompt)

  await autoLearn(question, answer)

  return answer
}

async function autoLearn(question, answer) {
  if (question.length > 15) {
    await ingestText(question, { source: "conversation" })
    await ingestText(answer, { source: "nexus-response" })
  }
}

module.exports = { askNexus }
