const router = require('express').Router()
const auth = require('../middlewares/auth.middleware')
const adminOnly = require('../middlewares/admin.middleware')
const { assignTask, getMyTasks, updateTask, getAllTasks } = require('../controllers/task.controller')

router.use(auth)

router.get('/', getMyTasks)
router.get('/all', adminOnly, getAllTasks)
router.post('/assign', adminOnly, assignTask)
router.patch('/:taskId', updateTask)

module.exports = router
