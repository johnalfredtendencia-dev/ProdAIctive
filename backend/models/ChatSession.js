const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    id: {
        type: String,
        default: () => new Date().getTime().toString(),
    },
    text: {
        type: String,
        required: true,
    },
    sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const chatSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        default: 'Chat Session',
    },
    messages: [chatMessageSchema],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
