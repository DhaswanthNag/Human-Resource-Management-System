import pool from "../config/db.js";

// meetingController.js

export const getMeetings = async (req, res) => {
  try {
    const { employeeId } = req.query;
    let result;
    if (employeeId) {
      result = await pool.query(
        'SELECT * FROM meetings WHERE employee_id = $1 ORDER BY id ASC',
        [employeeId]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM meetings ORDER BY id ASC'
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching meetings:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM meetings WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching meeting:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const createMeeting = async (req, res) => {
  try {
    const { meeting_title, meeting_type, meeting_link, start_time, end_time, employee_id } = req.body;

    const result = await pool.query(
      `INSERT INTO meetings (meeting_title, meeting_type, meeting_link, start_time, end_time, employee_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [meeting_title, meeting_type, meeting_link, start_time, end_time, employee_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating meeting:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { meeting_title, meeting_type, meeting_link, start_time, end_time, employee_id } = req.body;

    const result = await pool.query(
      `UPDATE meetings
       SET meeting_title = $1, meeting_type = $2, meeting_link = $3, start_time = $4, end_time = $5, employee_id = $6
       WHERE id = $7 RETURNING *`,
      [meeting_title, meeting_type, meeting_link, start_time, end_time, employee_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating meeting:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM meetings WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    res.json({ message: "Meeting deleted successfully" });
  } catch (err) {
    console.error("Error deleting meeting:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
