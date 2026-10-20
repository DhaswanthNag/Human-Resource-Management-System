const pool = require("../config/db");

// ---------------------- Create New Employee ----------------------
const createEmployee = async (req, res) => {
  const { emp_id } = req.body;
  if (!emp_id) {
    return res.status(400).json({ error: "emp_id is required" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO employees (emp_id, created_at, decision)
       VALUES ($1, NOW(), 'pending')
       ON CONFLICT (emp_id) DO UPDATE
       SET emp_id = EXCLUDED.emp_id
       RETURNING emp_id, created_at, decision`,
      [emp_id]
    );
    return res.status(200).json({
      message: "Employee entry is ready",
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("Error creating employee entry:", err);
    return res.status(500).json({ error: "Failed to create employee entry" });
  }
};

// ---------------------- Get Employees List ----------------------

const getEmployees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT user_id, name
       FROM public.users
       WHERE LOWER(role) = 'employee'
       ORDER BY user_id ASC`
    );

    return res.json({
      employees: result.rows
    });
  } catch (err) {
    console.error("❌ Error fetching employees:", err);
    return res.status(500).json({
      error: "Failed to fetch employees"
    });
  }
};

// ---------------------- Get Employees + Documents ----------------------
const getEmployeesWithDocuments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.emp_id, e.created_at,
              COALESCE(e.decision, 'pending') AS decision,
              d.id AS doc_id, d.file_name, d.content_type,
              COALESCE(d.status, 'pending') AS doc_status, d.uploaded_at
       FROM employees e
       LEFT JOIN employee_documents d
       ON e.emp_id = d.emp_id
       ORDER BY e.emp_id, d.uploaded_at DESC`
    );

    const grouped = {};
    result.rows.forEach((row) => {
      if (!grouped[row.emp_id]) {
        grouped[row.emp_id] = {
          emp_id: row.emp_id,
          created_at: row.created_at,
          decision: row.decision,
          documents: [],
        };
      }
      if (row.doc_id) {
        grouped[row.emp_id].documents.push({
          id: row.doc_id,
          file_name: row.file_name,
          content_type: row.content_type,
          decision: row.doc_status,
          uploaded_at: row.uploaded_at,
        });
      }
    });

    return res.json(Object.values(grouped));
  } catch (err) {
    console.error("❌ Error fetching employees with documents:", err);
    return res.status(500).json({ error: "Failed to fetch employees with documents" });
  }
};

// ---------------------- Update Employee Decision ----------------------
const updateEmployeeDecision = async (req, res) => {
  const { empId } = req.params;
  let { decision, status } = req.body;

  const finalDecision = (decision || status || "").toLowerCase();

  if (!["approved", "rejected"].includes(finalDecision)) {
    return res
      .status(400)
      .json({ error: "Decision must be approved or rejected" });
  }

  try {
    // Approval only if all docs are verified
    if (finalDecision === "approved") {
      const checkDocs = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE status != 'verified') AS not_verified,
                COUNT(*) AS total
         FROM employee_documents
         WHERE emp_id = $1`,
        [empId]
      );

      const total = parseInt(checkDocs.rows[0].total, 10);
      const notVerified = parseInt(checkDocs.rows[0].not_verified, 10);

      if (total === 0) {
        return res.status(400).json({
          error: "Employee has no documents uploaded",
        });
      }

      if (notVerified > 0) {
        return res.status(400).json({
          error:
            "Cannot approve employee — all documents must be verified first",
        });
      }
    }

    const result = await pool.query(
      `UPDATE employees
         SET decision = $1
       WHERE emp_id = $2
       RETURNING emp_id, decision`,
      [finalDecision, empId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.json({
      success: true,
      message: `✅ Employee ${empId} marked as ${finalDecision}`,
      employee: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Error updating employee decision:", err);
    return res.status(500).json({ error: "Server error while updating decision" });
  }
};

// ---------------------- Approve/Reject Employee (Alias) ----------------------
const approveEmployee = async (req, res) => {
  try {
    req.body = { ...req.body, decision: "approved" };
    return updateEmployeeDecision(req, res);
  } catch (err) {
    console.error("❌ Error in approveEmployee:", err);
    return res.status(500).json({ error: "Failed to approve employee" });
  }
};

const rejectEmployee = async (req, res) => {
  try {
    req.body = { ...req.body, decision: "rejected" };
    return updateEmployeeDecision(req, res);
  } catch (err) {
    console.error("❌ Error in rejectEmployee:", err);
    return res.status(500).json({ error: "Failed to reject employee" });
  }
};

// ---------------------- Delete Employee + Documents ----------------------
const deleteEmployee = async (req, res) => {
  const { empId } = req.params;
  try {
    await pool.query(`DELETE FROM employee_documents WHERE emp_id = $1`, [
      empId,
    ]);
    const result = await pool.query(
      `DELETE FROM employees WHERE emp_id = $1 RETURNING emp_id`,
      [empId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    return res.json({ message: `✅ Employee ${empId} and all documents deleted` });
  } catch (err) {
    console.error("❌ Error deleting employee:", err);
    return res.status(500).json({ error: "Failed to delete employee" });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeesWithDocuments,
  updateEmployeeDecision,
  approveEmployee,
  rejectEmployee,
  deleteEmployee,
};
