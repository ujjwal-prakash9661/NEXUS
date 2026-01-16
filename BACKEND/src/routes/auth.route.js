const express = require('express')
const router = express.Router()
const { googleAuth, demoAuth, faceRegister, faceLogin, refreshToken, logout } = require('../controllers/auth.controller')
const auth = require('../middlewares/auth.middleware')

router.post('/google', googleAuth)
router.post('/demo', demoAuth)
router.post('/face-register', faceRegister)
router.post('/face-login', faceLogin)
router.post('/refresh', refreshToken)

router.post('/logout', auth, logout)

module.exports = router
