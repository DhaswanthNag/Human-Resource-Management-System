
const { Router } = require("express");
const pool = require("../config/db");
const { authenticateToken, authorizeRoles } = require("../middlewares/authMiddleware");

const router = Router();
const validStatuses = ["Present", "Absent", "Late", "Half Day", "Leave", "Not Marked"];

function isValidDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function isValidTime(value) {
  return value === "" || value == null ||
    (typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value));
}

function normalizeNotes(value) {
  return typeof value === "string" ? value.trim() : value;
}

function getIndiaDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const attendanceQuery = `
  SELECT
    u.user_id AS "employeeId",
    u.name AS "employeeName",
    u.email AS email,
    u.position AS position,
    u.role AS role,
    COALESCE(a.status, 'Not Marked') AS status,
    COALESCE(TO_CHAR(a.check_in, 'HH24:MI'), '') AS "checkIn",
    COALESCE(TO_CHAR(a.check_out, 'HH24:MI'), '') AS "checkOut",
    COALESCE(a.notes, '') AS notes,
    $1::DATE AS date
  FROM users u
  LEFT JOIN employee_attendance a
    ON a.employee_id = u.user_id
    AND a.attendance_date = $1::DATE
  WHERE LOWER(TRIM(u.role)) IN ('employee', 'hr')
`;

router.get("/", authenticateToken, authorizeRoles("admin", "hr"), async (req, res) => {
  const { date } = req.query;
  if (!isValidDate(date)) {
    return res.status(400).json({ message: "A valid date in YYYY-MM-DD format is required" });
  }
  try {
    const result = await pool.query(
      `${attendanceQuery} ORDER BY LOWER(u.role), u.name ASC`,
      [date]
    );
    return res.status(200).json({ records: result.rows });
  } catch (error) {
    console.error("Error fetching attendance:", error.message);
    return res.status(500).json({ message: "Unable to fetch attendance records" });
  }
});

// Get attendance history for an individual employee or HR staff member.
router.get("/history/:employeeId", authenticateToken, authorizeRoles("admin", "hr"), async (req, res) => {
  const { employeeId } = req.params;
  if (!employeeId || !String(employeeId).trim()) {
    return res.status(400).json({ message: "A valid employee ID is required" });
  }
  try {
    const employee = await pool.query(
      `SELECT user_id AS "employeeId", name AS "employeeName", email, role, position
       FROM users
       WHERE user_id = $1 AND LOWER(TRIM(role)) IN ('employee', 'hr')
       LIMIT 1`,
      [employeeId]
    );
    if (!employee.rowCount) return res.status(404).json({ message: "Employee not found" });
    const history = await pool.query(
      `SELECT employee_id AS "employeeId", attendance_date AS date, status,
         COALESCE(TO_CHAR(check_in, 'HH24:MI'), '') AS "checkIn",
         COALESCE(TO_CHAR(check_out, 'HH24:MI'), '') AS "checkOut",
         COALESCE(notes, '') AS notes, updated_at AS "updatedAt"
       FROM employee_attendance
       WHERE employee_id = $1
       ORDER BY attendance_date DESC`,
      [employeeId]
    );
    return res.status(200).json({ employee: employee.rows[0], records: history.rows });
  } catch (error) {
    console.error("Error fetching attendance history:", error.message);
    return res.status(500).json({ message: "Unable to fetch attendance history" });
  }
});

// Generate organization-wide attendance statistics for a selected date.
router.get("/report", authenticateToken, authorizeRoles("admin", "hr"), async (req, res) => {
  const { date } = req.query;
  if (!isValidDate(date)) {
    return res.status(400).json({ message: "A valid date in YYYY-MM-DD format is required" });
  }
  try {
    const result = await pool.query(
      `SELECT LOWER(TRIM(u.role)) AS role, COALESCE(a.status, 'Not Marked') AS status,
         COUNT(*)::INTEGER AS count
       FROM users u
       LEFT JOIN employee_attendance a
         ON a.employee_id = u.user_id AND a.attendance_date = $1::DATE
       WHERE LOWER(TRIM(u.role)) IN ('employee', 'hr')
       GROUP BY LOWER(TRIM(u.role)), COALESCE(a.status, 'Not Marked')
       ORDER BY role, status`,
      [date]
    );
    return res.status(200).json({ date, report: result.rows });
  } catch (error) {
    console.error("Error generating attendance report:", error.message);
    return res.status(500).json({ message: "Unable to generate attendance report" });
  }
});

// Employee: Get personal attendance for a selected date.
router.get("/me", authenticateToken, authorizeRoles("employee"), async (req, res) => {
  const date = req.query.date || getIndiaDate();
  if (!isValidDate(date)) {
    return res.status(400).json({ message: "A valid date in YYYY-MM-DD format is required" });
  }
  try {
    const result = await pool.query(
      `SELECT employee_id AS "employeeId", attendance_date AS date, status,
         COALESCE(TO_CHAR(check_in, 'HH24:MI'), '') AS "checkIn",
         COALESCE(TO_CHAR(check_out, 'HH24:MI'), '') AS "checkOut",
         COALESCE(notes, '') AS notes
       FROM employee_attendance
       WHERE employee_id = $1 AND attendance_date = $2::DATE
       LIMIT 1`,
      [req.user.userId, date]
    );
    return res.status(200).json({
      record: result.rows[0] || {
        employeeId: req.user.userId,
        date,
        status: "Not Marked",
        checkIn: "",
        checkOut: "",
        notes: ""
      }
    });
  } catch (error) {
    console.error("Error fetching personal attendance:", error.message);
    return res.status(500).json({ message: "Unable to fetch attendance" });
  }
});

// Employee: Get personal attendance history.
router.get("/me/history", authenticateToken, authorizeRoles("employee"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT employee_id AS "employeeId", attendance_date AS date, status,
         COALESCE(TO_CHAR(check_in, 'HH24:MI'), '') AS "checkIn",
         COALESCE(TO_CHAR(check_out, 'HH24:MI'), '') AS "checkOut",
         COALESCE(notes, '') AS notes, updated_at AS "updatedAt"
       FROM employee_attendance
       WHERE employee_id = $1
       ORDER BY attendance_date DESC`,
      [req.user.userId]
    );
    return res.status(200).json({ records: result.rows });
  } catch (error) {
    console.error("Error fetching personal attendance history:", error.message);
    return res.status(500).json({ message: "Unable to fetch attendance history" });
  }
});

// Employee: Check in for the current date.
router.post("/me/check-in", authenticateToken, authorizeRoles("employee"), async (req, res) => {
  const date = getIndiaDate();
  try {
    const result = await pool.query(
      `INSERT INTO employee_attendance
        (employee_id, attendance_date, status, check_in, notes, updated_at)
       VALUES ($1, $2::DATE, 'Present', LOCALTIME, '', NOW())
       ON CONFLICT (employee_id, attendance_date)
       DO UPDATE SET check_in = LOCALTIME,
         status = CASE
           WHEN employee_attendance.status = 'Not Marked' THEN 'Present'
           ELSE employee_attendance.status
         END,
         updated_at = NOW()
       WHERE employee_attendance.check_in IS NULL
       RETURNING employee_id AS "employeeId", attendance_date AS date, status,
         COALESCE(TO_CHAR(check_in, 'HH24:MI'), '') AS "checkIn",
         COALESCE(TO_CHAR(check_out, 'HH24:MI'), '') AS "checkOut",
         COALESCE(notes, '') AS notes`,
      [req.user.userId, date]
    );
    if (!result.rowCount) {
      return res.status(409).json({ message: "You have already checked in today." });
    }
    return res.status(200).json({ message: "Check-in recorded successfully", record: result.rows[0] });
  } catch (error) {
    console.error("Error recording check-in:", error.message);
    return res.status(500).json({ message: "Unable to record check-in" });
  }
});

// Employee: Check out for the current date.
router.post("/me/check-out", authenticateToken, authorizeRoles("employee"), async (req, res) => {
  const date = getIndiaDate();
  try {
    const result = await pool.query(
      `UPDATE employee_attendance
       SET check_out = LOCALTIME, updated_at = NOW()
       WHERE employee_id = $1 AND attendance_date = $2::DATE
         AND check_in IS NOT NULL AND check_out IS NULL
       RETURNING employee_id AS "employeeId", attendance_date AS date, status,
         COALESCE(TO_CHAR(check_in, 'HH24:MI'), '') AS "checkIn",
         COALESCE(TO_CHAR(check_out, 'HH24:MI'), '') AS "checkOut",
         COALESCE(notes, '') AS notes`,
      [req.user.userId, date]
    );
    if (!result.rowCount) {
      return res.status(409).json({
        message: "Check in first, or you have already checked out today."
      });
    }
    return res.status(200).json({ message: "Check-out recorded successfully", record: result.rows[0] });
  } catch (error) {
    console.error("Error recording check-out:", error.message);
    return res.status(500).json({ message: "Unable to record check-out" });
  }
});

// Employee: Submit an attendance correction request.
router.post("/me/corrections", authenticateToken, authorizeRoles("employee"), async (req, res) => {
  const { date } = req.body;
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim() : "";
  if (!isValidDate(date)) {
    return res.status(400).json({ message: "A valid attendance date is required" });
  }
  if (date > getIndiaDate()) {
    return res.status(400).json({ message: "You cannot request a correction for a future date" });
  }
  if (reason.length < 5 || reason.length > 500) {
    return res.status(400).json({ message: "Reason must be between 5 and 500 characters" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO attendance_correction_requests
        (employee_id, attendance_date, reason, status, created_at, updated_at)
       VALUES ($1, $2::DATE, $3, 'Pending', NOW(), NOW())
       RETURNING id, employee_id, attendance_date, reason, status,
         reviewer_notes, created_at, updated_at`,
      [req.user.userId, date, reason]
    );
    return res.status(201).json({
      message: "Correction request submitted successfully",
      request: result.rows[0]
    });
  } catch (error) {
    console.error("Error submitting correction request:", error.message);
    return res.status(500).json({ message: "Unable to submit correction request" });
  }
});

// Employee: Get personal attendance correction requests.
router.get("/me/corrections", authenticateToken, authorizeRoles("employee"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, employee_id, attendance_date, reason, status,
         reviewer_notes, created_at, updated_at
       FROM attendance_correction_requests
       WHERE employee_id = $1
       ORDER BY created_at DESC`,
      [req.user.userId]
    );
    return res.status(200).json({ requests: result.rows });
  } catch (error) {
    console.error("Error fetching correction requests:", error.message);
    return res.status(500).json({ message: "Unable to fetch correction requests" });
  }
});

// Create or update an attendance record for an employee or HR staff member.
router.put("/:employeeId", authenticateToken, authorizeRoles("admin", "hr"), async (req, res) => {
  const { employeeId } = req.params;
  const { date, status, checkIn, checkOut, notes } = req.body;
  if (!employeeId || !String(employeeId).trim()) {
    return res.status(400).json({ message: "A valid employee ID is required" });
  }
  if (!isValidDate(date)) {
    return res.status(400).json({ message: "A valid date in YYYY-MM-DD format is required" });
  }
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid attendance status" });
  }
  if (!isValidTime(checkIn) || !isValidTime(checkOut)) {
    return res.status(400).json({ message: "Check-in and check-out must use a valid 24-hour time" });
  }
  const cleanNotes = normalizeNotes(notes);
  if (cleanNotes !== undefined && cleanNotes !== null && typeof cleanNotes !== "string") {
    return res.status(400).json({ message: "Notes must be text" });
  }
  if (typeof cleanNotes === "string" && cleanNotes.length > 500) {
    return res.status(400).json({ message: "Notes cannot exceed 500 characters" });
  }
  try {
    const employeeResult = await pool.query(
      `SELECT user_id FROM users
       WHERE user_id = $1 AND LOWER(TRIM(role)) IN ('employee', 'hr')
       LIMIT 1`,
      [employeeId]
    );
    if (!employeeResult.rowCount) {
      return res.status(404).json({ message: "Employee not found or not eligible for attendance tracking" });
    }
    const result = await pool.query(
      `INSERT INTO employee_attendance
        (employee_id, attendance_date, status, check_in, check_out, notes, updated_at)
       VALUES ($1, $2::DATE, $3, $4::TIME, $5::TIME, $6, NOW())
       ON CONFLICT (employee_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status, check_in = EXCLUDED.check_in,
         check_out = EXCLUDED.check_out, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING employee_id AS "employeeId", attendance_date AS date, status,
         COALESCE(TO_CHAR(check_in, 'HH24:MI'), '') AS "checkIn",
         COALESCE(TO_CHAR(check_out, 'HH24:MI'), '') AS "checkOut",
         COALESCE(notes, '') AS notes`,
      [employeeId, date, status, checkIn || null, checkOut || null, cleanNotes || ""]
    );
    return res.status(200).json({ message: "Attendance saved successfully", record: result.rows[0] });
  } catch (error) {
    console.error("Error saving attendance:", error.message);
    return res.status(500).json({ message: "Unable to save attendance record" });
  }
});

module.exports = router;
