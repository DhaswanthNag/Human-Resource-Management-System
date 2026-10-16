
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
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
    const isBcryptHash = typeof user.password === "string" && /^\$2[aby]\$\d{2}\$/.test(user.password);
    let passwordMatches = false;
    if (isBcryptHash) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      passwordMatches = user.password === password;
      if (passwordMatches) {
        const hashedPassword = await bcrypt.hash(password, 12);
        await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [hashedPassword, user.user_id]);
      }
    }
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid password" });
    }
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ message: "Authentication configuration error" });
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
    const token = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return res.status(200).json({ token, role: user.role, userId: user.user_id, dashboard: dashboardRoute });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Email is required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await pool.query(
      "SELECT user_id FROM users WHERE LOWER(email) = $1",
      [normalizedEmail]
    );
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await saveOtp(normalizedEmail, otp, expiresAt);
    await sendEmail(
      normalizedEmail,
      "Your OTP Code",
      `Your OTP is ${otp}. It expires in 15 minutes.`
    );

    return res.json({ message: "OTP sent to email" });
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return res.status(500).json({ message: "Error sending OTP" });
  }
};

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (
    !email ||
    typeof email !== "string" ||
    !otp ||
    typeof newPassword !== "string" ||
    newPassword.length === 0
  ) {
    return res.status(400).json({ message: "Email, OTP and a non-empty new password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const validOtp = await verifyOtp(normalizedEmail, String(otp));
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await updateUserPassword(normalizedEmail, newPassword);
    await deleteOtp(normalizedEmail);

    return res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Error resetting password:", error.message);
    return res.status(500).json({ message: "Error resetting password" });
  }
};

module.exports = { loginUser, sendOtp, resetPassword };
