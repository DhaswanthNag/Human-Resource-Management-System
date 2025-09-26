import axios from "axios";

const API_URL = "http://localhost:5000/api/meetings"; // Update if your backend URL is different

// Fetch all meetings
export const getMeetings = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

// Fetch single meeting
export const getMeetingById = async (id) => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

// Create new meeting
export const createMeeting = async (meeting) => {
  const res = await axios.post(API_URL, meeting);
  return res.data;
};

// Update meeting
export const updateMeeting = async (id, meeting) => {
  const res = await axios.put(`${API_URL}/${id}`, meeting);
  return res.data;
};

// Delete meeting
export const deleteMeeting = async (id) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
