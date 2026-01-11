const express = require('express');
const router = express.Router();
const focusController = require('../controllers/focusController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.post('/session', focusController.createSession);
router.get('/sessions', focusController.getSessions);
router.get('/statistics', focusController.getStatistics);

module.exports = router;
