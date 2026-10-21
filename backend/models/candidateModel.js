import pool from "../config/db.js";

// Create candidate
export const createCandidateModel = async ({ name, email, jobApplied, status, assignedTo, interviewDate, assignedHrUserId }) => {
  if (assignedHrUserId) {
    const hr = await pool.query(
      "SELECT user_id FROM public.users WHERE user_id = $1 AND LOWER(TRIM(role)) = 'hr'",
      [assignedHrUserId]
    );
    if (hr.rows.length === 0) {
      throw new Error("INVALID_HR_ASSIGNMENT");
    }
  }

  const result = await pool.query(
    `INSERT INTO public.candidates
      (name, email, job_applied, status, assigned_to, interview_date, assigned_hr_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, email, jobApplied, status, assignedTo, interviewDate || null, assignedHrUserId || null]
  );
  return result.rows[0];
};

// Get all candidates for Admin, or only assigned candidates for HR
export const getCandidatesModel = async (userId, role) => {
  const result = role === "admin"
    ? await pool.query("SELECT * FROM public.candidates ORDER BY candidate_id DESC")
    : await pool.query(
        "SELECT * FROM public.candidates WHERE assigned_hr_user_id = $1 ORDER BY candidate_id DESC",
        [userId]
      );
  return result.rows;
};

// Update candidate with role-based ownership checks
export const updateCandidateModel = async (id, data, userId, role) => {
  const {
    name, email, jobApplied, status, assignedTo, interviewDate, assignedHrUserId
  } = data;

  if (role === "admin") {
    if (assignedHrUserId) {
      const hr = await pool.query(
        "SELECT user_id FROM public.users WHERE user_id = $1 AND LOWER(TRIM(role)) = 'hr'",
        [assignedHrUserId]
      );
      if (hr.rows.length === 0) {
        throw new Error("INVALID_HR_ASSIGNMENT");
      }
    }

    const result = await pool.query(
      `UPDATE public.candidates
       SET name = $1, email = $2, job_applied = $3, status = $4,
           assigned_to = $5, interview_date = $6, assigned_hr_user_id = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE candidate_id = $8
       RETURNING *`,
      [name, email, jobApplied, status, assignedTo, interviewDate || null, assignedHrUserId || null, id]
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `UPDATE public.candidates
     SET name = $1, email = $2, job_applied = $3, status = $4,
         assigned_to = $5, interview_date = $6,
         updated_at = CURRENT_TIMESTAMP
     WHERE candidate_id = $7 AND assigned_hr_user_id = $8
     RETURNING *`,
    [name, email, jobApplied, status, assignedTo, interviewDate || null, id, userId]
  );
  return result.rows[0];
};

// Delete candidate (Admin only; route also enforces this)
export const deleteCandidateModel = async (id) => {
  const result = await pool.query(
    "DELETE FROM public.candidates WHERE candidate_id = $1 RETURNING *",
    [id]
  );
  return result.rows[0];
};
