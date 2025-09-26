// backend/routes/leaveRoutes.js
const express = require("express");
const router = express.Router();
const { applyLeave, getAllLeaves, updateLeaveStatus } = require("../controllers/leaveController");

// Apply for leave
router.post("/", applyLeave);

// Get all leaves (Admin/HR can see this)
router.get("/", getAllLeaves);

// Update leave status (Approve / Reject)
router.put("/:id/status", updateLeaveStatus);

module.exports = router;
