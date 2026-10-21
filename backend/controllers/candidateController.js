import {
  createCandidateModel,
  getCandidatesModel,
  updateCandidateModel,
  deleteCandidateModel,
} from "../models/candidateModel.js";

// Format candidate response
const formatCandidate = (candidate) => {
  if (!candidate) return candidate;
  const candidateId = candidate.candidate_id ?? candidate.id;
  return {
    ...candidate,
    candidate_code:
      candidate.candidate_code ||
      (candidateId != null
        ? `candidate${String(candidateId).padStart(3, "0")}`
        : null),
  };
};

// Create candidate (Admin only)
export const createCandidate = async (req, res) => {
  try {
    const candidateData = {
      name: req.body.name,
      email: req.body.email,
      jobApplied: req.body.jobApplied ?? req.body.position,
      status: req.body.status,
      assignedTo: req.body.assignedTo,
      interviewDate: req.body.interviewDate || null,
      assignedHrUserId: req.body.assigned_hr_user_id ?? req.body.assignedHrUserId ?? null,
    };

    if (!candidateData.name || !candidateData.email || !candidateData.jobApplied) {
      return res.status(400).json({ error: "Name, email and position are required" });
    }

    const candidate = await createCandidateModel(candidateData);
    return res.status(201).json(formatCandidate(candidate));
  } catch (err) {
    if (err.message === "INVALID_HR_ASSIGNMENT") {
      return res.status(400).json({ error: "Selected HR user does not exist or is not an HR account" });
    }
    console.error("Error creating candidate:", err);
    return res.status(500).json({ error: "Failed to create candidate" });
  }
};

// Get candidates (Admin: all; HR: assigned only)
export const getCandidates = async (req, res) => {
  try {
    const candidates = await getCandidatesModel(req.user.userId, req.user.role);
    return res.json(candidates.map(formatCandidate));
  } catch (err) {
    console.error("Error fetching candidates:", err);
    return res.status(500).json({ error: "Failed to fetch candidates" });
  }
};

// Update candidate (Admin: any; HR: assigned candidates only)
export const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateData = {
      name: req.body.name,
      email: req.body.email,
      jobApplied: req.body.jobApplied ?? req.body.position,
      status: req.body.status,
      assignedTo: req.body.assignedTo,
      interviewDate: req.body.interviewDate || null,
      assignedHrUserId: req.body.assigned_hr_user_id ?? req.body.assignedHrUserId ?? null,
    };

    if (!candidateData.name || !candidateData.email || !candidateData.jobApplied) {
      return res.status(400).json({ error: "Name, email and position are required" });
    }

    const candidate = await updateCandidateModel(
      id, candidateData, req.user.userId, req.user.role
    );

    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found or not assigned to your HR account" });
    }

    return res.json(formatCandidate(candidate));
  } catch (err) {
    if (err.message === "INVALID_HR_ASSIGNMENT") {
      return res.status(400).json({ error: "Selected HR user does not exist or is not an HR account" });
    }
    console.error("Error updating candidate:", err);
    return res.status(500).json({ error: "Failed to update candidate" });
  }
};

// Delete candidate (Admin only)
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await deleteCandidateModel(id);
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }
    return res.json({
      message: "Candidate deleted",
      candidate: formatCandidate(candidate),
    });
  } catch (err) {
    console.error("Error deleting candidate:", err);
    return res.status(500).json({ error: "Failed to delete candidate" });
  }
};
