import {
  createCandidateModel,
  getCandidatesModel,
  updateCandidateModel,
  deleteCandidateModel,
} from "../models/candidateModel.js";

// Create candidate
export const createCandidate = async (req, res) => {
  try {
    const candidateData = {
      name: req.body.name,
      email: req.body.email,
      jobApplied: req.body.jobApplied, // map position to jobApplied
      status: req.body.status,
      assignedTo: req.body.assignedTo,
      interviewDate: req.body.interviewDate,
    };
    const candidate = await createCandidateModel(candidateData);
    res.status(201).json(candidate);
  } catch (err) {
    console.error("Error creating candidate:", err);
    res.status(500).json({ error: "Failed to create candidate" });
  }
};

// Get all candidates
export const getCandidates = async (req, res) => {
  try {
    const candidates = await getCandidatesModel();
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
};

// Update candidate
export const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidateData = {
      name: req.body.name,
      email: req.body.email,
      jobApplied: req.body.position, // map position to jobApplied
      status: req.body.status,
      assignedTo: req.body.assignedTo,
      interviewDate: req.body.interviewDate,
    };
    const candidate = await updateCandidateModel(id, candidateData);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: "Failed to update candidate" });
  }
};

// Delete candidate
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await deleteCandidateModel(id);
    if (!candidate) return res.status(404).json({ error: "Candidate not found" });
    res.json({ message: "Candidate deleted", candidate });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete candidate" });
  }
};