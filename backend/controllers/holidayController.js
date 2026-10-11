import pool from "../config/db.js";

// Get all holidays
export const getHolidays = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM holidays ORDER BY holiday_date ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching holidays:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Get holiday by ID
export const getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM holidays WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching holiday:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Create a holiday
export const createHoliday = async (req, res) => {
  try {
    const { holiday_title, holiday_date, description } = req.body;

    const result = await pool.query(
      `INSERT INTO holidays (holiday_title, holiday_date, description, created_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [holiday_title, holiday_date, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating holiday:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Update a holiday
export const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { holiday_title, holiday_date, description } = req.body;

    const result = await pool.query(
      `UPDATE holidays
       SET holiday_title = $1, holiday_date = $2, description = $3
       WHERE id = $4 RETURNING *`,
      [holiday_title, holiday_date, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating holiday:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a holiday
export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM holidays WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    res.json({ message: "Holiday deleted successfully" });
  } catch (err) {
    console.error("Error deleting holiday:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
