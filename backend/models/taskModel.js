import pool from "../config/db.js";

// Create Task
export const createTaskModel = async ({ title, description, assigned_to, status }) => {
  const result = await pool.query(
    "INSERT INTO tasks (title, description, assigned_to, status) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, description, assigned_to, status]
  );
  return result.rows[0];
};

// Get All Tasks
export const getTasksModel = async () => {
  const result = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
  return result.rows;
};

// ✅ Update Task (edit all fields)
export const updateTaskModel = async (id, { title, description, assigned_to, status }) => {
  const result = await pool.query(
    `UPDATE tasks 
     SET title = $1, description = $2, assigned_to = $3, status = $4
     WHERE id = $5 RETURNING *`,
    [title, description, assigned_to, status, id]
  );
  return result.rows[0];
};

// ✅ Delete Task
export const deleteTaskModel = async (id) => {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

// Stats
export const getTaskStatsModel = async () => {
  const result = await pool.query(
    "SELECT status, COUNT(*) as count FROM tasks GROUP BY status"
  );
  return result.rows;
};