const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  findUserById,
  updateUserPassword,
  saveOtp,
  verifyOtp,
  deleteOtp,
} = require("../models/authModels");
const { sendEmail } = require("../utils/emailService");
const pool = require("../config/db");

const loginUser = async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ message: "User ID and password are required" });
  }

  try {
    const user = await findUserById(userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid User ID" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    let dashboardRoute = "/";
    switch (user.role) {
      case "admin":
        dashboardRoute = "/admin";
        break;
      case "hr":
        dashboardRoute = "/hr";
        break;
      case "employee":
        dashboardRoute = "/employee";
        break;
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      role: user.role,
      userId: user.user_id,
      dashboard: dashboardRoute,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await saveOtp(email, otp, expiresAt);

    await sendEmail(email, "Your OTP Code", `Your OTP is ${otp}. It expires in 15 minutes.`);

    res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const validOtp = await verifyOtp(email, otp);
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await updateUserPassword(email, newPassword);
    await deleteOtp(email);

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};

module.exports = { loginUser, sendOtp, resetPassword };
