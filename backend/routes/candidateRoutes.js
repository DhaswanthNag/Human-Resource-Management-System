import express from "express";
import {
  createCandidate,
  getCandidates,
  updateCandidate,
  deleteCandidate,
} from "../controllers/candidateController.js";
import {
  authenticateToken,
  authorizeRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// All candidate routes require a valid JWT
router.use(authenticateToken);

// Admin can create candidates
router.post("/", authorizeRoles("admin"), createCandidate);

// Admin and HR can view candidates (results are scoped in the model)
router.get("/", authorizeRoles("admin", "hr"), getCandidates);

// Admin can update any candidate; HR can update assigned candidates only
router.put("/:id", authorizeRoles("admin", "hr"), updateCandidate);

// Only Admin can delete candidates
router.delete("/:id", authorizeRoles("admin"), deleteCandidate);

export default router;
