import express from "express";
import multer from "multer";
import path from "path";
import {
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile
} from "../controllers/profileController.js";

const router = express.Router();

// --------- Multer Setup for Profile Photo Upload ---------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Make sure this folder exists in backend root
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// ------------------ Routes ------------------

// GET all profiles
router.get("/", getProfiles);

// GET single profile by ID
router.get("/:id", getProfileById);

// CREATE profile with optional profile_photo
router.post("/", upload.single("profile_photo"), createProfile);

// UPDATE profile with optional profile_photo
router.put("/:id", upload.single("profile_photo"), updateProfile);

// DELETE profile
router.delete("/:id", deleteProfile);

export default router;