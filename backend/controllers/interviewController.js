const pool = require('../config/db');

const isAdmin = (userOrReq) => {
  const user = userOrReq?.user || userOrReq;
  return String(user?.role || '').toLowerCase() === 'admin';
};

const getUserId = (userOrReq) => {
  const user = userOrReq?.user || userOrReq;
  return user?.userId ?? user?.user_id ?? user?.id ?? null;
};

// Resolve the frontend candidate identifier to a database candidate.
const findCandidate = async (candidateId, userOrReq) => {
  const identifier = String(candidateId ?? '').trim();
  if (!identifier) return null;

  const user = userOrReq?.user || userOrReq;
  const result = await pool.query(
    `SELECT candidate_id, candidate_code, name, assigned_hr_user_id
     FROM public.candidates
     WHERE candidate_code = $1
        OR candidate_id::text = $1
     ORDER BY CASE WHEN candidate_code = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [identifier]
  );

  const candidate = result.rows[0];
  if (!candidate) return null;

  // Admin can access any existing candidate. HR can access only assigned candidates.
  if (!isAdmin(user) &&
      (getUserId(user) == null ||
       candidate.assigned_hr_user_id == null ||
       String(candidate.assigned_hr_user_id) !== String(getUserId(user)))) {
    return null;
  }

  return candidate;
};

const candidateIdentifier = (candidate) =>
  candidate.candidate_code || String(candidate.candidate_id);

const submitAssign = async (req, res) => {
  try {
    const { candidate_id, interviewer_name, round } = req.body;

    if (!candidate_id || !interviewer_name || !round) {
      return res.status(400).json({
        error: 'Candidate, interviewer and round are required'
      });
    }

    const candidate = await findCandidate(candidate_id, req.user);
    if (!candidate) {
      return res.status(404).json({
        error: 'Candidate not found or not assigned to your HR account'
      });
    }

    const result = await pool.query(
      `INSERT INTO assign (candidate_name, interviewer_name, round)
       VALUES ($1, $2, $3) RETURNING *`,
      [candidateIdentifier(candidate), interviewer_name, round]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning interview:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAssignments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*
       FROM assign a
       LEFT JOIN public.candidates c
         ON c.candidate_code = a.candidate_name
         OR c.candidate_id::text = a.candidate_name
       WHERE ($1::boolean OR c.assigned_hr_user_id = $2)
       ORDER BY a.candidate_name`,
      [isAdmin(req), getUserId(req)]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = getUserId(req);
    const admin = isAdmin(req);

    const result = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE LOWER(s.status) = 'completed') AS completed,
         COUNT(*) FILTER (WHERE LOWER(s.status) = 'pending') AS pending
       FROM schedules s
       LEFT JOIN public.candidates c
         ON c.candidate_code = s.candidate_name
         OR c.candidate_id::text = s.candidate_name
       WHERE ($1::boolean OR c.assigned_hr_user_id = $2)`,
      [admin, userId]
    );

    const shortlisted = await pool.query(
      `SELECT COUNT(*) AS total
       FROM shortlist s
       LEFT JOIN public.candidates c
         ON c.candidate_code = s.candidate_name
         OR c.candidate_id::text = s.candidate_name
       WHERE LOWER(s.status) = 'shortlisted'
         AND ($1::boolean OR c.assigned_hr_user_id = $2)`,
      [admin, userId]
    );

    return res.json({
      totalInterviews: Number(result.rows[0].total),
      completed: Number(result.rows[0].completed),
      pending: Number(result.rows[0].pending),
      shortlisted: Number(shortlisted.rows[0].total)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const addSchedule = async (req, res) => {
  try {
    const { candidate_id, role, date, time, status } = req.body;

    if (!candidate_id || !role || !date || !time || !status) {
      return res.status(400).json({
        error: 'Candidate, role, date, time and status are required'
      });
    }

    const candidate = await findCandidate(candidate_id, req.user);
    if (!candidate) {
      return res.status(404).json({
        error: 'Candidate not found or not assigned to your HR account'
      });
    }

    const result = await pool.query(
      `INSERT INTO schedules (candidate_name, role, date, time, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [candidateIdentifier(candidate), role, date, time, status]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding schedule:', error);
    return res.status(500).json({ error: 'Failed to add schedule' });
  }
};

const getAllSchedules = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*
       FROM schedules s
       LEFT JOIN public.candidates c
         ON c.candidate_code = s.candidate_name
         OR c.candidate_id::text = s.candidate_name
       WHERE ($1::boolean OR c.assigned_hr_user_id = $2)
       ORDER BY s.date, s.time`,
      [isAdmin(req), getUserId(req)]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return res.status(500).json({ error: 'Failed to get schedules' });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { candidate_id, interviewer, feedback, rating } = req.body;

    if (!candidate_id || !interviewer || !feedback || rating === undefined || rating === null) {
      return res.status(400).json({
        error: 'Candidate, interviewer, feedback and rating are required'
      });
    }

    const candidate = await findCandidate(candidate_id, req.user);
    if (!candidate) {
      return res.status(404).json({
        error: 'Candidate not found or not assigned to your HR account'
      });
    }

    const numericRating = Number(rating);
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        error: 'Rating must be an integer from 1 to 5'
      });
    }

    const result = await pool.query(
      `INSERT INTO feedbacks (candidate_name, interviewer, feedback, rating)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [candidateIdentifier(candidate), interviewer, feedback, numericRating]
    );

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });
  } catch (error) {
    console.error('Error inserting feedback:', error);
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

const submitShortlist = async (req, res) => {
  try {
    const { candidate_id, status } = req.body;
    const normalizedStatus = String(status || '').trim().toLowerCase();

    if (!candidate_id || !['shortlisted', 'rejected'].includes(normalizedStatus)) {
      return res.status(400).json({
        error: 'Candidate ID and a valid status (shortlisted or rejected) are required'
      });
    }

    const candidate = await findCandidate(candidate_id, req.user);
    if (!candidate) {
      return res.status(404).json({
        error: 'Candidate not found or not assigned to your HR account'
      });
    }

    const result = await pool.query(
      `INSERT INTO shortlist (candidate_name, status)
       VALUES ($1, $2) RETURNING *`,
      [candidateIdentifier(candidate), normalizedStatus]
    );

    return res.status(201).json({
      ...result.rows[0],
      candidate_id: result.rows[0].candidate_name
    });
  } catch (error) {
    console.error('Error submitting shortlist:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getShortlists = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, s.candidate_name AS candidate_id
       FROM shortlist s
       LEFT JOIN public.candidates c
         ON c.candidate_code = s.candidate_name
         OR c.candidate_id::text = s.candidate_name
       WHERE ($1::boolean OR c.assigned_hr_user_id = $2)
       ORDER BY s.candidate_name`,
      [isAdmin(req), getUserId(req)]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shortlists:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  submitAssign,
  getAssignments,
  getDashboardStats,
  addSchedule,
  getAllSchedules,
  submitFeedback,
  submitShortlist,
  getShortlists
};