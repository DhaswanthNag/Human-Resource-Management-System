
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const {
  getUserById,
  createUserSetupToken,
  findValidUserSetupToken,
  consumeUserSetupToken,
  deleteUserSetupToken
} = require("../models/userModel");
const { sendEmail } = require("../utils/emailService");

const sendSetupEmail = async (user) => {
  if (!user || !user.user_id || !user.email) {
    throw new Error("User ID and email are required to send a setup link");
  }

  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await createUserSetupToken(user.user_id, tokenHash, expiresAt);

  const setupUrl =
    `${frontendUrl.replace(/\/+$/, "")}/setup-password/${rawToken}`;

  try {
    await sendEmail(
      user.email,
      "Set Up Your Nexora HRMS Account",
      `Hello ${user.name || "User"},\n\n` +
        "Your Nexora HRMS account has been created.\n\n" +
        `User ID: ${user.user_id}\n\n` +
        "Use the secure link below to set your password:\n" +
        `${setupUrl}\n\n` +
        "This link expires in 30 minutes and can only be used once.\n" +
        "If you did not expect this email, please contact your HR team.\n\n" +
        "Nexora Technology Solutions Private Limited"
    );
  } catch (error) {
    try {
      await deleteUserSetupToken(tokenHash);
    } catch (cleanupError) {
      console.error("Error deleting unused setup token:", cleanupError.message);
    }

    throw error;
  }

  return true;
};

const issueSetupLink = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await sendSetupEmail(user);

    return res.status(200).json({
      success: true,
      message: "Password setup email sent successfully"
    });
  } catch (error) {
    console.error("Error sending setup email:", error.message);
    return res.status(500).json({
      message: "Unable to send password setup email"
    });
  }
};

const validateSetupToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        valid: false,
        message: "Invalid or expired setup link"
      });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await findValidUserSetupToken(tokenHash);

    if (!user) {
      return res.status(400).json({
        valid: false,
        message: "This setup link is invalid, expired, or already used"
      });
    }

    return res.status(200).json({
      valid: true,
      userId: user.user_id,
      name: user.name
    });
  } catch (error) {
    console.error("Error validating setup link:", error.message);
    return res.status(500).json({
      valid: false,
      message: "Unable to validate setup link"
    });
  }
};

const setInitialPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body || {};

  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({
      message: "Invalid or expired setup link"
    });
  }

    if (typeof password !== "string" || password.length < 1) {
    return res.status(400).json({
        message: "Password cannot be empty"
    });
    }

  if (password.length > 128) {
    return res.status(400).json({
      message: "Password must not exceed 128 characters"
    });
  }

  try {
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const hashedPassword = await bcrypt.hash(password, 12);

    const consumed = await consumeUserSetupToken(
      tokenHash,
      hashedPassword
    );

    if (!consumed) {
      return res.status(400).json({
        message: "This setup link is invalid, expired, or already used"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password set successfully. You can now sign in."
    });
  } catch (error) {
    console.error("Error setting initial password:", error.message);
    return res.status(500).json({
      message: "Unable to set password"
    });
  }
};

module.exports = {
  sendSetupEmail,
  issueSetupLink,
  validateSetupToken,
  setInitialPassword
};
