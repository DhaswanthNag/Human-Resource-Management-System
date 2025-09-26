const express = require('express');
const router = express.Router();
const {
  submitAssign,
  getAssignments,
  getDashboardStats,
  addSchedule,
  getAllSchedules,
  submitFeedback,
  submitShortlist,
  getShortlists
} = require('../controllers/interviewController');

// Assign
router.post('/assign', submitAssign);
router.get('/assign', getAssignments);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Schedule
router.post('/schedule', addSchedule);
router.get('/schedule', getAllSchedules);

// Shortlist
router.post('/shortlist', submitShortlist);
router.get('/shortlist', getShortlists);

// Feedback
router.post('/feedback', submitFeedback);

module.exports = router;