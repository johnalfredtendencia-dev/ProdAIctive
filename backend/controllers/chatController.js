const ChatSession = require('../models/ChatSession');

// Create or get chat session
exports.getOrCreateSession = async (req, res) => {
    try {
        let session = await ChatSession.findOne({ userId: req.userId });

        if (!session) {
            session = new ChatSession({
                userId: req.userId,
                messages: [],
            });
            await session.save();
        }

        res.status(200).json({
            success: true,
            session,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get all chat sessions
exports.getSessions = async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userId: req.userId });
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

// Add message to session
exports.addMessage = async (req, res) => {
    try {
        const { text, sender } = req.body;

        let session = await ChatSession.findOne({ userId: req.userId });

        if (!session) {
            session = new ChatSession({
                userId: req.userId,
                messages: [],
            });
        }

        const message = {
            id: new Date().getTime().toString(),
            text,
            sender,
            timestamp: new Date(),
        };

        session.messages.push(message);
        session.lastUpdated = new Date();
        await session.save();

        res.status(201).json({
            success: true,
            message,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete chat session
exports.deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await ChatSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found',
            });
        }

        if (session.userId.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        await ChatSession.findByIdAndDelete(sessionId);
        res.status(200).json({
            success: true,
            message: 'Session deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
