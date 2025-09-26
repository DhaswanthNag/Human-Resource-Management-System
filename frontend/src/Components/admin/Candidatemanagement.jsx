import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    email: "",
    position: "",
    status: "Applied",
    interviewDate: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:5000/api/candidates");
      const mapped = response.data.map((c) => ({
        id: c.candidate_id,
        name: c.name,
        email: c.email,
        position: c.job_applied,
        status: c.status,
        interviewDate: c.interview_date,
      }));
      setCandidates(mapped);
    } catch (err) {
      setError("Failed to load candidates.");
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const apiPayload = {
        name: formData.name,
        email: formData.email,
        jobApplied: formData.position,
        status: formData.status,
        interviewDate: formData.interviewDate,
      };

      if (formData.id) {
        const response = await axios.put(
          `http://localhost:5000/api/candidates/${formData.id}`,
          apiPayload
        );
        setCandidates(
          candidates.map((c) =>
            c.id === formData.id
              ? {
                  id: response.data.candidate_id,
                  name: response.data.name,
                  email: response.data.email,
                  position: response.data.job_applied,
                  status: response.data.status,
                  interviewDate: response.data.interview_date,
                }
              : c
          )
        );
      } else {
        const response = await axios.post(
          "http://localhost:5000/api/candidates",
          apiPayload
        );
        const newCandidate = {
          id: response.data.candidate_id,
          name: response.data.name,
          email: response.data.email,
          position: response.data.job_applied,
          status: response.data.status,
          interviewDate: response.data.interview_date,
        };
        setCandidates([...candidates, newCandidate]);
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError("Failed to save candidate.");
    }
    setLoading(false);
  };

  const handleEdit = (candidate) => {
    setFormData(candidate);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setError(null);
    setLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/candidates/${id}`);
      setCandidates(candidates.filter((c) => c.id !== id));
    } catch (err) {
      setError("Failed to delete candidate.");
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      email: "",
      position: "",
      status: "Applied",
      interviewDate: "",
    });
  };

  const filteredCandidates = candidates.filter(
    (candidate) =>
      candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gradient-to-br from-blue-400 via-white to-blue-50 min-h-screen">
      <header className="flex items-center justify-center bg-blue-900 border-b px-2 md:px-10 py-6">
        <div className="text-center w-full">
          <h1 className="text-xl md:text-2xl font-bold text-white">Candidate Management</h1>
        </div>
      </header>

      <div className="p-2 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 md:mb-6 gap-2">
          <h3 className="text-base md:text-lg font-medium text-gray-700">Candidate Management</h3>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 flex items-center text-sm md:text-base"
          >
            <FaPlus className="mr-2" />
            Add Candidate
          </button>
        </div>

        {error && <p className="text-red-600 mb-2 md:mb-4">{error}</p>}
        {loading && <p className="mb-2 md:mb-4">Loading...</p>}

        <input
          type="text"
          placeholder="Search candidates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3 md:mb-4 w-full max-w-md border rounded p-2"
        />

        {/* Responsive Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {/* For mobile: show card list. For md and up: show table */}
          <div className="block md:hidden">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-4 border-b last:border-b-0 flex flex-col gap-2"
                >
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Name:</span>
                    <span>{candidate.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Email:</span>
                    <span>{candidate.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Position:</span>
                    <span>{candidate.position || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Status:</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        candidate.status === "Applied"
                          ? "bg-blue-100 text-blue-800"
                          : candidate.status === "Screening"
                          ? "bg-yellow-100 text-yellow-800"
                          : candidate.status === "Interview"
                          ? "bg-purple-100 text-purple-800"
                          : candidate.status === "Offered"
                          ? "bg-green-100 text-green-800"
                          : candidate.status === "Hired"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {candidate.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">Interview Date:</span>
                    <span>{candidate.interviewDate || "-"}</span>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleEdit(candidate)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit candidate"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(candidate.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete candidate"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No candidates found.</div>
            )}
          </div>
          {/* Table for md+ screens */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left font-medium text-gray-500 uppercase">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Interview Date</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{candidate.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{candidate.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{candidate.position || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            candidate.status === "Applied"
                              ? "bg-blue-100 text-blue-800"
                              : candidate.status === "Screening"
                              ? "bg-yellow-100 text-yellow-800"
                              : candidate.status === "Interview"
                              ? "bg-purple-100 text-purple-800"
                              : candidate.status === "Offered"
                              ? "bg-green-100 text-green-800"
                              : candidate.status === "Hired"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-600">{candidate.interviewDate || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(candidate)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit candidate"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(candidate.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete candidate"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No candidates found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Responsive Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white w-full max-w-lg mx-2 md:mx-0 rounded-lg shadow-lg p-4 md:p-6">
              <h2 className="text-base md:text-xl font-bold mb-2 md:mb-4">
                {formData.id ? "Edit Candidate" : "Add Candidate"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-2 md:space-y-4">
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
                  <input
                    type="text"
                    name="position"
                    placeholder="Position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    name="interviewDate"
                    value={formData.interviewDate}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-2 md:space-x-3 pt-2 md:pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm md:text-base"
                  >
                    {formData.id ? "Update" : "Add"} Candidate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateManagement;
