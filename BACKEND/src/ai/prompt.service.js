function buildPrompt(context, question) {
  return `
    You are NEXUS AI.

    Context:
    ${context}

    Question:
    ${question}

    Answer:
    `
}

module.exports = { buildPrompt }
