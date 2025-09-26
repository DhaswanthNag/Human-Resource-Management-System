const db = require('../config/db');

const findUserById = async (userId) => {
  const query = 'SELECT * FROM users WHERE user_id = $1';
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

const updateUserPassword = async (email, newPassword) => {
  const query = 'UPDATE users SET password = $1 WHERE email = $2';
  await db.query(query, [newPassword, email]);
};

const saveOtp = async (email, otp, expiresAt) => {
  await db.query(
    'INSERT INTO forgot_password (email, otp, expires_at) VALUES ($1, $2, $3)',
    [email, otp, expiresAt]
  );
};

const verifyOtp = async (email, otp) => {
  const result = await db.query(
    'SELECT * FROM forgot_password WHERE email = $1 AND otp = $2 AND expires_at > NOW()',
    [email, otp]
  );
  return result.rows[0];
};

const deleteOtp = async (email) => {
  await db.query('DELETE FROM forgot_password WHERE email = $1', [email]);
};


module.exports = {
  findUserById,
  updateUserPassword,
  saveOtp,
  verifyOtp,
  deleteOtp
};
