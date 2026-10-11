const pool = require('../config/db');
/* assigncontrollers*/
const submitAssign = async (req, res) => {
  try {
    const { candidate_id, interviewer_name, round } = req.body;

    const result = await pool.query(
      'INSERT INTO assign (candidate_id, interviewer_name, round) VALUES ($1, $2, $3) RETURNING *',
      [candidate_id, interviewer_name, round]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error assigning:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAssignments = async (req, res) => {
  try {

    const result = await pool.query('SELECT * FROM assign ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/* dashboardcontrollers*/



const getDashboardStats = async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM schedules');
    const completedResult = await pool.query("SELECT COUNT(*) FROM schedules WHERE status = 'completed'");
    const pendingResult = await pool.query("SELECT COUNT(*) FROM schedules WHERE status = 'pending'");
    const shortlistedResult = await pool.query('SELECT COUNT(*) FROM shortlist');

    res.json({
      totalInterviews: parseInt(totalResult.rows[0].count),
      completed: parseInt(completedResult.rows[0].count),
      pending: parseInt(pendingResult.rows[0].count),
      shortlisted: parseInt(shortlistedResult.rows[0].count)
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/*schedulecontrollers*/

const addSchedule = async (req, res) => {
  const { candidate_id, role, date, time ,status} = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO schedules(candidate_id, role, date, time, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [candidate_id, role, date, time, status ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding schedule:', err.message);
    res.status(500).json({ error: 'Failed to add schedule' });
  }
};

// GET /api/schedules
const getAllSchedules = async (req, res) => {
  try {


    const result = await pool.query('SELECT * FROM schedules ORDER BY date, time');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching schedules:', err);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
};

module.exports = {
  addSchedule,
  getAllSchedules,
};
/* feedbackcontrollers*/



// POST /api/feedbacks
const submitFeedback = async (req, res) => {
  const { candidate_id, interviewer, feedback, rating } = req.body;

  if (!candidate_id || !interviewer || !feedback || rating === undefined) {
    return res.status(400).json({ error: 'All fields including rating are required' });
  }

  try {
    // Save feedback to DB, adjust table and column names as per your schema
    const query = `INSERT INTO feedbacks (candidate_id, interviewer, feedback, rating) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [candidate_id, interviewer, feedback, rating];

    const result = await pool.query(query, values);
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: result.rows[0] });
  } catch (error) {
    console.error('Error inserting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};




/*shortlistcontrollers*/

const submitShortlist = async (req, res) => {
  try {
    console.log("Received Body:", req.body);

    const { candidate_id, status } = req.body;

    const result = await pool.query(
      'INSERT INTO shortlist (candidate_id, status) VALUES ($1, $2) RETURNING *',
      [candidate_id, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting shortlist:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getShortlists = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shortlist ORDER BY id DESC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching shortlists:', error.message);
    res.status(500).json({ error: 'Internal server error' });
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
