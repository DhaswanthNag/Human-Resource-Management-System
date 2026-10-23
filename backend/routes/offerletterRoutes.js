import express from "express";
import {
  getOffers,
  getOfferById,
  getNextOfferId,
  createOffer,
  updateOffer,
  deleteOffer,
  sendOfferEmail
} from "../controllers/offerletterController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

router.get("/", getOffers);
router.get("/next-id", getNextOfferId);
router.post("/send-email", upload.single("pdf"), sendOfferEmail);
router.get("/:id", getOfferById);
router.post("/", upload.single("pdf"), createOffer);
router.put("/:id", upload.single("pdf"), updateOffer);
router.delete("/:id", deleteOffer);

export default router;
