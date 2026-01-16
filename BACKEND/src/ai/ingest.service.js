const { getCollection } = require("./memory.service")

async function ingestText(text, metadata = { source: "user" }) {
  const collection = await getCollection()
  if (!collection) return

  await collection.add({
    documents: [text],
    metadatas: [metadata],
    ids: [Date.now().toString()]
  })
}

async function getVectorCount() {
  const collection = await getCollection()
  if (!collection) return 0
  return await collection.count()
}

module.exports = { ingestText, getVectorCount }
