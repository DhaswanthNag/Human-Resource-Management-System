const { authenticateToken,  authorizeRoles } = require('../middlewares/authMiddleware');
const express = require("express");
const router = express.Router();
const {
  createPayslip,
  getPayslipByIdAndName,
  sendPayslip,
  handlePayslipRequest,
  getPayslipRequests,
  approvePayslipRequest,
  denyPayslipRequest
} = require("../controllers/payslipControllers");

router.post("/create", createPayslip);


router.post('/payslip-request', handlePayslipRequest);
router.get('/requested-payslips', getPayslipRequests);
router.post('/requested-payslips/:id/approve', approvePayslipRequest);
router.post('/requested-payslips/:id/deny', denyPayslipRequest);


router.get('/:userId/:employeeName', getPayslipByIdAndName);


router.post("/create",authenticateToken,
  authorizeRoles('admin', 'hr'),
 createPayslip);



router.post("/send-payslip",/*authenticateToken,
  authorizeRoles('hr'),*/
 sendPayslip);

module.exports = router;