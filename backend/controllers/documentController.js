const pool = require("../config/db");
// ---------------------- Upload Document ----------------------
const uploadDocument = async (req, res) => {
  const { empId } = req.params;
  const { name, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Document name is required" });
  }

  try {
    const empCheck = await pool.query(
      `SELECT emp_id FROM employees WHERE emp_id = $1 LIMIT 1`,
      [empId]
    );

    if (empCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO employees (emp_id, created_at, decision)
         VALUES ($1, NOW(), 'pending')`,
        [empId]
      );
    }

    const result = await pool.query(
      `INSERT INTO employee_documents
       (emp_id, document_name, description, file_name, content_type, content, status, uploaded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id, emp_id, document_name, description, file_name,
                 content_type, COALESCE(status, 'pending') AS decision, uploaded_at`,
      [
        empId,
        name.trim(),
        description || "",
        file.originalname,
        file.mimetype,
        file.buffer,
        "pending"
      ]
    );

    return res.status(201).json({
      message: "✅ Document uploaded successfully",
      document: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error uploading document:", err);
    return res.status(500).json({
      error: "Failed to upload document",
      details: err.message
    });
  }
};

// ---------------------- Get All Documents for an Employee ----------------------
const getEmployeeDocuments = async (req, res) => {
  try {
    const { empId } = req.params;

const result = await pool.query(
  `SELECT id, emp_id, document_name, description, file_name, content_type,
          COALESCE(status, 'pending') AS status,
          COALESCE(status, 'pending') AS decision,
          uploaded_at
   FROM employee_documents
   WHERE emp_id = $1
   ORDER BY uploaded_at DESC`,
  [empId]
);

const documents = result.rows.map((doc) => ({
  ...doc,
  fileURL: `/api/employees/raw/${doc.id}`,
}));

return res.json({ employeeId: empId, documents });
  } catch (err) {
    console.error("❌ Error fetching employee documents:", err);
    return res.status(500).json({
      error: "Failed to fetch documents",
      details: err.message
    });
  }
};

// ---------------------- Fetch Raw Document ----------------------
const getRawDocument = async (req, res) => {
  try {
    const { docId } = req.params;

    const result = await pool.query(
      `SELECT file_name, content_type, content
       FROM employee_documents
       WHERE id = $1`,
      [docId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = result.rows[0];

    res.setHeader("Content-Type", doc.content_type);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${doc.file_name}"`
    );

    return res.send(doc.content);
  } catch (err) {
    console.error("❌ Error fetching document:", err);
    return res.status(500).json({
      error: "Failed to fetch document",
      details: err.message
    });
  }
};

// ---------------------- Update Single Document Status ----------------------
const updateDocumentStatus = async (req, res) => {
  const { docId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["pending", "submitted", "verified", "rejected"];

  if (!allowedStatuses.includes(String(status || "").toLowerCase())) {
    return res.status(400).json({
      error: "Status must be pending, submitted, verified, or rejected"
    });
  }

  try {
    const result = await pool.query(
      `UPDATE employee_documents
       SET status = $1
       WHERE id = $2
       RETURNING id, status`,
      [status.toLowerCase(), docId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.json({
      message: "✅ Document status updated",
      document: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error updating document status:", err);
    return res.status(500).json({
      error: "Failed to update document status",
      details: err.message
    });
  }
};

// ---------------------- Delete Document ----------------------
const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;

    const result = await pool.query(
      `DELETE FROM employee_documents
       WHERE id = $1
       RETURNING id`,
      [docId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.json({
      message: "✅ Document deleted successfully",
      docId
    });
  } catch (err) {
    console.error("❌ Error deleting document:", err);
    return res.status(500).json({
      error: "Failed to delete document",
      details: err.message
    });
  }
};

module.exports = {
  uploadDocument,
  getEmployeeDocuments,
  getRawDocument,
  updateDocumentStatus,
  deleteDocument
};
