import pool from "../config/db.js";

// Create candidate
export const createCandidateModel = async ({ name, email, jobApplied, status, assignedTo, interviewDate }) => {
  const result = await pool.query(
    `INSERT INTO candidates (name, email, job_applied, status, assigned_to, interview_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [name, email, jobApplied, status, assignedTo, interviewDate]
  );
  return result.rows[0];
};

// Get all candidates
export const getCandidatesModel = async () => {
  const result = await pool.query("SELECT * FROM candidates ORDER BY candidate_id DESC");
  return result.rows;
};

// Update candidate
export const updateCandidateModel = async (id, { name, email, jobApplied, status, assignedTo, interviewDate }) => {
  const result = await pool.query(
    `UPDATE candidates 
     SET name=$1, email=$2, job_applied=$3, status=$4, assigned_to=$5, interview_date=$6
     WHERE candidate_id=$7 RETURNING *`,
    [name, email, jobApplied, status, assignedTo, interviewDate, id]
  );
  return result.rows[0];
};

// Delete candidate
export const deleteCandidateModel = async (id) => {
  const result = await pool.query("DELETE FROM candidates WHERE candidate_id=$1 RETURNING *", [id]);
  return result.rows[0];
};