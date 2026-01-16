const Task = require('../models/Task')
const User = require('../models/User')

// Admin: Assign a task to a user by NexusID
exports.assignTask = async (req, res) => {
    try {
        const { nexusId, title, description, dueDate } = req.body

        const user = await User.findOne({ nexusId })
        if (!user) {
            return res.status(404).json({ message: "User not found with this Nexus ID" })
        }

        const task = await Task.create({
            title,
            description,
            dueDate,
            assignedTo: user._id,
            assignedBy: req.user._id,
            status: 'pending',
            progress: 0
        })

        res.status(201).json(task)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to assign task" })
    }
}

// User: Get my tasks
exports.getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id }).sort({ dueDate: 1 })
        res.json(tasks)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to fetch tasks" })
    }
}

// User/Admin: Update task progress
exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params
        const { progress, status } = req.body

        const task = await Task.findById(taskId)
        if (!task) return res.status(404).json({ message: "Task not found" })

        // Only assignee or admin can update
        if (task.assignedTo.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Not authorized" })
        }

        if (progress !== undefined) task.progress = progress
        if (status !== undefined) task.status = status

        // Auto update status based on progress
        if (task.progress === 100) task.status = 'completed'
        if (task.progress > 0 && task.progress < 100) task.status = 'in-progress'

        await task.save()
        res.json(task)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Update failed" })
    }
}

// Admin: Get all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('assignedTo', 'name nexusId email')
            .populate('assignedBy', 'name')
            .sort({ createdAt: -1 })
        res.json(tasks)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Failed to fetch all tasks" })
    }
}
