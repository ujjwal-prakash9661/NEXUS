module.exports = {
  SUPER_ADMIN: ["*"],
  ADMIN: ["approve_user", "lock_user", "force_lock", "view_users", "view_audit"],
  MODERATOR: ["view_users", "view_audit"],
  USER: []
}
