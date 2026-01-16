const { createClient } = require("redis")

const client = createClient({
  username: process.env.REDIS_USER,
  password: process.env.REDIS_PASS,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
})

client.on("connect", () => console.log("🧠 Redis Connected"))
client.on("error", (err) => console.error("Redis Error", err))

client.connect()

module.exports = client
