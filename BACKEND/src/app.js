const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const authRoutes = require('./routes/auth.route')
const protectedRoutes = require('./routes/protected.route')
const adminRoutes = require('./routes/admin.route')
const vaultRoutes = require('./routes/vault.route')
const path = require("path");

const healthRoutes = require('./routes/health.route')

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))
app.use('/api/uploads', express.static('uploads'))

app.use(express.static(path.join(__dirname, "../public")));

app.use('/api/auth', authRoutes)
app.use('/api', protectedRoutes)
app.use('/api/vault', vaultRoutes)
app.use('/api/admin', require('./routes/admin.route'))

app.use("/api/chat", require("./routes/chat.route"))

const auth = require('./middlewares/auth.middleware') // Move this to top if possible, but localized require is valid too for this edit
app.use("/api/ai", auth, require("./routes/ai.route"))
app.use("/api/tools", require("./routes/tools.route"))
app.use("/api/tasks", require("./routes/task.route"))

app.use('/api/health', healthRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Internal Server Error' })
})


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

module.exports = app
