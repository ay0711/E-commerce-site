const express = require('express');
const { registerUser, loginUser, getMe, socialAuth } = require('../Controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/social', socialAuth);
router.get('/me', protect, getMe);

module.exports = router;
