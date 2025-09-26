const express = require('express');
const {
  submitWorkReport,
  viewReports,
  commentOnReport,
  exportReports,
  getMyReports
} = require('../controllers/workReportController');

const { authenticateToken,  authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post(
  '/submit',
  authenticateToken,
  authorizeRoles('employee','hr'),
  submitWorkReport
);


router.get(
  '/all',
  authenticateToken,
  authorizeRoles('admin', 'hr'),
  viewReports
);

router.get(
  '/my',authenticateToken,authorizeRoles('employee'),
  getMyReports
);


router.put(
  '/:report_id/comment',
  authenticateToken,
  authorizeRoles('admin', 'hr'),
  commentOnReport
);


router.get(
  '/export',
  authenticateToken,
  authorizeRoles('admin', 'hr'),
  exportReports
);

router.get('/export/:userId', 
  authenticateToken,
  authorizeRoles('admin', 'hr'),
  exportReports
);

module.exports = router;
