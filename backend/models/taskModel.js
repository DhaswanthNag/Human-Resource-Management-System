import pool from "../config/db.js";

// Create a task
export const createTaskModel = async ({ title, description, assigned_to, status }) => {
  const result = await pool.query(
    "INSERT INTO tasks (title, description, assigned_to, status) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, description, assigned_to, status]
  );
  return result.rows[0];
};

// Get all tasks
export const getTasksModel = async () => {
  const result = await pool.query("SELECT * FROM tasks ORDER BY id DESC");
  return result.rows;
};

// Get tasks assigned to specific employee_code
export const getTasksByAssignedToModel = async (assignedTo) => {
  const query = `
    SELECT tasks.*, users.employee_code, users.name
    FROM tasks
    JOIN users ON tasks.assigned_to = users.employee_code
    WHERE users.employee_code = $1
    ORDER BY tasks.id DESC
  `;
  const result = await pool.query(query, [assignedTo]);
  return result.rows;
};

// Update a task
export const updateTaskModel = async (id, { title, description, assigned_to, status }) => {
  const result = await pool.query(
    `UPDATE tasks
     SET title = $1, description = $2, assigned_to = $3, status = $4
     WHERE id = $5 RETURNING *`,
    [title, description, assigned_to, status, id]
  );
  return result.rows[0];
};

// Delete a task
export const deleteTaskModel = async (id) => {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING *", [id]);
  return result.rows[0];
};

// Get task stats
export const getTaskStatsModel = async () => {
  const result = await pool.query("SELECT status, COUNT(*) as count FROM tasks GROUP BY status");
  return result.rows;
};
