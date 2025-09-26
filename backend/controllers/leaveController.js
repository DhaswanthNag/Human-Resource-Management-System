
const pool = require("../config/db");

exports.applyLeave = async (req, res) => {
  const { userId, leaveType, startDate, endDate, reason } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [userId, leaveType, startDate, endDate, reason, "Pending"]
    );

    res
      .status(201)
      .json({ message: "Leave applied successfully", data: result.rows[0] });
  } catch (error) {
    console.error("Error applying leave:", error);
    res
      .status(500)
      .json({ message: "Failed to apply leave", error: error.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM leaves ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ message: "Failed to fetch leaves" });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE leaves SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.json({ message: "Leave status updated", data: result.rows[0] });
  } catch (error) {
    console.error("Error updating leave status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};
