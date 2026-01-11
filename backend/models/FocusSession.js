const mongoose = require('mongoose');

const focusSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        default: null,
    },
    duration: {
        type: Number, // Duration in minutes
        required: true,
    },
    breakDuration: {
        type: Number, // Break duration in minutes
        default: 5,
    },
    sessionsCompleted: {
        type: Number,
        default: 1,
    },
    completedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('FocusSession', focusSessionSchema);
