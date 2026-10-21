const express = require('express');
const router = express.Router();
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/authMiddleware');
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

router.use(authenticateToken);
router.use(authorizeRoles('admin', 'hr'));

router.post('/assign', submitAssign);
router.get('/assign', getAssignments);
router.get('/dashboard', getDashboardStats);
router.post('/schedule', addSchedule);
router.get('/schedule', getAllSchedules);
router.post('/shortlist', submitShortlist);
router.get('/shortlist', getShortlists);
router.post('/feedback', submitFeedback);

module.exports = router;
