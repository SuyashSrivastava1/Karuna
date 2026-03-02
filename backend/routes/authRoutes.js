const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyOTP, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
