const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    nexusId: { type: String, unique: true },
    email: { type: String, unique: true },
    name: String,
    role: {
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "USER"],
        default: "USER"
    },
    status: { type: String, default: 'PENDING' },
    oauthProvider: String,
    faceDescriptors: {
        type: [[Number]],
        default: []
    },
    fingerprintId: { type: String },
    pinHash: { type: String },
    online: {
        type: Boolean,
        default: false,
    },

    riskScore: { type: Number, default: 0 },
    riskFlags: [
        {
            _id: false,
            reason: String,
            createdAt: { type: Date, default: Date.now }
        }
    ],
    lastRiskEvaluation: { type: Date },

    lastSeen: {
        type: Date
    },
    sessionVersion: {
        type: Number,
        default: 1
    },
    accessToken: { type: String },
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('User', userSchema)