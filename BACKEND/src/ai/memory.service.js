// const { ChromaClient } = require("chromadb")
// const { DefaultEmbeddingFunction } = require("@chroma-core/default-embed")

// const client = new ChromaClient({
//   path: process.env.CHROMA_URL
// })

// const embeddingFunction = new DefaultEmbeddingFunction()

async function getCollection() {
  // return await client.getOrCreateCollection({
  //   name: "nexus-memory",
  //   embeddingFunction
  // })
  return null
}

module.exports = { getCollection }
