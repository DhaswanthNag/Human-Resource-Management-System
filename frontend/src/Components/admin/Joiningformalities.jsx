import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Eye,
  Calendar,
  User,
  File,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Download,
  FileText,
} from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");
  const [previewContentType, setPreviewContentType] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const previewUrlRef = useRef(null);

  // Fetch employees with documents, latest first
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees/with-docs`);
      const sorted = (res.data || [])
        .map((emp) => ({
          ...emp,
          documents: (emp.documents || []).map((doc) => {
            const status = String(
              doc.decision || doc.status || "pending"
            ).toLowerCase();

            return {
              ...doc,
              decision: status,
              status,
            };
          }),
        }))
        .sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
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

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const closePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setPreviewName("");
    setPreviewContentType("");
    setPreviewLoading(false);
  };

  const close = () => {
    setSelectedEmployeeIndex(null);
    closePreview();
    setError(null);
    setActionMessage("");
    setLoadingAction(null);
  };

  const selectedEmployee =
    selectedEmployeeIndex !== null
      ? employees[selectedEmployeeIndex] || null
      : null;

  const filteredEmployees = employees.filter((emp) => {
    const search = searchTerm.toLowerCase().trim();
    return (
      !search ||
      String(emp.name || "").toLowerCase().includes(search) ||
      String(emp.emp_id || "").toLowerCase().includes(search)
    );
  });

  const getEmployeeProgress = (emp) => {
    const documents = emp.documents || [];
    const verifiedCount = documents.filter(
      (doc) => String(doc.decision || doc.status || "").toLowerCase() === "verified"
    ).length;
    const totalCount = documents.length;
    const progressPercent =
      totalCount === 0 ? 0 : Math.round((verifiedCount / totalCount) * 100);

    return { verifiedCount, totalCount, progressPercent };
  };

  const getEmployeeStatus = (emp) => {
    const decision = String(emp.decision || "").toLowerCase();
    const { verifiedCount, totalCount, progressPercent } =
      getEmployeeProgress(emp);

    if (decision === "approved") {
      return {
        label: "Approved",
        className: "bg-green-50 text-green-700 border-green-200",
        icon: CheckCircle,
      };
    }

    if (decision === "rejected") {
      return {
        label: "Rejected",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle,
      };
    }

    if (totalCount > 0 && progressPercent === 100) {
      return {
        label: "Documents Verified",
        className: "bg-green-50 text-green-700 border-green-200",
        icon: ShieldCheck,
      };
    }

    if (verifiedCount > 0) {
      return {
        label: "In Review",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: Clock,
      };
    }

    return {
      label: "Pending",
      className: "bg-gray-100 text-gray-600 border-gray-200",
      icon: AlertCircle,
    };
  };

  // const updateDecision = async (index, decision) => {
  //   const employee = employees[index];
  //   const decisionLower = decision.toLowerCase();
  //   try {
  //     setLoadingAction(decisionLower);
  //     await axios.put(
  //       `${API_BASE_URL}/api/employees/${employee.emp_id}/decision`,
  //       { decision: decisionLower }
  //     );
  //     setEmployees((prev) =>
  //       prev.map((emp, i) =>
  //         i === index ? { ...emp, decision: decisionLower } : emp
  //       )
  //     );
  //     close();
  //   } catch {
  //     setError(`❌ Failed to ${decisionLower}. Please try again.`);
  //   } finally {
  //     setLoadingAction(null);
  //   }
  // };

  const verifyDocument = async (empIndex, docId, status) => {
    try {
      setLoadingAction(docId);
      setError(null);
      setActionMessage("");

      await axios.put(`${API_BASE_URL}/api/employees/status/${docId}`, {
        status: status.toLowerCase(),
      });

      setEmployees((prev) =>
        prev.map((emp, i) => {
          if (i === empIndex) {
            return {
              ...emp,
              documents: (emp.documents || []).map((d) =>
                String(d.id) === String(docId)
                  ? {
                      ...d,
                      decision: status.toLowerCase(),
                      status: status.toLowerCase(),
                    }
                  : d
              ),
            };
          }
          return emp;
        })
      );

      setActionMessage(
        status.toLowerCase() === "verified"
          ? "Document verified successfully."
          : "Document status updated successfully."
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
    if (!employee) return;

    if (!window.confirm(`Are you sure you want to delete ${employee.name}?`))
      return;

    try {
      setLoadingAction("delete-employee");
      setError(null);

      await axios.delete(`${API_BASE_URL}/api/employees/${employee.emp_id}`);

      setEmployees((prev) => prev.filter((emp) => emp.emp_id !== employee.emp_id));
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
      setError(null);
      setActionMessage("");

      await axios.delete(`${API_BASE_URL}/api/documents/${docId}`);

      setEmployees((prev) =>
        prev.map((emp, i) => {
          if (i === empIndex) {
            return {
              ...emp,
              documents: (emp.documents || []).filter(
                (d) => String(d.id) !== String(docId)
              ),
            };
          }
          return emp;
        })
      );

      setActionMessage("Document deleted successfully.");
      closePreview();
    } catch {
      setError("❌ Failed to delete document.");
      alert("Failed to delete document.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePreview = async (docId, fileName = "Document") => {
    try {
      setPreviewLoading(true);
      setError(null);
      closePreview();

      const res = await axios.get(
        `${API_BASE_URL}/api/employees/raw/${docId}`,
        {
          responseType: "blob",
        }
      );

      const contentType =
        res.headers["content-type"] || res.data.type || "application/octet-stream";
      const file = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(file);

      previewUrlRef.current = url;
      setPreviewUrl(url);
      setPreviewName(fileName);
      setPreviewContentType(contentType);
    } catch {
      alert("Failed to load document.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // ✅ Approve employee
  const approveEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setLoadingAction("approve");
      setError(null);

      await axios.put(
        `${API_BASE_URL}/api/employees/approve/${selectedEmployee.emp_id}`
      );

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.emp_id === selectedEmployee.emp_id
            ? { ...emp, decision: "approved" }
            : emp
        )
      );

      close();
    } catch {
      setError("❌ Failed to approve employee. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  // ✅ Reject employee
  const rejectEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setLoadingAction("reject");
      setError(null);

      await axios.put(
        `${API_BASE_URL}/api/employees/reject/${selectedEmployee.emp_id}`
      );

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.emp_id === selectedEmployee.emp_id
            ? { ...emp, decision: "rejected" }
            : emp
        )
      );

      close();
    } catch {
      setError("❌ Failed to reject employee. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  // const allVerified = (emp) =>
  //   emp.documents && emp.documents.every((d) => d.decision === "verified");

  const stats = employees.reduce(
    (acc, emp) => {
      const { verifiedCount, totalCount } = getEmployeeProgress(emp);
      const decision = String(emp.decision || "").toLowerCase();

      acc.employees += 1;
      acc.documents += totalCount;
      acc.verified += verifiedCount;

      if (decision === "approved") acc.approved += 1;
      else if (decision === "rejected") acc.rejected += 1;
      else acc.pending += 1;

      return acc;
    },
    { employees: 0, documents: 0, verified: 0, approved: 0, rejected: 0, pending: 0 }
  );

return (
  <div className="min-h-screen bg-gray-50 p-2">
    {/* Page Header */}
    <header className="px-4 pt-6 sm:px-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1 w-9 rounded-full bg-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              EMPLOYEE DOCUMENT APPROVAL
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Document Approval & Verification
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Review employee documents, verify submissions, and manage onboarding approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchEmployees}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-yellow-300 hover:bg-yellow-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
    </header>

    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 md:px-8">
      {/* Statistics */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Employees",
            value: stats.employees,
            icon: User,
            iconClass: "bg-gray-50 text-gray-700",
          },
          {
            label: "Pending Review",
            value: stats.pending,
            icon: Clock,
            iconClass: "bg-gray-50 text-red-500",
          },
          {
            label: "Approved",
            value: stats.approved,
            icon: CheckCircle,
            iconClass: "bg-gray-50 text-green-400",
          },
          {
            label: "Documents Verified",
            value: `${stats.verified}/${stats.documents}`,
            icon: ShieldCheck,
            iconClass: "bg-gray-50 text-yellow-500",
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className={`shrink-0 rounded-xl p-3 ${stat.iconClass}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Employee Joining Formalities */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800">
              <ShieldCheck size={21} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900">
                Employee Joining Formalities
              </h2>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                Select an employee to review their submitted documents.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:max-w-xs sm:flex-shrink-0">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, ID or date..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-100"
            />
          </div>
        </header>

        <div className="p-5 sm:p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 rounded-lg bg-yellow-100 p-1.5 text-gray-800 transition hover:bg-yellow-200"
                aria-label="Dismiss error"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}

          {actionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
            >
              <CheckCircle size={18} className="shrink-0" />
              <span className="min-w-0 flex-1">{actionMessage}</span>
              <button
                type="button"
                onClick={() => setActionMessage("")}
                className="shrink-0 rounded-lg bg-yellow-100 p-1.5 text-gray-800 transition hover:bg-yellow-200"
                aria-label="Dismiss message"
              >
                <X size={15} />
              </button>
            </motion.div>
          )}

          {loading && employees.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center">
              <RefreshCw size={28} className="animate-spin text-yellow-500" />
              <p className="mt-4 text-sm text-gray-500">
                Loading employees...
              </p>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 px-5 py-12 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-800">
                <File size={27} />
              </div>
              <h2 className="mt-4 font-bold text-gray-900">
                {searchTerm ? "No matching employees" : "No employees found"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-gray-500">
                {searchTerm
                  ? "Try another employee name, ID, or joining date."
                  : "Employee joining records will appear here when available."}
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-4 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-yellow-300"
                >
                  Clear Search
                </button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {filteredEmployees.map((emp) => {
                  const originalIndex = employees.findIndex(
                    (item) => item.emp_id === emp.emp_id
                  );
                  const {
                    verifiedCount,
                    totalCount,
                    progressPercent,
                  } = getEmployeeProgress(emp);
                  const employeeStatus = getEmployeeStatus(emp);
                  const StatusIcon = employeeStatus.icon;

                  return (
                      <motion.div
                        layout
                        key={emp.emp_id}
                        initial={false}
                        animate="visible"
                        exit="exit"
                        variants={cardVariants}
                        whileHover={{
                          y: -2,
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.10), 0 4px 6px -4px rgb(0 0 0 / 0.10)",
                        }}
                        transition={{ duration: 0.2 }}
                        className="group flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-yellow-300"
                      >
                      <div className="mb-5 flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-colors duration-200 group-hover:bg-yellow-100">
                          <User
                            size={23}
                            className="text-gray-700 transition-colors duration-200 group-hover:text-gray-900"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words text-base font-bold text-gray-900">
                            {emp.name || "Unknown"}
                          </h3>
                          <p className="mt-1 break-words text-sm text-gray-500">
                            ID: {emp.emp_id}
                          </p>
                        </div>

                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            progressPercent === 100 && totalCount > 0
                              ? "bg-green-500"
                              : "bg-yellow-400"
                          }`}
                          title={
                            progressPercent === 100 && totalCount > 0
                              ? "All documents verified"
                              : "Verification pending"
                          }
                        />
                      </div>

                      <p className="mb-5 flex items-start gap-2 text-sm text-gray-500">
                        <Calendar size={16} className="mt-0.5 shrink-0 text-gray-400" />
                        <span className="min-w-0 break-words">
                          Joining Date:{" "}
                          {emp.created_at
                            ? new Date(emp.created_at).toLocaleDateString()
                            : "Not Specified"}
                        </span>
                      </p>

                      <div className="mb-5 rounded-xl bg-gray-50 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-gray-700">
                            Verification progress
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {progressPercent}%
                          </span>
                        </div>

                        <div
                          className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200"
                          role="progressbar"
                          aria-valuenow={progressPercent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Document verification progress"
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full bg-yellow-400"
                          />
                        </div>

                        <p className="mt-2 text-xs text-gray-500">
                          {verifiedCount}/{totalCount} verified
                        </p>
                      </div>

                      <p
                        className={`mb-5 flex items-center gap-2 text-sm ${employeeStatus.className}`}
                      >
                        <StatusIcon size={17} className="shrink-0" />
                        {employeeStatus.label}
                      </p>

                      <div className="mt-auto space-y-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedEmployeeIndex(originalIndex)
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
                        >
                          <Eye size={17} />
                          View Documents
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteEmployee(originalIndex)}
                          disabled={loadingAction === "delete-employee"}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          {loadingAction === "delete-employee"
                            ? "Deleting..."
                            : "Delete Employee"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-3 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <motion.div
              layout
              role="dialog"
              aria-modal="true"
              aria-labelledby="verification-title"
              className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
              initial={{ scale: 0.96, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 p-4 sm:p-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-gray-800">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Employee Onboarding
                    </p>
                    <h2
                      id="verification-title"
                      className="mt-1 break-words text-lg font-bold text-gray-900"
                    >
                      Verification - {selectedEmployee.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Employee ID: {selectedEmployee.emp_id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-lg bg-yellow-100 p-2 text-gray-800 transition hover:bg-yellow-200"
                  aria-label="Close verification modal"
                >
                  <X size={21} />
                </button>
              </header>

              <main className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 sm:p-6">
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 flex-1">{error}</span>
                  </div>
                )}

                {actionMessage && (
                  <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    <CheckCircle size={17} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 flex-1">{actionMessage}</span>
                  </div>
                )}

                {(selectedEmployee.documents || []).length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center">
                    <File size={40} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="font-bold text-gray-800">
                      No documents uploaded
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Documents uploaded by this employee will appear here.
                    </p>
                  </div>
                ) : (
                  (selectedEmployee.documents || []).map((doc) => {
                    const status = String(
                      doc.decision || doc.status || "pending"
                    ).toLowerCase();
                    const verified = status === "verified";
                    const rejected = status === "rejected";
                    const isDeleting =
                      loadingAction === `delete-doc-${doc.id}`;
                    const fileName =
                      doc.file_name ||
                      doc.filename ||
                      doc.name ||
                      "Document";

                    return (
                      <div
                        key={doc.id}
                        className="rounded-xl border border-gray-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-gray-700">
                              <FileText size={21} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="break-all text-sm font-bold text-gray-900">
                                {fileName}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Document ID: {doc.id}
                              </p>
                              <span
                                className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                  verified
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : rejected
                                      ? "border-red-200 bg-red-50 text-red-700"
                                      : "border-yellow-200 bg-yellow-50 text-yellow-800"
                                }`}
                              >
                                {verified ? (
                                  <CheckCircle size={13} />
                                ) : rejected ? (
                                  <XCircle size={13} />
                                ) : (
                                  <Clock size={13} />
                                )}
                                {status.charAt(0).toUpperCase() +
                                  status.slice(1)}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                            <button
                              type="button"
                              onClick={() => handlePreview(doc.id, fileName)}
                              disabled={previewLoading}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-yellow-100 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-yellow-200 disabled:opacity-50"
                            >
                              <Eye size={15} />
                              {previewLoading ? "Loading..." : "Preview"}
                            </button>

                            {!verified && !rejected && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    verifyDocument(
                                      selectedEmployeeIndex,
                                      doc.id,
                                      "verified"
                                    )
                                  }
                                  disabled={loadingAction === doc.id}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <CheckCircle size={15} />
                                  {loadingAction === doc.id
                                    ? "Updating..."
                                    : "Verify"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    verifyDocument(
                                      selectedEmployeeIndex,
                                      doc.id,
                                      "rejected"
                                    )
                                  }
                                  disabled={loadingAction === doc.id}
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <XCircle size={15} />
                                  Reject
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                deleteDocument(selectedEmployeeIndex, doc.id)
                              }
                              disabled={isDeleting}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 size={15} />
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </main>

              <footer className="flex shrink-0 flex-col gap-3 border-t border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <p className="text-xs leading-5 text-gray-500">
                  Verify submitted documents before approving the employee.
                </p>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={approveEmployee}
                    disabled={
                      loadingAction === "approve" ||
                      loadingAction === "reject"
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    {loadingAction === "approve" ? "Approving..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={rejectEmployee}
                    disabled={
                      loadingAction === "reject" ||
                      loadingAction === "approve"
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-300 bg-yellow-100 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    {loadingAction === "reject" ? "Rejecting..." : "Reject"}
                  </button>

                  <button
                    type="button"
                    onClick={close}
                    className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-yellow-100"
                  >
                    Close
                  </button>
                </div>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered Document Preview Popup */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/70 p-3 backdrop-blur-sm sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closePreview();
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Document preview"
              className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-gray-800">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-bold text-gray-900 sm:text-base">
                      {previewName || "Document Preview"}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Document viewer
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={previewUrl}
                    download={previewName || "document"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-400 px-3 py-2 text-sm font-bold text-gray-900 transition hover:bg-yellow-300"
                  >
                    <Download size={15} />
                    <span className="hidden sm:inline">Download</span>
                  </a>

                  <button
                    type="button"
                    onClick={closePreview}
                    className="rounded-lg bg-yellow-100 p-2 text-gray-800 transition hover:bg-yellow-200"
                    aria-label="Close document preview"
                  >
                    <X size={21} />
                  </button>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-auto bg-gray-100 p-2 sm:p-4">
                {previewContentType.startsWith("image/") ? (
                  <div className="flex min-h-[45vh] items-center justify-center">
                    <img
                      src={previewUrl}
                      alt={previewName || "Document preview"}
                      className="max-h-[72vh] max-w-full rounded-lg object-contain shadow-sm"
                    />
                  </div>
                ) : previewContentType.includes("pdf") ? (
                  <iframe
                    src={previewUrl}
                    title="Document Preview"
                    className="h-[65vh] w-full rounded-lg border border-gray-200 bg-white sm:h-[72vh]"
                  />
                ) : (
                  <div className="flex min-h-[45vh] flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
                    <File size={42} className="text-yellow-600" />
                    <p className="mt-4 font-semibold text-gray-800">
                      Preview is not available for this file type.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Download the document to view it on your device.
                    </p>
                    <a
                      href={previewUrl}
                      download={previewName || "document"}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-yellow-300"
                    >
                      <Download size={16} />
                      Download Document
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  </div>
);
};

export default AdminUI;
