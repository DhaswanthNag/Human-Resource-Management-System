const express = require('express');
const {
  loginUser,
  sendOtp,
  resetPassword
} = require('../controllers/authController.js');

const {
  validateSetupToken,
  setInitialPassword
} = require('../controllers/userSetupController.js');

const router = express.Router();

router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/reset-password', resetPassword);

// Validate the one-time initial password setup link.
router.get('/setup-password/:token', validateSetupToken);

// Set the initial password using the one-time setup link.
router.post('/setup-password/:token', setInitialPassword);

module.exports = router;
