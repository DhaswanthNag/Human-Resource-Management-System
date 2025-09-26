import pool from "../config/db.js";

// GET all profiles
export const getProfiles = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM profiles ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET single profile by ID
export const getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM profiles WHERE id = $1", [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Profile not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// CREATE profile
export const createProfile = async (req, res) => {
  try {
    const {
      name, role, title, department, email, phone,
      location, hire_date, manager, bio,
      skills, experience, education, emergency_contact
    } = req.body;

    const profile_photo = req.file ? `/uploads/${req.file.filename}` : null;

    // Helper to parse JSON safely
    const safeParseJSON = (value) => {
      if (!value) return null;
      if (typeof value === "string") {
        try { return JSON.parse(value); } catch { return null; }
      }
      return value;
    };

    const result = await pool.query(
      `INSERT INTO profiles
        (name, role, title, department, email, phone, location, hire_date, manager, bio, skills, experience, education, emergency_contact, profile_photo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        name, role, title, department, email, phone, location, hire_date, manager, bio,
        safeParseJSON(skills),
        safeParseJSON(experience),
        safeParseJSON(education),
        safeParseJSON(emergency_contact),
        profile_photo
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};


// UPDATE profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, role, title, department, email, phone,
      location, hire_date, manager, bio,
      skills, experience, education, emergency_contact
    } = req.body;

    const profile_photo = req.file ? `/uploads/${req.file.filename}` : undefined;

    const existing = await pool.query("SELECT * FROM profiles WHERE id = $1", [id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Profile not found" });

    const result = await pool.query(
      `UPDATE profiles SET
        name=$1, role=$2, title=$3, department=$4, email=$5, phone=$6, location=$7, hire_date=$8,
        manager=$9, bio=$10, skills=$11, experience=$12, education=$13, emergency_contact=$14,
        profile_photo=COALESCE($15, profile_photo),
        updated_at=NOW()
      WHERE id=$16 RETURNING *`,
      [
        name, role, title, department, email, phone, location, hire_date,
        manager, bio,
        skills || null,
        experience || null,
        education || null,
        emergency_contact || null,
        profile_photo,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};


// DELETE profile
export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query("SELECT * FROM profiles WHERE id = $1", [id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Profile not found" });

    await pool.query("DELETE FROM profiles WHERE id = $1", [id]);
    res.json({ message: "Profile deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
