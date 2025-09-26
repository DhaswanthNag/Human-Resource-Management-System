const db = require('../config/db');

const adduser = async ({ userId, email, password, role, name, position }) => {
  const result = await db.query(
    'INSERT INTO users (user_id, email, password, role, name, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [userId, email, password, role, name, position]
  );
  return result.rows[0];
}

const getUserById = async (userId) => {
  const result = await db.query(
    'SELECT user_id, email, role, name, position, password FROM users WHERE user_id = $1',
    [userId]
  ); 
  return result.rows[0];
}

const getAllUsers = async () => {
  const result = await db.query('SELECT * FROM users');
  return result.rows;
}

const updateUser = async (userId, { email, role, position, name }) => {
    const result = await db.query(
        'UPDATE users SET email = $1, role = $2, position = $3, name = $4 WHERE user_id = $5 RETURNING *',
        [ email, role, position, name, userId]
    );
    return result.rows[0];
}

const deleteUser = async (userId) => {
    await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
} 

const totalUsers = async () => {
    const result = await db.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count, 10);
}

const totalEmployees = async () => {
    const result = await db.query("SELECT COUNT(*) FROM users WHERE role = 'employee'");
    return parseInt(result.rows[0].count, 10);
}

const totalHR = async () => {
    const result = await db.query("SELECT COUNT(*) FROM users WHERE role = 'hr'");
    return parseInt(result.rows[0].count, 10);
}

module.exports = {
  adduser,
  getUserById,   
  getAllUsers,
  totalUsers,
  updateUser,
  deleteUser,
  totalEmployees,
  totalHR
};
