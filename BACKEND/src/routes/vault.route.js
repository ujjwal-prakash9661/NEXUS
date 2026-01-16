const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth.middleware')
const { enrollFace, setPin, verifyFace,presenceCheck  } = require('../controllers/vault.controller')

router.post('/face-enroll', auth, enrollFace)
router.post('/set-pin', auth, setPin)
router.post('/face-verify', auth, verifyFace)
router.post('/presence-check', auth, presenceCheck)


module.exports = router
