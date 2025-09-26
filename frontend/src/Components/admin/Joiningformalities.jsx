import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Calendar, User, File } from "lucide-react";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const AdminUI = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeIndex, setSelectedEmployeeIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Fetch employees with documents, latest first
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees/with-docs`);
      const sorted = (res.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setEmployees(sorted);
      setError(null);
    } catch (err) {
      setError("❌ Failed to fetch employees. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const close = () => {
    setSelectedEmployeeIndex(null);
    setPreviewUrl(null);
    setError(null);
    setLoadingAction(null);
  };

  const selectedEmployee =
    selectedEmployeeIndex !== null ? employees[selectedEmployeeIndex] : null;

  const updateDecision = async (index, decision) => {
    const employee = employees[index];
    const decisionLower = decision.toLowerCase();
    try {
      setLoadingAction(decisionLower);
      await axios.put(
        `${API_BASE_URL}/api/employees/${employee.emp_id}/decision`,
        { decision: decisionLower }
      );
      setEmployees((prev) =>
        prev.map((emp, i) =>
          i === index ? { ...emp, decision: decisionLower } : emp
        )
      );
      close();
    } catch {
      setError(`❌ Failed to ${decisionLower}. Please try again.`);
    } finally {
      setLoadingAction(null);
    }
  };

  const verifyDocument = async (empIndex, docId, status) => {
    try {
      setLoadingAction(docId);
      await axios.put(`${API_BASE_URL}/api/documents/status/${docId}`, {
        status: status.toLowerCase(),
      });
      setEmployees((prev) =>
        prev.map((emp, i) => {
          if (i === empIndex) {
            return {
              ...emp,
              documents: emp.documents.map((d) =>
                d.id === docId ? { ...d, decision: status.toLowerCase() } : d
              ),
            };
          }
          return emp;
        })
      );
    } catch {
      setError("Failed to verify document.");
      alert("Failed to verify document.");
    } finally {
      setLoadingAction(null);
    }
  };

  const deleteEmployee = async (index) => {
    const employee = employees[index];
    if (!window.confirm(`Are you sure you want to delete ${employee.name}?`))
      return;

    try {
      setLoadingAction("delete-employee");
      await axios.delete(`${API_BASE_URL}/api/employees/${employee.emp_id}`);
      setEmployees((prev) => prev.filter((_, i) => i !== index));
      close();
    } catch {
      setError("❌ Failed to delete employee. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const deleteDocument = async (empIndex, docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      setLoadingAction(`delete-doc-${docId}`);
      await axios.delete(`${API_BASE_URL}/api/documents/${docId}`);
      setEmployees((prev) =>
        prev.map((emp, i) => {
          if (i === empIndex) {
            return {
              ...emp,
              documents: emp.documents.filter((d) => d.id !== docId),
            };
          }
          return emp;
        })
      );
    } catch {
      setError("❌ Failed to delete document.");
      alert("Failed to delete document.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePreview = async (docId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees/raw/${docId}`, {
        responseType: "blob",
      });
      const file = new Blob([res.data], { type: res.headers["content-type"] });
      setPreviewUrl(URL.createObjectURL(file));
    } catch {
      alert("Failed to load document.");
    }
  };

  const allVerified = (emp) =>
    emp.documents && emp.documents.every((d) => d.decision === "verified");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-50">
      <header className="bg-blue-900 py-6 px-8 mb-8 shadow-lg">
        <h1 className="text-white text-4xl font-bold text-center tracking-wide">
          Approval Panel
        </h1>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-red-600 mb-6 font-semibold"
          >
            {error}
          </motion.div>
        )}

        {loading ? (
          <p className="text-center text-lg text-gray-700">Loading...</p>
        ) : employees.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-20 text-gray-700"
          >
            <File size={64} className="mx-auto mb-4 text-blue-400" />
            <p>No employees found.</p>
          </motion.div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1">
            <AnimatePresence>
              {employees.map((emp, idx) => {
                const verifiedCount = emp.documents.filter(d => d.decision === "verified").length;
                const totalCount = emp.documents.length;
                const progressPercent = totalCount === 0 ? 0 : Math.round((verifiedCount / totalCount) * 100);

                return (
                  <motion.div
                    layout
                    key={emp.emp_id}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={cardVariants}
                    className="bg-white rounded-lg shadow-md p-6 flex flex-col hover:shadow-xl transition"
                  >
                    <div className="flex items-center mb-6 gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold">{emp.name || "Unknown"}</h2>
                        <p className="text-sm text-gray-500">ID: {emp.emp_id}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar size={16} /> 
                          <span>{emp.created_at ? new Date(emp.created_at).toLocaleDateString() : "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 relative w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${progressPercent}%` }}
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-700 ${
                          progressPercent === 100 ? "bg-green-500" : "bg-blue-600"
                        }`}
                      />
                    </div>

                    <p className="text-sm text-gray-600 mb-6">
                      {totalCount} Document{totalCount !== 1 ? "s" : ""}, {progressPercent === 100 ? "All Verified" : "Verification Pending"}
                    </p>

                    <button
                      onClick={() => setSelectedEmployeeIndex(idx)}
                      className="mt-auto bg-blue-500 hover:bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-2 font-semibold transition"
                    >
                      <Eye size={18} /> View Documents
                    </button>

                    <button
                      onClick={() => deleteEmployee(idx)}
                      disabled={loadingAction === "delete-employee"}
                      className="mt-2 bg-red-500 hover:bg-red-700 text-white py-1 rounded text-sm w-full disabled:opacity-50"
                    >
                      {loadingAction === "delete-employee" ? "Deleting..." : "Delete Employee"}
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {selectedEmployee && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black bg-opacity-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                layout
                className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
              >
                <header className="flex justify-between items-center p-6 border-b border-gray-300">
                  <h2 className="text-xl font-semibold">
                    Verification - {selectedEmployee.name}
                  </h2>
                  <button
                    onClick={close}
                    className="text-gray-600 hover:text-gray-800 p-2 rounded"
                  >
                    <X size={24} />
                  </button>
                </header>
                <main className="p-6 space-y-6 flex-grow">
                  {selectedEmployee.documents.length === 0 ? (
                    <div className="text-center text-gray-600 py-10">
                      <File size={64} className="mx-auto mb-4 text-blue-400" />
                      <p>No documents uploaded.</p>
                    </div>
                  ) : (
                    selectedEmployee.documents.map((doc, idx) => {
                      const verified = doc.decision === "verified";
                      return (
                        <div
                          key={doc.id}
                          className="flex justify-between items-center border rounded p-4"
                        >
                          <div>
                            {doc.file_name ? (
                              <button
                                onClick={() => handlePreview(doc.id)}
                                className="text-blue-600 underline"
                              >
                                {doc.file_name}
                              </button>
                            ) : (
                              <span>No file uploaded</span>
                            )}
                            <p className="text-sm mt-1">
                              Status:{" "}
                              <span
                                className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                  verified ? "bg-green-200 text-green-800" : "bg-yellow-200 text-yellow-800"
                                }`}
                              >
                                {verified ? "Verified" : doc.decision || "Pending"}
                              </span>
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {!verified && (
                              <>
                                <button
                                  onClick={() => verifyDocument(selectedEmployeeIndex, doc.id, "verified")}
                                  disabled={loadingAction === doc.id}
                                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  {loadingAction === doc.id ? "Verifying..." : "Verify"}
                                </button>
                                <button
                                  onClick={() => alert("Reject not implemented")}
                                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteDocument(selectedEmployeeIndex, doc.id)}
                              disabled={loadingAction === `delete-doc-${doc.id}`}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              {loadingAction === `delete-doc-${doc.id}` ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {previewUrl && (
                    <iframe
                      src={previewUrl}
                      title="Document Preview"
                      className="w-full h-96 border rounded"
                    />
                  )}
                </main>
                <footer className="p-6 border-t border-gray-300 flex justify-end">
                  <button
                    onClick={close}
                    className="px-6 py-2 rounded border hover:bg-gray-100"
                  >
                    Close
                  </button>
                </footer>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminUI;
