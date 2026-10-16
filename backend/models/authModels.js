
const db = require('../config/db');
const bcrypt = require('bcrypt');

const findUserById = async (userId) => {
  const query = 'SELECT * FROM users WHERE user_id = $1';
  const result = await db.query(query, [userId]);
  return result.rows[0];
};

const updateUserPassword = async (email, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const query = 'UPDATE users SET password = $1 WHERE LOWER(email) = $2';
  const result = await db.query(query, [hashedPassword, email.trim().toLowerCase()]);

  if (result.rowCount === 0) {
    throw new Error('User not found while updating password');
  }
};

const saveOtp = async (email, otp, expiresAt) => {
  await db.query(
    'DELETE FROM forgot_password WHERE LOWER(email) = $1',
    [email.trim().toLowerCase()]
  );

  await db.query(
    'INSERT INTO forgot_password (email, otp, expires_at) VALUES ($1, $2, $3)',
    [email.trim().toLowerCase(), otp, expiresAt]
  );
};

const verifyOtp = async (email, otp) => {
  const result = await db.query(
    'SELECT * FROM forgot_password WHERE LOWER(email) = $1 AND otp = $2 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
    [email.trim().toLowerCase(), otp]
  );
  return result.rows[0];
};

const deleteOtp = async (email) => {
  await db.query(
    'DELETE FROM forgot_password WHERE LOWER(email) = $1',
    [email.trim().toLowerCase()]
  );
};

module.exports = {
  findUserById,
  updateUserPassword,
  saveOtp,
  verifyOtp,
  deleteOtp
};
