require('dotenv').config()
require("./src/services/redis.service")

const app = require('./src/app')
const connectDB = require('./src/db/db')

const http = require('http')
const { Server } = require('socket.io')

const socketStore = require('./src/socketInstance')

connectDB()

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    credentials : true
  }
})


app.set('io', io)
socketStore.set(io)

require('./src/sockets')(io)

const PORT = process.env.PORT

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)

  // Auto-start Vector DB
  // try {
  //   require('./src/db/chromaRunner')();
  // } catch (e) {
  //   console.log("Vector DB auto-start failed (Optional)");
  // }
})
