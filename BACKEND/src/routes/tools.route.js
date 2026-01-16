const express = require('express');
const router = express.Router();
const toolsController = require('../controllers/tools.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/scan', auth, toolsController.scanTarget);

module.exports = router;
