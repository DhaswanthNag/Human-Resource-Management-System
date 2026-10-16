const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const adduser = async ({ userId, email, password, role, name, position }) => {
  const result = await db.query(
    'INSERT INTO users (user_id, email, password, role, name, position) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [userId, email, password, role, name, position]
  );
  return result.rows[0];
};

const getUserById = async (userId) => {
  const result = await db.query(
    'SELECT user_id, email, role, name, position, password FROM users WHERE user_id = $1',
    [userId]
  );
  return result.rows[0];
};

const getAllUsers = async () => {
  const result = await db.query('SELECT * FROM users');
  return result.rows;
};

const updateUser = async (userId, { email, role, position, name }) => {
  const result = await db.query(
    'UPDATE users SET email = $1, role = $2, position = $3, name = $4 WHERE user_id = $5 RETURNING *',
    [email, role, position, name, userId]
  );
  return result.rows[0];
};

const deleteUser = async (userId) => {
  await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
};

const resetUserPassword = async (userId) => {
  const temporaryPassword = crypto.randomBytes(12).toString('base64url');
  const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

  const result = await db.query(
    'UPDATE users SET password = $1 WHERE user_id = $2 RETURNING user_id',
    [hashedPassword, userId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return { userId: result.rows[0].user_id, temporaryPassword };
};

const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const result = await db.query(
    'SELECT password FROM users WHERE user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return { success: false, message: 'User not found' };
  }

  const storedPassword = result.rows[0].password;
  const isBcryptHash =
    typeof storedPassword === 'string' &&
    /^\$2[aby]\$\d{2}\$/.test(storedPassword);

  const passwordMatches = isBcryptHash
    ? await bcrypt.compare(currentPassword, storedPassword)
    : storedPassword === currentPassword;

  if (!passwordMatches) {
    return { success: false, message: 'Current password is incorrect' };
  }

  if (currentPassword === newPassword) {
    return {
      success: false,
      message: 'New password must be different from current password'
    };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.query(
    'UPDATE users SET password = $1 WHERE user_id = $2',
    [hashedPassword, userId]
  );

  return { success: true };
};

const totalUsers = async () => {
  const result = await db.query('SELECT COUNT(*) FROM users');
  return parseInt(result.rows[0].count, 10);
};

const totalEmployees = async () => {
  const result = await db.query("SELECT COUNT(*) FROM users WHERE role = 'employee'");
  return parseInt(result.rows[0].count, 10);
};

const totalHR = async () => {
  const result = await db.query("SELECT COUNT(*) FROM users WHERE role = 'hr'");
  return parseInt(result.rows[0].count, 10);
};

// Fetch the logged-in user's profile and related employee profile details.
const getEmployeeProfile = async (userId) => {
  const result = await db.query(
    `SELECT
       u.user_id,
       u.name,
       u.email,
       u.role,
       u.position,
       u.created_at,
       ep.phone,
       ep.location,
       ep.bio,
       ep.skills,
       ep.experience,
       ep.education,
       ep.emergency_contact,
       ep.profile_photo AS "profilePhoto",
       ep.updated_at
     FROM users u
     LEFT JOIN employee_profiles ep ON ep.user_id = u.user_id
     WHERE u.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const profile = result.rows[0];

  return {
    ...profile,
    skills: profile.skills || [],
    experience: profile.experience || [],
    education: profile.education || [],
    emergency_contact: profile.emergency_contact || {},
    profilePhoto: profile.profilePhoto || ''
  };
};

// Save the logged-in user's editable profile fields.
const saveEmployeeProfile = async (userId, profile) => {
  const {
    name,
    email,
    position,
    phone,
    location,
    bio,
    skills,
    experience,
    education,
    emergency_contact,
    profilePhoto
  } = profile;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `UPDATE users
       SET name = $1, email = $2, position = $3
       WHERE user_id = $4
       RETURNING user_id`,
      [name, email, position, userId]
    );

    if (userResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `INSERT INTO employee_profiles
         (user_id, phone, location, bio, skills, experience, education, emergency_contact, profile_photo, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         phone = EXCLUDED.phone,
         location = EXCLUDED.location,
         bio = EXCLUDED.bio,
         skills = EXCLUDED.skills,
         experience = EXCLUDED.experience,
         education = EXCLUDED.education,
         emergency_contact = EXCLUDED.emergency_contact,
         profile_photo = COALESCE(EXCLUDED.profile_photo, employee_profiles.profile_photo),
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        phone || null,
        location || null,
        bio || null,
        JSON.stringify(Array.isArray(skills) ? skills : []),
        JSON.stringify(Array.isArray(experience) ? experience : []),
        JSON.stringify(Array.isArray(education) ? education : []),
        JSON.stringify(
          emergency_contact && typeof emergency_contact === 'object'
            ? emergency_contact
            : {}
        ),
        typeof profilePhoto === 'string' && profilePhoto
          ? profilePhoto
          : null
      ]
    );

    await client.query('COMMIT');

    return await getEmployeeProfile(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/*
 * Create a password setup token.
 * Only the SHA-256 hash of the token is stored in the database.
 */
const createUserSetupToken = async (userId, tokenHash, expiresAt) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM user_setup_tokens WHERE user_id = $1',
      [userId]
    );

    await client.query(
      `INSERT INTO user_setup_tokens
         (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/*
 * Find a valid, unexpired password setup token.
 */
const findValidUserSetupToken = async (tokenHash) => {
  const result = await db.query(
    `SELECT
       ust.user_id,
       u.email,
       u.name
     FROM user_setup_tokens ust
     INNER JOIN users u ON u.user_id = ust.user_id
     WHERE ust.token_hash = $1
       AND ust.expires_at > CURRENT_TIMESTAMP`,
    [tokenHash]
  );

  return result.rows[0] || null;
};

/*
 * Set the initial password and consume the setup token.
 * A token can only be used once.
 */
const consumeUserSetupToken = async (tokenHash, hashedPassword) => {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const tokenResult = await client.query(
      `SELECT user_id
       FROM user_setup_tokens
       WHERE token_hash = $1
         AND expires_at > CURRENT_TIMESTAMP
       FOR UPDATE`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    const userId = tokenResult.rows[0].user_id;

    const updateResult = await client.query(
      `UPDATE users
       SET password = $1
       WHERE user_id = $2
       RETURNING user_id`,
      [hashedPassword, userId]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(
      'DELETE FROM user_setup_tokens WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/*
 * Delete a setup token if sending its email fails.
 */
const deleteUserSetupToken = async (tokenHash) => {
  await db.query(
    'DELETE FROM user_setup_tokens WHERE token_hash = $1',
    [tokenHash]
  );
};

module.exports = {
  adduser,
  getUserById,
  getAllUsers,
  totalUsers,
  updateUser,
  deleteUser,
  totalEmployees,
  totalHR,
  resetUserPassword,
  changeUserPassword,
  getEmployeeProfile,
  saveEmployeeProfile,
  createUserSetupToken,
  findValidUserSetupToken,
  consumeUserSetupToken,
  deleteUserSetupToken
};
