require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const validateEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      "Email configuration is missing. Please set EMAIL_USER and EMAIL_PASS in backend/.env"
    );
  }
};

const sendEmail = async (to, subject, text) => {
  try {
    validateEmailConfig();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });

    console.log(`✅ Email sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
    throw new Error("Failed to send email");
  }
};

const sendEmailWithAttachment = async (
  to,
  subject,
  text,
  pdfBuffer,
  filename = "OfferLetter.pdf"
) => {
  try {
    validateEmailConfig();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    console.log(`📎 Email with attachment sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ Email with attachment failed:", err.message);
    throw new Error("Failed to send email with attachment");
  }
};

module.exports = { sendEmail, sendEmailWithAttachment };