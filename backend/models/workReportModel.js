const db = require('../config/db');

const submitReport = async ({ userId, content, frequency, submitted_by, status }) => {
  const result = await db.query(
    `INSERT INTO work_reports (user_id, content, frequency, submitted_by, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, content, frequency, submitted_by, status]
  );
  return result.rows[0];
};

const getAllReports = async (userId) => {
  const query = userId
    ? 'SELECT * FROM work_reports WHERE user_id = $1'
    : 'SELECT * FROM work_reports';
  const values = userId ? [userId] : [];
  const result = await db.query(query, values);
  return result.rows;
};

const addComment = async (report_id, comment, status, reviewed_by) => {
  const result = await db.query(
    `UPDATE work_reports
     SET comment = $1, status = $2, reviewed_by = $3
     WHERE report_id = $4 RETURNING *`,
    [comment, status, reviewed_by, report_id]
  );
  return result.rows[0];  
};

module.exports = {
  submitReport,
  getAllReports,
  addComment,
};
