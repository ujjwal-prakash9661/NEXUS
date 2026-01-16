const { getCollection } = require("./memory.service")

async function retrieveContext(query) {
  const collection = await getCollection()
  if (!collection) return ""

  const results = await collection.query({
    queryTexts: [query],
    nResults: 3
  })

  return results.documents.flat().join("\n")
}

module.exports = { retrieveContext }
