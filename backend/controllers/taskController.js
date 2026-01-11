const Task = require('../models/Task');

// Get all tasks for user
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId });
        res.status(200).json({
            success: true,
            tasks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Create task
exports.createTask = async (req, res) => {
    try {
        const { title, description, priority, subject, duration, dueDate } = req.body;

        const task = new Task({
            userId: req.userId,
            title,
            description,
            priority,
            subject,
            duration,
            dueDate: dueDate ? new Date(dueDate) : null,
        });

        await task.save();
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, priority, subject, completed, duration, dueDate } = req.body;

        let task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Check if user owns this task
        if (task.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        // Update fields
        if (title) task.title = title;
        if (description) task.description = description;
        if (priority) task.priority = priority;
        if (subject) task.subject = subject;
        if (typeof completed !== 'undefined') task.completed = completed;
        if (duration) task.duration = duration;
        if (dueDate) task.dueDate = new Date(dueDate);
        task.updatedAt = Date.now();

        await task.save();
        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Check if user owns this task
        if (task.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        await Task.findByIdAndDelete(taskId);
        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
