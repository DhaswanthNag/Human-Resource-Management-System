import express from "express";
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  sendOfferEmail
} from "../controllers/offerletterController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/", getOffers);
router.get("/:id", getOfferById);
router.post("/", createOffer);
router.put("/:id", updateOffer);
router.delete("/:id", deleteOffer);

// Fixed route to send email with attached PDF
router.post("/send-email", upload.single("pdf"), sendOfferEmail);

export default router;
