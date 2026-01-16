const express = require('express')
const router = express.Router()
const auth = require('../middlewares/auth.middleware')

router.get('/dashboard', auth, (req, res) => {
  res.json({ message: 'Welcome to NEXUS Dashboard' })
})

module.exports = router
