import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaUserCheck,
  FaClock,
  FaEdit,
  FaEnvelope,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import axios from "axios";

const HRCandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    position: "",
    status: "Applied",
    assignedTo: "",
    interviewDate: "",
  });

  const stats = {
    total: candidates.length,
    shortlisted: candidates.filter((c) => c.status === "Screening").length,
    interview: candidates.filter(
      (c) => c.status === "Interview" || c.status === "Interview Scheduled"
    ).length,
    offered: candidates.filter((c) => c.status === "Offered").length,
  };

  const fetchCandidates = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/candidates");
      const mapped = response.data.map((c) => ({
        id: c.candidate_id,
        name: c.name,
        email: c.email,
        position: c.job_applied,
        status: c.status,
        assignedTo: c.assigned_to,
        interviewDate: c.interview_date,
      }));
      setCandidates(mapped);
    } catch (error) {
      console.error("Failed to fetch candidates", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const openModal = (candidate = null) => {
    if (candidate) {
      setFormData({
        id: candidate.id,
        name: candidate.name || "",
        email: candidate.email || "",
        position: candidate.position || "",
        status: candidate.status || "Applied",
        assignedTo: candidate.assignedTo || "",
        interviewDate: candidate.interviewDate || "",
      });
    } else {
      setFormData({
        id: null,
        name: "",
        email: "",
        position: "",
        status: "Applied",
        assignedTo: "",
        interviewDate: "",
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.position) return;

    const payload = {
      name: formData.name,
      email: formData.email,
      position: formData.position,
      status: formData.status,
      assignedTo: formData.assignedTo,
      interviewDate: formData.interviewDate,
    };

    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/candidates/${formData.id}`, payload);
      } else {
        await axios.post("http://localhost:5000/api/candidates", payload);
      }
      await fetchCandidates();
      closeModal();
    } catch (error) {
      console.error("Failed to save candidate", error);
    }
  };

  const handleDelete = async (candidate) => {
    if (!window.confirm("Are you sure you want to delete this candidate?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/candidates/${candidate.id}`);
      await fetchCandidates();
    } catch (error) {
      console.error("Failed to delete candidate", error);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      Applied: "bg-blue-100 text-blue-800",
      Screening: "bg-yellow-100 text-yellow-800",
      Interview: "bg-purple-100 text-purple-800",
      Offered: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full font-semibold text-xs leading-5 ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status || "-"}
      </span>
    );
  };

  const Status = ({ position }) => {
    const styles = {
      "Frontend Developer": "bg-blue-100 text-blue-800",
      "Backend Developer": "bg-yellow-100 text-yellow-800",
      "QA Engineer": "bg-purple-100 text-purple-800",
      "Full Stack Developer": "bg-pink-100 text-pink-800",
      "UI/UX Designer": "bg-green-100 text-green-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full font-semibold text-xs leading-5 ${styles[position] || "bg-gray-100 text-gray-800"}`}>
        {position || "-"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-white to-blue-50">
      <header className="flex items-center justify-center bg-blue-900 border-b px-10 py-6">
        <h1 className="text-2xl font-bold text-white">HR Candidate Management</h1>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => openModal()}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center font-semibold"
          >
            <FaPlus className="mr-2" /> Add Candidate
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Candidate Pipeline</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Interview Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center uppercase font-bold mr-4">
                        {candidate.name?.charAt(0) || "-"}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{candidate.name || "-"}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <FaEnvelope className="inline-block" /> {candidate.email || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Status position={candidate.position} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={candidate.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{candidate.assignedTo || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.interviewDate ? candidate.interviewDate.split("T")[0] : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                      <button
                        onClick={() => openModal(candidate)}
                        className="text-indigo-600 hover:text-indigo-900"
                        aria-label="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(candidate)}
                        className="text-green-600 hover:text-green-900"
                        aria-label="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {modalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">{formData.id ? "Edit Candidate" : "Add Candidate"}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Position</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="Backend Developer">Backend Developer</option>
                    <option value="Full Stack Developer">Full Stack Developer</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Screening">Screening</option>
                    <option value="Interview">Interview</option>
                    <option value="Offered">Offered</option>
                    <option value="Hired">Hired</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Panel</option>
                    <option value="Panel A">Panel A</option>
                    <option value="Panel B">Panel B</option>
                    <option value="Panel C">Panel C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interview Date</label>
                  <input
                    type="date"
                    name="interviewDate"
                    value={formData.interviewDate ? formData.interviewDate.split("T")[0] : ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {formData.id ? "Update" : "Add"} Candidate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HRCandidateManagement;