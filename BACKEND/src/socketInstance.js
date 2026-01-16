let io = null

exports.set = (instance) => {
  io = instance
}

exports.get = () => {
  if (!io) throw new Error("Socket.io not initialized")
  return io
}
