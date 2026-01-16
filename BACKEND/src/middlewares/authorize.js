const roles = require("../config/roles")

module.exports = (permission) => (req, res, next) => {
  const userRole = req.user.role
  const permissions = roles[userRole]

  if (!permissions) return res.status(403).json({ message: "ROLE_INVALID" })
  if (permissions.includes("*")) return next()
  if (!permissions.includes(permission))
    return res.status(403).json({ message: "ACCESS_DENIED" })

  next()
}
