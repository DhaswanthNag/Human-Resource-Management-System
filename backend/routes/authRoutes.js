const express = require('express');
const { loginUser,sendOtp, resetPassword  } = require('../controllers/authControllers');

const router = express.Router();

router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
