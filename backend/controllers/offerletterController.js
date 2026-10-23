import pool from "../config/db.js";
import { sendEmailWithAttachment } from "../utils/emailService.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, "../uploads/offer-letters");

const savePdf = async (file, offerId) => {
  if (!file) return { pdf_link: null, pdf_file_name: null };
  await fs.mkdir(uploadDir, { recursive: true });
  const safeId = String(offerId).replace(/[^a-zA-Z0-9_-]/g, "_");
  const pdf_file_name = `OfferLetter_${safeId}_${Date.now()}.pdf`;
  await fs.writeFile(path.join(uploadDir, pdf_file_name), file.buffer);
  return { pdf_link: `/uploads/offer-letters/${pdf_file_name}`, pdf_file_name };
};

const deletePdfFile = async (fileName) => {
  if (!fileName || path.basename(fileName) !== fileName) return;
  const pdfPath = path.resolve(uploadDir, fileName);
  if (!pdfPath.startsWith(`${uploadDir}${path.sep}`)) return;
  await fs.unlink(pdfPath).catch((err) => {
    if (err.code !== "ENOENT") console.error("PDF cleanup failed:", err.message);
  });
};

// Get all offers
export const getOffers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.offer_letters ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching offers:", err.message);
    res.status(500).json({ error: "Failed to fetch offer letters" });
  }
};

// Get the next unique Offer ID
export const getNextOfferId = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(
        MAX((regexp_match(offer_id, '^offer([0-9]+)$'))[1]::integer),
        0
      ) + 1 AS next_id
      FROM public.offer_letters
    `);
    const nextId = `offer${String(result.rows[0].next_id).padStart(3, "0")}`;
    res.json({ offer_id: nextId });
  } catch (err) {
    console.error("Error generating Offer ID:", err.message);
    res.status(500).json({ error: "Failed to generate Offer ID" });
  }
};

// Get single offer by ID
export const getOfferById = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.offer_letters WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Offer letter not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching offer:", err.message);
    res.status(500).json({ error: "Failed to fetch offer letter" });
  }
};

// Create offer letter and store its PDF
export const createOffer = async (req, res) => {
  let savedPdfPath;
  try {
    const {
      offer_id, candidate_name, email, mobile, designation,
      ctc, joining_date, address, offer_date
    } = req.body;

    if (!String(offer_id || "").trim() ||
        !String(candidate_name || "").trim() ||
        !String(email || "").trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()) ||
        !String(designation || "").trim() ||
        !Number.isFinite(Number(ctc)) || Number(ctc) <= 0 ||
        !joining_date) {
      return res.status(400).json({ error: "Required offer details are missing or invalid" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Offer letter PDF is required" });
    }

    const pdf = await savePdf(req.file, offer_id);
    savedPdfPath = path.join(uploadDir, pdf.pdf_file_name);

    const result = await pool.query(
      `INSERT INTO public.offer_letters
       (offer_id, candidate_name, email, mobile, designation, ctc, joining_date,
        address, offer_date, pdf_link, pdf_file_name, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9::date,CURRENT_DATE),$10,$11,'draft',NOW(),NOW())
       RETURNING *`,
      [
        String(offer_id).trim(), String(candidate_name).trim(), String(email).trim(),
        mobile || null, String(designation).trim(), Number(ctc), joining_date,
        address || null, offer_date || null, pdf.pdf_link, pdf.pdf_file_name
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (savedPdfPath) await fs.unlink(savedPdfPath).catch(() => {});
    console.error("Error creating offer:", err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "This Offer ID already exists. Use a unique Offer ID." });
    }
    res.status(500).json({ error: "Failed to save offer letter" });
  }
};

// Update offer letter details and replace its PDF when provided
export const updateOffer = async (req, res) => {
  let savedPdfPath;
  try {
    const {
      offer_id, candidate_name, email, mobile, designation,
      ctc, joining_date, address, offer_date
    } = req.body;

    if (!String(offer_id || "").trim() ||
        !String(candidate_name || "").trim() ||
        !String(email || "").trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim()) ||
        !String(designation || "").trim() ||
        !Number.isFinite(Number(ctc)) || Number(ctc) <= 0 ||
        !joining_date) {
      return res.status(400).json({ error: "Required offer details are missing or invalid" });
    }

    const current = await pool.query(
      "SELECT id, pdf_file_name FROM public.offer_letters WHERE id = $1",
      [req.params.id]
    );

    if (!current.rows.length) {
      return res.status(404).json({ error: "Offer letter not found" });
    }

    const oldPdfName = current.rows[0].pdf_file_name;
    const pdf = req.file ? await savePdf(req.file, offer_id) : null;

    if (pdf) savedPdfPath = path.join(uploadDir, pdf.pdf_file_name);

    const result = await pool.query(
      `UPDATE public.offer_letters SET
       offer_id=$1, candidate_name=$2, email=$3, mobile=$4, designation=$5,
       ctc=$6, joining_date=$7, address=$8,
       offer_date=COALESCE($9::date,offer_date),
       pdf_link=COALESCE($10,pdf_link),
       pdf_file_name=COALESCE($11,pdf_file_name),
       updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [
        String(offer_id).trim(), String(candidate_name).trim(), String(email).trim(),
        mobile || null, String(designation).trim(), Number(ctc), joining_date,
        address || null, offer_date || null, pdf?.pdf_link ?? null,
        pdf?.pdf_file_name ?? null, req.params.id
      ]
    );

    if (!result.rows.length) {
      if (savedPdfPath) await fs.unlink(savedPdfPath).catch(() => {});
      return res.status(404).json({ error: "Offer letter not found" });
    }

    if (pdf && oldPdfName && oldPdfName !== pdf.pdf_file_name) {
      await deletePdfFile(oldPdfName);
    }

    savedPdfPath = null;
    res.json(result.rows[0]);
  } catch (err) {
    if (savedPdfPath) await fs.unlink(savedPdfPath).catch(() => {});
    console.error("Error updating offer:", err.message);
    if (err.code === "23505") {
      return res.status(409).json({ error: "This Offer ID already exists. Use a unique Offer ID." });
    }
    res.status(500).json({ error: "Failed to update offer letter" });
  }
};

// Delete offer
export const deleteOffer = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM public.offer_letters WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Offer letter not found" });
    }

    await deletePdfFile(result.rows[0].pdf_file_name);
    res.json({ message: "Offer letter deleted successfully" });
  } catch (err) {
    console.error("Error deleting offer:", err.message);
    res.status(500).json({ error: "Failed to delete offer letter" });
  }
};

// Send offer email with PDF attachment
export const sendOfferEmail = async (req, res) => {
  try {
    const { offer_id, to, subject, body } = req.body;

    if (!offer_id || !to?.trim() || !subject?.trim() || !body?.trim()) {
      return res.status(400).json({ error: "Offer ID, recipient, subject, and message are required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "PDF attachment is required" });
    }

    const result = await pool.query(
      "SELECT id FROM public.offer_letters WHERE offer_id = $1",
      [offer_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Saved offer letter not found" });
    }

    await sendEmailWithAttachment(
      to.trim(),
      subject.trim(),
      `${body}\n\nPlease find your offer letter attached.`,
      req.file.buffer,
      req.file.originalname || `OfferLetter_${offer_id}.pdf`
    );

    await pool.query(
      `UPDATE public.offer_letters
       SET status = 'sent', sent_at = NOW(), updated_at = NOW()
       WHERE offer_id = $1`,
      [offer_id]
    );

    res.json({ message: `Offer letter email sent successfully to ${to.trim()}` });
  } catch (err) {
    console.error("Error sending offer email:", err.message);
    res.status(500).json({ error: "Failed to send offer email. Check the email configuration." });
  }
};
