const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  attachment: {
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  },
  status: { type: String, enum: ["PENDING", "DELIVERED", "SEEN"], default: "PENDING" },
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Message", messageSchema)
