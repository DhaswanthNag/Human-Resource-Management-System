import pool from "../config/db.js";
import { sendEmail, sendEmailWithAttachment } from "../utils/emailService.js";
import fs from "fs";
import path from "path";

// ✅ Get all offers
export const getOffers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM offer_letters ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching offers:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get single offer by ID
export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM offer_letters WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Offer letter not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching offer:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create offer letter
export const createOffer = async (req, res) => {
  try {
    const {
      offer_id,
      candidate_name,
      email,
      mobile,
      designation,
      ctc,
      joining_date,
      address,
      offer_date,
      pdf_link,
    } = req.body;

    const result = await pool.query(
      `INSERT INTO offer_letters
      (offer_id, candidate_name, email, mobile, designation, ctc, joining_date, address, offer_date, pdf_link, created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      RETURNING *`,
      [offer_id, candidate_name, email, mobile, designation, ctc, joining_date, address, offer_date, pdf_link]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating offer:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update offer letter
export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      offer_id,
      candidate_name,
      email,
      mobile,
      designation,
      ctc,
      joining_date,
      address,
      offer_date,
      pdf_link,
    } = req.body;

    const result = await pool.query(
      `UPDATE offer_letters SET
        offer_id=$1,
        candidate_name=$2,
        email=$3,
        mobile=$4,
        designation=$5,
        ctc=$6,
        joining_date=$7,
        address=$8,
        offer_date=$9,
        pdf_link=$10
      WHERE id=$11 RETURNING *`,
      [offer_id, candidate_name, email, mobile, designation, ctc, joining_date, address, offer_date, pdf_link, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Offer letter not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating offer:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete offer
export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM offer_letters WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Offer letter not found" });
    }

    res.json({ message: "Offer letter deleted successfully" });
  } catch (err) {
    console.error("Error deleting offer:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};

export const sendOfferEmail = async (req, res) => {
  try {
    const { to, subject, body } = req.body;

    // Check if PDF file buffer is available
    if (req.file) {
      // Send email with PDF attachment from buffer
      await sendEmailWithAttachment(
        to,
        subject,
        `${body}\n\nPlease find your offer letter attached.`,
        req.file.buffer,
        req.file.originalname
      );

      return res.json({ message: `✅ Email with PDF attachment sent successfully to ${to}` });
    }

    // Fallback email without attachment
    await sendEmail(to, subject, `${body}\n\nNo PDF attached.`);

    res.json({ message: `✅ Email sent successfully to ${to}` });
  } catch (err) {
    console.error("Error sending email:", err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
};
