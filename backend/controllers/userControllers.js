const { adduser, getUserById, getAllUsers, updateUser, deleteUser,totalUsers, totalEmployees, totalHR} = require('../models/userModel');
const { sendEmail } = require('../utils/emailService');
const db = require('../config/db');
// const bcrypt = require('bcrypt');

async function generateUserId(role) {
  const prefix = role === "hr" ? "hr" : "emp"; // role-based prefix

  const query = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(user_id, '\\d+$') AS INTEGER)), 0) AS last_num
    FROM users
    WHERE user_id LIKE $1
  `;

  const result = await db.query(query, [`${prefix}%`]);
  const lastNum = result.rows[0].last_num || 0;
  const newNum = lastNum + 1;

  // format like emp001
  return `${prefix}${newNum.toString().padStart(3, "0")}`;
}

async function generatePassword() {
  const length = 5;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const createUser = async (req, res) => {
  const { email, role, name, position } = req.body;

  try {
    if (!email || !role || !name || !position) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const password = await generatePassword();
    const user_id = await generateUserId(role);

    const newUser = await adduser({
      email,
      role,
      name,
      position,
      password,
      userId: user_id
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};  

const viewUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await getUserById(userId); 
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const listUsers = async (req, res) => {
  try { 
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};  

const updateUserDetails = async (req, res) => {
  const { userId } = req.params;
  const { name, email, role, position } = req.body;
  try {
    const updatedUser = await updateUser(userId, { name, email, role, position });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteUserAccount = async (req, res) => {
  const { userId } = req.params;
    try {
    await deleteUser(userId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTotalUsers = async (req, res) => {
  try {
    const count = await totalUsers();
    res.status(200).json({ totalUsers: count });
  } catch (error) {
    console.error('Error fetching total users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTotalEmployees = async (req, res) => {
  try {
    const count = await totalEmployees();
    res.status(200).json({ totalEmployees: count });
  } catch (error) {
    console.error('Error fetching total employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTotalHR = async (req, res) => {
  try {
    const count = await totalHR();
    res.status(200).json({ totalHR: count });
  } catch (error) {
    console.error('Error fetching total HR:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const shareCredentials = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await sendEmail(
      user.email,
      'Your Credentials',
      `Here are your credentials:\n\nUser ID: ${user.user_id}\nPassword: ${user.password}\n\nPlease change your password after logging in for the first time.`
    );

    res.status(200).json({ message: 'Credentials shared successfully' });
  } catch (error) {
    console.error('Error sharing credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
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
  getTotalHR
};