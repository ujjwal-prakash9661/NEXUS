async function askLLM(prompt) {
  try {
    const res = await fetch(`${process.env.OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral:latest",
        prompt,
        stream: false
      })
    })

    if (!res.ok) throw new Error("Ollama Service Unreachable")

    const data = await res.json()
    return data.response
  } catch (err) {
    console.warn("Local LLM (Ollama) failed, switching to fallback mode:", err.message)

    // Fallback Mock Responses for Demo
    const mocks = [
      "I've analyzed your request. Based on current security protocols, all systems are operating within normal parameters.",
      "Running a quick diagnostic... Your biometric data is secure and encrypted with AES-256.",
      "I can help you with that. Let me check the latest security logs for any anomalies.",
      "Processing your query through our neural network. The P2P connections are stable and secure.",
      "Unable to access deep storage at the moment, but preliminary scans show no threats.",
      "Acknowledged. Initiating protocol 77-Alpha. Stand by."
    ];


    // Simulate network delay for realism
    await new Promise(r => setTimeout(r, 1000));

    return `[FALLBACK MODE] ${mocks[Math.floor(Math.random() * mocks.length)]}`
  }
}

module.exports = { askLLM }
