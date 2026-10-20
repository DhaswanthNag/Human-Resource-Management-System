//frontend/src/Components/hr/Joiningformalities.jsx
import React, { useState, useEffect } from "react";
import {
  User,
  Calendar,
  //   CheckCircle,
  X,
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Clock,
  AlertCircle,
  Search,
  Download,
  ClipboardCheck,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_URL || "http://localhost:5000";

const HRJoiningModalities = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  // const [loadingDocIndex, setLoadingDocIndex] = useState(null);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [previewContentType, setPreviewContentType] = useState("");
  const [updatingDocId, setUpdatingDocId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/api/employees/with-docs`);
      const sortedEmployees = (res.data || []).map((emp) => ({
        ...emp,
        documents: (emp.documents || []).map((doc) => ({
          ...doc,
          decision: String(doc.decision || doc.status || "pending").toLowerCase(),
        })),
      })).sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
          setPreviewName("");
          setPreviewContentType("");
        } else if (selectedIndex !== null) {
          setSelectedIndex(null);
          setActionError(null);
          setActionMessage(null);
        }
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewUrl, selectedIndex]);

  const calculateProgress = (docs = []) => {
    const completed = docs.filter(
      (d) => String(d.decision || d.status || "").toLowerCase() === "verified"
    ).length;
    const total = docs.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { percentage, completed, total };
  };

  const handlePreview = async (docId, fileName = "Joining Document") => {
    try {
      setActionError(null);
      setActionMessage(null);
      const res = await axios.get(
        `${API_BASE_URL}/api/employees/raw/${docId}`,
        { responseType: "blob" }
      );

      const file = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      const newPreviewUrl = URL.createObjectURL(file);

      setPreviewUrl((previousUrl) => {
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        return newPreviewUrl;
      });

      setPreviewName(fileName);
      setPreviewContentType(
        res.headers["content-type"] || file.type || "application/octet-stream"
      );
    } catch (err) {
      console.error("Error previewing document:", err);
      setActionError("Failed to load document. Please try again.");
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewName("");
    setPreviewContentType("");
  };

  const handleDocumentStatus = async (docId, status) => {
    try {
      setUpdatingDocId(docId);
      setActionError(null);
      setActionMessage(null);

      await axios.put(
        `${API_BASE_URL}/api/employees/status/${docId}`,
        { status }
      );

      setEmployees((previousEmployees) =>
        previousEmployees.map((emp) => ({
          ...emp,
          documents: (emp.documents || []).map((doc) =>
            String(doc.id) === String(docId)
              ? { ...doc, decision: status, status }
              : doc
          ),
        }))
      );

      setActionMessage(
        status === "verified"
          ? "Document verified successfully."
          : "Document rejected. The employee can review its status."
      );

      // Refresh data from the backend to keep the panel synchronized with PostgreSQL.
      await fetchEmployees();
    } catch (err) {
      console.error("Error updating document status:", err);
      setActionError(
        err.response?.data?.error ||
          "Unable to update document status. Please try again."
      );
    } finally {
      setUpdatingDocId(null);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      (emp.name && emp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.emp_id && emp.emp_id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.joiningDate && emp.joiningDate.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedEmployee =
    selectedIndex !== null ? employees[selectedIndex] : null;

  const getStatusStyle = (status) => {
    switch (String(status || "pending").toLowerCase()) {
      case "verified":
        return "bg-green-50 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      case "submitted":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const totalEmployees = employees.length;
  const verifiedEmployees = employees.filter(
    (emp) =>
      emp.documents?.length > 0 &&
      emp.documents.every(
        (doc) => String(doc.decision || doc.status || "").toLowerCase() === "verified"
      )
  ).length;
  const pendingDocuments = employees.reduce(
    (count, emp) =>
      count +
      (emp.documents || []).filter((doc) => {
        const status = String(doc.decision || doc.status || "pending").toLowerCase();
        return status !== "verified" && status !== "rejected";
      }).length,
    0
  );
  const rejectedDocuments = employees.reduce(
    (count, emp) =>
      count +
      (emp.documents || []).filter(
        (doc) => String(doc.decision || doc.status || "").toLowerCase() === "rejected"
      ).length,
    0
  );

  return (
    // Changed padding to be responsive
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <header className="mb-8 mt-2">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1 w-9 rounded-full bg-yellow-400"></span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                EMPLOYEE DOCUMENT VERIFICATION
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Document Verification Panel
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Review employee joining documents and update verification status.
            </p>
          </div>
          <button
            onClick={fetchEmployees}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-yellow-300 hover:bg-yellow-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="shrink-0" />
          {error}
          <button
            onClick={fetchEmployees}
            className="ml-auto font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Overview cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Employees</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{totalEmployees}</h2>
              <p className="mt-1 text-xs text-gray-500">Employees in the panel</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-gray-700">
              <User size={21} />
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-full rounded-full bg-gray-700"></div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Fully Verified</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{verifiedEmployees}</h2>
              <p className="mt-1 text-xs text-gray-500">All documents approved</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-yellow-500">
              <ShieldCheck size={21} />
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-yellow-400 transition-all"
              style={{
                width: `${totalEmployees ? (verifiedEmployees / totalEmployees) * 100 : 0}%`,
              }}
            ></div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Awaiting Review</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{pendingDocuments}</h2>
              <p className="mt-1 text-xs text-gray-500">Documents pending a decision</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-gray-700">
              <Clock size={21} />
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-full rounded-full bg-gray-300"></div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Rejected Documents</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">{rejectedDocuments}</h2>
              <p className="mt-1 text-xs text-gray-500">Require employee attention</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-red-500">
              <XCircle size={21} />
            </div>
          </div>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-full rounded-full bg-gray-500"></div>
          </div>
        </div>
      </div>

      {/* Employee list */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-yellow-100 p-2 text-yellow-800">
                <ClipboardCheck size={19} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Employee Joining Formalities</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Select an employee to review their submitted documents.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, ID or date..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-100"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <RefreshCw size={28} className="mb-4 animate-spin text-yellow-500" />
            <p className="text-sm font-medium">Loading employees...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="px-6 py-20 text-center text-gray-500">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <FileText size={25} className="text-gray-500" />
            </div>
            <p className="font-semibold text-gray-800">No employees found</p>
            <p className="mt-1 text-sm">Try another search or refresh the employee list.</p>
          </div>
        ) : (
          // Added a max-width container and auto margins to center the content
          <div className="max-w-8xl mx-auto">
            {/* Modified grid columns for responsiveness. It will be 1 col on mobile, 2 on tablets, and 3 on desktops. */}
            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              {filteredEmployees.map((emp) => {
                const { percentage, completed, total } = calculateProgress(emp.documents);
                const rejected = (emp.documents || []).filter(
                  (doc) => String(doc.decision || "").toLowerCase() === "rejected"
                ).length;

                return (
                  <div
                    key={emp.emp_id}
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-lg"
                  >
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition group-hover:bg-yellow-100">
                        <User size={23} className="text-gray-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate font-bold text-gray-900">
                          {emp.name || "Unknown"}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">ID: {emp.emp_id}</p>
                      </div>
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          percentage === 100
                            ? "bg-green-500"
                            : rejected > 0
                            ? "bg-red-500"
                            : "bg-yellow-400"
                        }`}
                        title={
                          percentage === 100
                            ? "All documents verified"
                            : rejected > 0
                            ? "Rejected documents"
                            : "Review pending"
                        }
                      ></span>
                    </div>

                    <p className="mb-5 flex items-center text-sm text-gray-500">
                      <Calendar size={16} className="mr-2 shrink-0 text-gray-400" />
                      <span>Joining Date: {emp.joiningDate || "Not Specified"}</span>
                    </p>

                    <div className="mb-5 rounded-xl bg-gray-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700">
                          Verification progress
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          {percentage}%
                        </span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`absolute left-0 top-0 h-2.5 rounded-full transition-all duration-500 ${
                            percentage === 100 ? "bg-yellow-400" : "bg-gray-700"
                          }`}
                        />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>{completed}/{total} verified</span>
                        {rejected > 0 && (
                          <span className="font-semibold text-red-600">{rejected} rejected</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-5 flex items-center gap-2 text-sm text-gray-600">
                      <ShieldCheck size={17} className="shrink-0 text-gray-500" />
                      <span>
                        {total === 0
                          ? "Awaiting document uploads"
                          : completed === total
                          ? "All documents verified"
                          : `${total - completed} document(s) need review`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedIndex(employees.findIndex(
                          (item) => String(item.emp_id) === String(emp.emp_id)
                        ));
                        setActionError(null);
                        setActionMessage(null);
                      }}
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                    >
                      <Eye size={17} />
                      View Documents
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Modal */}
      {selectedEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedIndex(null);
              setActionError(null);
              setActionMessage(null);
            }
          }}
        >
          {/* Adjusted modal width to be responsive */}
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl md:max-w-2xl lg:max-w-4xl">
            <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 p-5 sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800 sm:flex">
                  <ShieldCheck size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                    Verify Documents - {selectedEmployee.name || selectedEmployee.emp_id}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Employee ID: {selectedEmployee.emp_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedIndex(null);
                  setActionError(null);
                  setActionMessage(null);
                }}
                className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
                aria-label="Close verification modal"
              >
                <X size={22} />
              </button>
            </header>

            <main className="flex-grow overflow-y-auto p-4 sm:p-6">
              {actionError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={18} className="shrink-0" />
                  {actionError}
                </div>
              )}

              {actionMessage && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <CheckCircle size={18} className="shrink-0" />
                  {actionMessage}
                </div>
              )}

              {selectedEmployee.documents.length ? (
                selectedEmployee.documents.map((doc) => {
                  const status = String(doc.decision || doc.status || "pending").toLowerCase();
                  const isUpdating = String(updatingDocId) === String(doc.id);

                  return (
                    // On small screens, items will stack vertically, otherwise they are in a row.
                    <div
                      key={doc.id}
                      className="mb-4 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-yellow-300 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                            <FileText size={19} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900">
                              {doc.document_name || doc.name || "Joining Document"}
                            </p>
                            {doc.description && (
                              <p className="mt-1 text-sm leading-5 text-gray-500">
                                {doc.description}
                              </p>
                            )}
                            {doc.file_name ? (
                              <button
                                onClick={() => handlePreview(doc.id, doc.file_name)}
                                className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:border-yellow-300 hover:bg-yellow-50"
                              >
                                <Eye size={16} className="shrink-0 text-gray-500" />
                                <span className="break-all">{doc.file_name}</span>
                              </button>
                            ) : (
                              <p className="mt-2 text-sm text-gray-400">No file uploaded</p>
                            )}
                          </div>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${getStatusStyle(status)}`}
                        >
                          {status === "verified" ? (
                            <CheckCircle size={14} />
                          ) : status === "rejected" ? (
                            <XCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                        <button
                          onClick={() => handleDocumentStatus(doc.id, "verified")}
                          disabled={isUpdating || status === "verified"}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle size={16} />
                          {isUpdating ? "Updating..." : "Verify"}
                        </button>

                        <button
                          onClick={() => handleDocumentStatus(doc.id, "rejected")}
                          disabled={isUpdating || status === "rejected"}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          {isUpdating ? "Updating..." : "Reject"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="font-semibold text-gray-800">No documents uploaded</p>
                  <p className="mt-1 text-sm">Documents will appear here once the employee submits them.</p>
                </div>
              )}
            </main>

            <footer className="flex justify-end border-t border-gray-200 bg-gray-50 p-4 sm:p-5">
              <button
                onClick={() => {
                  setSelectedIndex(null);
                  setActionError(null);
                  setActionMessage(null);
                }}
                className="rounded-xl border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Document Preview Popup */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/80 p-2 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePreview();
          }}
        >
          <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-900 px-4 py-3 text-white sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden rounded-lg bg-yellow-400 p-2 text-gray-900 sm:block">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold sm:text-base">
                    Document Preview
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-gray-300">
                    {previewName}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={previewUrl}
                  download={previewName || "document"}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-gray-900 transition hover:bg-yellow-300 sm:text-sm"
                >
                  <Download size={15} />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={closePreview}
                  className="rounded-lg p-2 text-gray-300 transition hover:bg-gray-700 hover:text-white"
                  aria-label="Close document preview"
                >
                  <X size={21} />
                </button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-100 p-2 sm:p-4">
              {previewContentType.startsWith("image/") ||
              previewContentType === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  title={`Preview of ${previewName}`}
                  className="h-full w-full rounded-lg border border-gray-200 bg-white"
                />
              ) : (
                <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800">
                    <FileText size={27} />
                  </div>
                  <h3 className="font-bold text-gray-900">
                    Preview unavailable
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    This file type may not be supported by the browser preview. Download the document to view it.
                  </p>
                  <a
                    href={previewUrl}
                    download={previewName || "document"}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                  >
                    <Download size={16} />
                    Download Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRJoiningModalities;
