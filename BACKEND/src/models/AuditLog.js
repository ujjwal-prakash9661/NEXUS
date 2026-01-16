const mongoose = require('mongoose')

const auditSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: String,
  target: String,
  ip: String,
  meta: Object,
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('AuditLog', auditSchema)
