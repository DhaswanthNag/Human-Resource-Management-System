import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw new Error("Failed to send email");
  }
};

export const sendEmailWithAttachment = async (to, subject, text, pdfBuffer, filename = "OfferLetter.pdf") => {
  try {
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
    console.log(`📎 Email with PDF sent successfully to ${to}`);
  } catch (err) {
    console.error("❌ Email with attachment failed:", err);
    throw new Error("Failed to send email with attachment");
  }
};
