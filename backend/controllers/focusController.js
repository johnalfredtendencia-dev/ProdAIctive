const FocusSession = require('../models/FocusSession');
const Task = require('../models/Task');

// Create focus session
exports.createSession = async (req, res) => {
    try {
        const { taskId, duration, breakDuration, sessionsCompleted } = req.body;

        const session = new FocusSession({
            userId: req.userId,
            taskId: taskId || null,
            duration,
            breakDuration: breakDuration || 5,
            sessionsCompleted: sessionsCompleted || 1,
        });

        await session.save();
        res.status(201).json({
            success: true,
            message: 'Focus session created',
            session,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get focus sessions
exports.getSessions = async (req, res) => {
    try {
        const sessions = await FocusSession.find({ userId: req.userId }).populate('taskId');
        res.status(200).json({
            success: true,
            sessions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get focus statistics
exports.getStatistics = async (req, res) => {
    try {
        const sessions = await FocusSession.find({ userId: req.userId });
        
        const totalSessions = sessions.length;
        const totalFocusTime = sessions.reduce((sum, s) => sum + s.duration, 0);
        const totalBreakTime = sessions.reduce((sum, s) => sum + s.breakDuration, 0);
        const totalPomodoros = sessions.reduce((sum, s) => sum + s.sessionsCompleted, 0);

        res.status(200).json({
            success: true,
            statistics: {
                totalSessions,
                totalFocusTime, // in minutes
                totalBreakTime, // in minutes
                totalPomodoros,
                averageSessionDuration: totalFocusTime / totalSessions || 0,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
