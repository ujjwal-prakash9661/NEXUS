const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")
const { sendMessage, getMessages, getConversations, getOnlineUsers, lookupUser, uploadFile, markMessagesAsSeen } = require("../controllers/chat.controller")
const upload = require("../middlewares/upload.middleware")

router.post("/send", auth, sendMessage)
router.get("/messages", auth, getMessages)
router.get("/conversations", auth, getConversations)
router.get("/online", auth, getOnlineUsers)
router.get("/lookup", auth, lookupUser)
router.post("/upload", auth, upload.single('file'), uploadFile)
router.put("/seen", auth, markMessagesAsSeen)

module.exports = router
