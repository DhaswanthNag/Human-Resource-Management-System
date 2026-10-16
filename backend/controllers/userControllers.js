
const {
  adduser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  totalUsers,
  totalEmployees,
  totalHR,
  getEmployeeProfile,
  saveEmployeeProfile
} = require('../models/userModel');

const { sendEmail } = require('../utils/emailService');
const { sendSetupEmail } = require('./userSetupController');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function generateUserId(role) {
  const prefix = role === "hr" ? "hr" : "emp";

  const query = `
    SELECT COALESCE(
      MAX(CAST(SUBSTRING(user_id FROM '[0-9]+$') AS INTEGER)),
      0
    ) AS last_num
    FROM users
    WHERE user_id LIKE $1
  `;

  const result = await db.query(query, [`${prefix}%`]);
  const lastNum = Number(result.rows[0].last_num || 0);
  const newNum = lastNum + 1;

  return `${prefix}${newNum.toString().padStart(3, "0")}`;
}

async function generatePassword() {
  // Generate a cryptographically secure temporary password.
  return crypto.randomBytes(12).toString('base64url');
}

const createUser = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const role = req.body.role?.trim().toLowerCase();
  const name = req.body.name?.trim();
  const position = req.body.position?.trim();

  try {
    if (!email || !role || !name || !position) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    if (!['hr', 'employee'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be either hr or employee'
      });
    }

    const password = await generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user_id = await generateUserId(role);

    const newUser = await adduser({
      email,
      role,
      name,
      position,
      password: hashedPassword,
      userId: user_id
    });

    // Never return the stored password hash.
    const { password: savedPassword, ...safeUser } = newUser || {};

    let emailSent = false;

    try {
      await sendSetupEmail(safeUser);
      emailSent = true;
    } catch (emailError) {
      console.error('Error sending initial setup email:', emailError.message);
    }

    return res.status(201).json({
      ...safeUser,
      emailSent,
      message: emailSent
        ? 'User created and password setup email sent successfully'
        : 'User created, but the password setup email could not be sent. Use Send Email to retry.'
    });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'A user with this email or ID already exists'
      });
    }

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const viewUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const { password, ...safeUser } = user;

    return res.status(200).json(safeUser);
  } catch (error) {
    console.error('Error fetching user:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();

    // Do not expose password hashes in the user list.
    const safeUsers = users.map(({ password, ...user }) => user);

    return res.status(200).json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const updateUserDetails = async (req, res) => {
  const { userId } = req.params;

  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const role = req.body.role?.trim().toLowerCase();
  const position = req.body.position?.trim();

  try {
    if (!name || !email || !role || !position) {
      return res.status(400).json({
        error: 'All fields are required'
      });
    }

    if (!['hr', 'employee'].includes(role)) {
      return res.status(400).json({
        error: 'Role must be either hr or employee'
      });
    }

    const updatedUser = await updateUser(userId, {
      name,
      email,
      role,
      position
    });

    if (!updatedUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const { password, ...safeUser } = updatedUser;

    return res.status(200).json(safeUser);
  } catch (error) {
    console.error('Error updating user:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        error: 'A user with this email already exists'
      });
    }

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const deleteUserAccount = async (req, res) => {
  const { userId } = req.params;

  try {
    await deleteUser(userId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const getTotalUsers = async (req, res) => {
  try {
    const count = await totalUsers();

    return res.status(200).json({
      totalUsers: count
    });
  } catch (error) {
    console.error('Error fetching total users:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const getTotalEmployees = async (req, res) => {
  try {
    const count = await totalEmployees();

    return res.status(200).json({
      totalEmployees: count
    });
  } catch (error) {
    console.error('Error fetching total employees:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const getTotalHR = async (req, res) => {
  try {
    const count = await totalHR();

    return res.status(200).json({
      totalHR: count
    });
  } catch (error) {
    console.error('Error fetching total HR:', error);

    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

const shareCredentials = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (!user.email) {
      return res.status(400).json({
        error: 'User has no email address'
      });
    }

    await sendSetupEmail(user);

    return res.status(200).json({
      success: true,
      message: 'Password setup link sent successfully'
    });
  } catch (error) {
    console.error('Error sending password setup link:', error);

    return res.status(500).json({
      error: 'Unable to send password setup link'
    });
  }
};

// Fetch the profile belonging to the currently authenticated account.
const getMyProfile = async (req, res) => {
  const userId = req.user?.userId || req.user?.user_id;

  try {
    if (!userId) {
      return res.status(401).json({
        message: 'Unable to identify logged-in user'
      });
    }

    const profile = await getEmployeeProfile(userId);

    if (!profile) {
      return res.status(404).json({
        message: 'User profile not found'
      });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching own profile:', error);

    return res.status(500).json({
      message: 'Unable to fetch profile'
    });
  }
};

// Update only the profile belonging to the currently authenticated account.
const updateMyProfile = async (req, res) => {
  const userId = req.user?.userId || req.user?.user_id;

  try {
    if (!userId) {
      return res.status(401).json({
        message: 'Unable to identify logged-in user'
      });
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    const position = typeof req.body.position === 'string'
      ? req.body.position.trim()
      : '';

    if (!name || !email || !position) {
      return res.status(400).json({
        message: 'Name, email, and position are required'
      });
    }

    const profile = {
      name,
      email,
      position,
      phone: req.body.phone,
      location: req.body.location,
      bio: req.body.bio,
      skills: req.body.skills,
      experience: req.body.experience,
      education: req.body.education,
      emergency_contact: req.body.emergency_contact,
      profilePhoto: req.body.profilePhoto
    };

    const updatedProfile = await saveEmployeeProfile(userId, profile);

    if (!updatedProfile) {
      return res.status(404).json({
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating own profile:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        message: 'That email address is already being used'
      });
    }

    return res.status(500).json({
      message: 'Unable to update profile'
    });
  }
};

module.exports = {
  createUser,
  viewUser,
  listUsers,
  getTotalUsers,
  updateUserDetails,
  deleteUserAccount,
  shareCredentials,
  getTotalEmployees,
  getTotalHR,
  getMyProfile,
  updateMyProfile
};
