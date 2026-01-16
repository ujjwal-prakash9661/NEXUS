const router = require('express').Router()
const auth = require('../middlewares/auth.middleware')
const adminOnly = require('../middlewares/admin.middleware')
const { getPendingUsers, approveUser, lockUser, getOverview, getAllUsers, getActivityLog, forceLockUser,getDashboardSummary, getRiskProfile } = require('../controllers/admin.controller')
const authorize = require('../middlewares/authorize')



router.get('/pending-users', auth, adminOnly, getPendingUsers)
// router.post('/approve-user', auth, adminOnly, approveUser)
// router.post('/lock-user', auth, adminOnly, lockUser)

router.get('/overview', auth, adminOnly, getOverview)
// router.get('/users', auth, adminOnly, getAllUsers)
// router.get('/activity', auth, adminOnly, getActivityLog)

// router.post('/force-lock', auth, adminOnly, forceLockUser)



router.post("/approve-user", auth, authorize("approve_user"), approveUser)
router.post("/lock-user", auth, authorize("lock_user"), lockUser)
router.post("/force-lock", auth, authorize("force_lock"), forceLockUser)
router.get("/users", auth, authorize("view_users"), getAllUsers)
router.get("/activity", auth, authorize("view_audit"), getActivityLog)

router.get("/risk/:id", auth, adminOnly, getRiskProfile)

router.get('/dashboard-summary', auth, adminOnly, getDashboardSummary)

module.exports = router
