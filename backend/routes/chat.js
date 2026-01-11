const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.get('/session', chatController.getOrCreateSession);
router.get('/sessions', chatController.getSessions);
router.post('/message', chatController.addMessage);
router.delete('/session/:sessionId', chatController.deleteSession);

module.exports = router;
