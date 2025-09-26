import React, { useState, useEffect } from "react";
import {
  User,
  Calendar,
//   CheckCircle,
  X,
  FileText,
  Eye,
} from "lucide-react";
import axios from "axios";


const API_BASE_URL =
  process.env.REACT_APP_URL || "http://localhost:5000";

const HRJoiningModalities = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDocIndex, setLoadingDocIndex] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/employees/with-docs`);
      const sortedEmployees = (res.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setEmployees(sortedEmployees);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Unable to fetch employees. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const calculateProgress = (docs = []) => {
    const completed = docs.filter(
      (d) => d.decision?.toLowerCase() === "verified"
    ).length;
    const total = docs.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { percentage, completed, total };
  };

  const handleVerify = async (empIndex, docIndex) => {
    const doc = employees[empIndex].documents[docIndex];
    try {
      setLoadingDocIndex(docIndex);
      setError(null);
      await axios.put(`${API_BASE_URL}/api/documents/status/${doc.id}`, {
        decision: "verified",
      });
      await fetchEmployees();
    } catch (err) {
      console.error("Error verifying documents:", err);
      setError("Failed to verify document. Please try again.");
    } finally {
      setLoadingDocIndex(null);
    }
  };

  const handlePreview = async (docId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees/raw/${docId}`, { responseType: "blob" });
      const file = new Blob([res.data], { type: res.headers["content-type"] });
      setPreviewUrl(URL.createObjectURL(file));
    } catch {
      alert("Failed to load document.");
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      (emp.name && emp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.emp_id && emp.emp_id.toString().includes(searchTerm)) ||
      (emp.joiningDate && emp.joiningDate.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-white to-blue-50 p-4">
      <header className="bg-blue-800 p-6 rounded-lg mb-8 shadow-lg flex justify-between items-center">
        <h1 className="text-white text-3xl font-bold">HR Document Verification</h1>
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 p-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </header>

      {error && <p className="text-center text-red-600 mb-4">{error}</p>}

      {loading ? (
        <p className="text-center text-lg">Loading employees...</p>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center text-gray-700 mt-20">
          <FileText size={24} className="mx-auto mb-4" />
          <p>No employees found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols- lg:grid-cols-1 gap-9 ml-96 mr-96">
          {filteredEmployees.map((emp, empIndex) => {
            const { percentage, completed, total } = calculateProgress(emp.documents);
            return (
              <div key={emp.emp_id} className="bg-white shadow-md rounded-lg p-6 flex flex-col">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <User size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{emp.name || "Unknown"}</h2>
                    <p className="text-sm text-gray-500">ID: {emp.emp_id}</p>
                  </div>
                </div>

                <p className="flex items-center mb-4 text-gray-600 text-sm">
                  <Calendar size={16} className="mr-2" />
                  <span>Joining Date: {emp.joiningDate || "Not Specified"}</span>
                </p>

                <div className="mb-4">
                  <div className="relative bg-gray-200 rounded-full h-2 w-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`absolute left-0 top-0 h-2 rounded-full transition-all duration-500 ${
                        percentage === 100 ? "bg-green-500" : "bg-blue-600"
                      }`}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Verification progress: {percentage}% ({completed}/{total})
                  </p>
                </div>

                <button
                  onClick={() => setSelectedIndex(empIndex)}
                  className="mt-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition inline-flex items-center justify-center"
                >
                  <Eye size={18} className="mr-2" /> View Documents
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl max-h-[90vh] w-full max-w-4xl flex flex-col">
            <header className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">
                Verify Documents - {employees[selectedIndex].name}
              </h2>
              <button onClick={() => setSelectedIndex(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </header>

            <main className="overflow-y-auto p-6 flex-grow">
              {employees[selectedIndex].documents.length ? (
                employees[selectedIndex].documents.map((doc, idx) => (
                  <div key={doc.id} className="border p-4 mb-4 rounded flex justify-between items-center">
                    <div>
                      {doc.file_name ? (
                        <button
                          onClick={() => handlePreview(doc.id)}
                          className="text-blue-600 underline"
                        >
                          {doc.file_name}
                        </button>
                      ) : (
                        <p className="text-gray-500">No file uploaded</p>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        Status:{" "}
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            doc.decision === "verified"
                              ? "bg-green-200 text-green-800"
                              : doc.decision === "pending"
                              ? "bg-yellow-200 text-yellow-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {doc.decision || "Pending"}
                        </span>
                      </p>
                    </div>
                    {doc.decision !== "verified" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerify(selectedIndex, idx)}
                          disabled={loadingDocIndex === idx}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {loadingDocIndex === idx ? "Verifying..." : "Verify"}
                        </button>
                        <button
                          onClick={() => alert("Reject functionality not implemented")}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-700">
                  <FileText size={64} className="mx-auto mb-4" />
                  <p>No documents uploaded.</p>
                </div>
              )}

              {previewUrl && (
                <iframe
                  src={previewUrl}
                  title="Document Preview"
                  className="w-full h-96 border rounded-md"
                />
              )}
            </main>

            <footer className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedIndex(null)}
                className="px-6 py-2 border rounded hover:bg-gray-100"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRJoiningModalities;
