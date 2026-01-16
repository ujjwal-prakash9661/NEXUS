const mongoose = require("mongoose")

const factorSchema = new mongoose.Schema({
  type: String,
  reason: String,
  weight: Number,
  createdAt: { type: Date, default: Date.now }
}, { _id: false })

const riskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  score: { type: Number, default: 0 },

  factors: [factorSchema],

  lastEvaluated: { type: Date, default: Date.now }
})

module.exports = mongoose.model("RiskProfile", riskSchema)
