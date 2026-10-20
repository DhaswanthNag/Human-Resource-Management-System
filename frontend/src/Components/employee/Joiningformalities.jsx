import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  FileText,
  User,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  Download,
  RefreshCw,
  // Menu,
} from "lucide-react";

const API_URL = "http://localhost:5000";
const EMPLOYEE_ID_KEY = "joiningFormalitiesEmpId";

const EmployeeJoiningFormalities = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [employeeData, setEmployeeData] = useState({
    emp_id: localStorage.getItem(EMPLOYEE_ID_KEY) || "",
  });

  const blobURLsRef = useRef(new Set());
  const loadingEmployeeIdRef = useRef("");

  const initialDocuments = () => [
    {
      name: "Aadhar Card",
      description: "Government-issued identity proof",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
      docId: null,
    },
    {
      name: "PAN Card",
      description: "Permanent Account Number card",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
      docId: null,
    },
    {
      name: "Passport Size Photo",
      description: "Recent color passport photo",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
      docId: null,
    },
    {
      name: "Bank Details",
      description: "Cancelled cheque or passbook copy",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
      docId: null,
    },
    {
      name: "Educational Certificates",
      description: "10th, 12th, UG, PG certificates",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
      docId: null,
    },
  ];

  const [documents, setDocuments] = useState(initialDocuments);

  // Load saved documents for the entered employee ID
  const loadEmployeeDocuments = useCallback(async (empId) => {
    const normalizedEmpId = String(empId || "").trim();

    if (!normalizedEmpId) return;

    loadingEmployeeIdRef.current = normalizedEmpId;
    setLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/api/employees/${encodeURIComponent(normalizedEmpId)}/documents`
      );

      const savedDocuments = Array.isArray(response.data)
        ? response.data
        : response.data.documents || [];

      // Match saved documents by name and retain their latest database status.
      setDocuments((currentDocuments) =>
        currentDocuments.map((doc) => {
          const saved = savedDocuments.find(
            (item) =>
              String(item.document_name || item.name || "").trim().toLowerCase() ===
              doc.name.trim().toLowerCase()
          );

          if (!saved) return doc;

          // Normalize the status returned by the backend.
          const savedDecision = String(
            saved.decision || saved.status || "pending"
          ).toLowerCase();

          // A server document URL is different from a temporary local blob URL.
          const savedPreviewURL = saved.id
            ? `${API_URL}/api/employees/raw/${saved.id}`
            : doc.previewURL;

          // Revoke an old local preview if a saved database document replaces it.
          if (
            doc.previewURL?.startsWith("blob:") &&
            doc.previewURL !== savedPreviewURL
          ) {
            URL.revokeObjectURL(doc.previewURL);
            blobURLsRef.current.delete(doc.previewURL);
          }

          return {
            ...doc,
            file: null,
            previewURL: savedPreviewURL,
            fileName: saved.file_name || doc.fileName || "",
            date: saved.uploaded_at
              ? new Date(saved.uploaded_at).toLocaleDateString()
              : doc.date,
            decision: savedDecision,
            docId: saved.id || doc.docId,
          };
        })
      );
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Error loading employee documents:", err);
        alert(
          err.response?.data?.error ||
            "Unable to load saved documents. Please check the backend."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh saved joining formalities documents
  const handleRefresh = async () => {
    const empId = employeeData.emp_id.trim();

    if (!empId) {
      alert("Please enter your Employee ID in the Documents tab first.");
      return;
    }

    await loadEmployeeDocuments(empId);
  };

  // Automatically load previously saved documents after the page is refreshed.
  useEffect(() => {
    const savedEmpId = localStorage.getItem(EMPLOYEE_ID_KEY);

    if (savedEmpId?.trim()) {
      setEmployeeData({ emp_id: savedEmpId });
      loadEmployeeDocuments(savedEmpId);
    }
  }, [loadEmployeeDocuments]);

  // Refresh the saved documents when the employee opens the Documents tab.
  useEffect(() => {
    if (activeTab === "documents" && employeeData.emp_id.trim()) {
      loadEmployeeDocuments(employeeData.emp_id);
    }
  }, [activeTab, employeeData.emp_id, loadEmployeeDocuments]);

  // ✅ Handle file upload
  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must not exceed 10 MB.");
      e.target.value = "";
      return;
    }

    const updatedDocs = [...documents];
    if (
      updatedDocs[index].previewURL &&
      updatedDocs[index].file &&
      updatedDocs[index].previewURL.startsWith("blob:")
    ) {
      URL.revokeObjectURL(updatedDocs[index].previewURL);
      blobURLsRef.current.delete(updatedDocs[index].previewURL);
    }

    const previewURL = URL.createObjectURL(file);
    blobURLsRef.current.add(previewURL);

    updatedDocs[index] = {
      ...updatedDocs[index],
      file,
      previewURL,
      fileName: file.name,
      date: new Date().toLocaleDateString(),
      decision: "submitted",
    };

    setDocuments(updatedDocs);
    e.target.value = "";
  };

  // ✅ Handle file delete
  const handleFileDelete = async (index) => {
    const doc = documents[index];

    try {
      if (doc.docId) {
        await axios.delete(
          `${API_URL}/api/employees/documents/${doc.docId}`
        );
      }

      if (doc.previewURL && doc.previewURL.startsWith("blob:")) {
        URL.revokeObjectURL(doc.previewURL);
        blobURLsRef.current.delete(doc.previewURL);
      }

      const updatedDocs = [...documents];
      updatedDocs[index] = {
        ...updatedDocs[index],
        file: null,
        previewURL: "",
        fileName: "",
        date: "",
        decision: "pending",
        docId: null,
      };

      setDocuments(updatedDocs);
    } catch (err) {
      console.error("Error deleting document:", err);
      alert(
        err.response?.data?.error ||
          "Failed to remove the document. Please try again."
      );
    }
  };

  // ✅ Submit data to backend
  const handleSubmit = async () => {
    const empId = employeeData.emp_id.trim();

    if (!empId) {
      alert("Please enter your Employee ID.");
      return;
    }

    const allUploaded = documents.every(
      (doc) =>
        doc.file ||
        doc.docId ||
        doc.fileName ||
        doc.decision === "verified"
    );

    if (!allUploaded) {
      alert("Please upload all required documents before submitting.");
      return;
    }

    const documentsToUpload = documents.filter((doc) => doc.file);

    if (documentsToUpload.length === 0) {
      await loadEmployeeDocuments(empId);
      alert("All documents are already saved.");
      return;
    }

    setSubmitting(true);

    try {
      // Save the employee ID so it can be restored after refreshing the page.
      localStorage.setItem(EMPLOYEE_ID_KEY, empId);

      // Ensure employee exists
      await axios.post(`${API_URL}/api/employees`, {
        emp_id: empId,
      });

      // Upload each document
      for (const doc of documentsToUpload) {
        const formData = new FormData();
        formData.append("file", doc.file);
        formData.append("name", doc.name);
        formData.append("document_name", doc.name);
        formData.append("description", doc.description);
        formData.append("emp_id", empId);

        const response = await axios.post(
          `${API_URL}/api/employees/${encodeURIComponent(empId)}/documents`,
          formData
        );

        const saved = response.data.document || response.data;

        setDocuments((currentDocuments) =>
          currentDocuments.map((item) => {
            if (item.name !== doc.name) return item;

            if (item.previewURL?.startsWith("blob:")) {
              URL.revokeObjectURL(item.previewURL);
              blobURLsRef.current.delete(item.previewURL);
            }

            return {
              ...item,
              file: null,
              previewURL: saved?.id
                ? `${API_URL}/api/employees/raw/${saved.id}`
                : item.previewURL,
              fileName: saved?.file_name || item.fileName,
              date: saved?.uploaded_at
                ? new Date(saved.uploaded_at).toLocaleDateString()
                : item.date,
              decision: String(
                saved?.decision || saved?.status || "pending"
              ).toLowerCase(),
              docId: saved?.id || item.docId,
            };
          })
        );
      }

      await loadEmployeeDocuments(empId);
      alert("Documents submitted successfully!");
    } catch (err) {
      console.error("Error uploading:", err);
      alert(
        err.response?.data?.error ||
          `Failed to upload data: ${err.message}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!previewDocument) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") setPreviewDocument(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewDocument]);

  useEffect(() => {
    const blobURLs = blobURLsRef.current;

    return () => {
      blobURLs.forEach((url) => URL.revokeObjectURL(url));
      blobURLs.clear();
    };
  }, []);

  const totalDocs = documents.length;

  // Count uploaded documents independently of verification status.
  // A saved document remains completed even when its status is "pending".
  const docsCompleted = documents.filter(
    (doc) => doc.file || doc.docId || doc.fileName || doc.decision === "verified"
  ).length;

  const docsVerified = documents.filter(
    (doc) => doc.decision === "verified"
  ).length;

  const percentage = totalDocs
    ? Math.round((docsCompleted / totalDocs) * 100)
    : 0;

  return (
    <div className="min-h-screen w-full bg-gray-50">
      
      {/* Header */}
      {/* Professional page heading */}
      <header className="px-4 pt-6 sm:px-6 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1 w-9 rounded-full bg-yellow-400"></span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                Employee Onboarding
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Document Submission Panel
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Upload your required documents and track their verification progress.
            </p>
          </div>

          {/* Refresh Button */}
          <div className="flex shrink-0 items-center sm:pt-1 sm:ml-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition duration-200 hover:border-yellow-300 hover:bg-yellow-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* Progress Summary */}
      <div className="mx-4 mt-6 rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm sm:mx-6 sm:px-6 md:mx-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0">
            <CheckCircle size={22} className="text-gray-700 mr-2" />
            <span className="text-lg font-medium text-gray-700">
              Progress: {docsCompleted}/{totalDocs} documents
            </span>
          </div>
          <div className="flex w-full items-center sm:max-w-md">
            <div className="mr-3 h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-gray-700 transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full px-4 sm:px-6 mt-6 mb-5">
        <div className="max-w-6xl mx-auto flex justify-center">
          <div className="inline-flex w-full sm:w-auto items-center gap-2 rounded-2xl border border-gray-200 bg-gray-100/80 p-2 shadow-sm">
            <button
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2.5 px-5 sm:px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === "dashboard"
                  ? "bg-yellow-400 text-gray-900 shadow-md ring-1 ring-yellow-500/40"
                  : "bg-transparent text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard
                size={19}
                strokeWidth={activeTab === "dashboard" ? 2.5 : 2}
              />
              <span>Dashboard</span>
              {activeTab === "dashboard" && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-gray-800" />
              )}
            </button>

            <button
              className={`flex flex-1 sm:flex-none items-center justify-center gap-2.5 px-5 sm:px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === "documents"
                  ? "bg-yellow-400 text-gray-900 shadow-md ring-1 ring-yellow-500/40"
                  : "bg-transparent text-gray-600 hover:bg-white hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("documents")}
            >
              <FileText
                size={19}
                strokeWidth={activeTab === "documents" ? 2.5 : 2}
              />
              <span>Documents</span>
              {activeTab === "documents" && (
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-gray-800" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-2 bg-gray-50">
        {activeTab === "dashboard" && (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <ProgressCard
                title="Documents Uploaded"
                completed={docsCompleted}
                total={totalDocs}
              />
              <ProgressCard
                title="Verification Status"
                completed={docsVerified}
                total={totalDocs}
              />
              <ProgressCard
                title="Overall Progress"
                completed={docsCompleted}
                total={totalDocs}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-medium text-gray-800 mb-6 flex items-center">
                <AlertCircle size={20} className="mr-2 text-gray-700" />
                Next Steps
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5">
                    <span className="text-gray-700 text-sm font-bold">1</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-800 font-medium">
                      Complete document submission
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      Upload all required documents to proceed with verification
                    </p>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {docsCompleted} of {totalDocs} documents uploaded
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                    <span className="text-gray-500 text-sm font-bold">2</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 font-medium">HR verification</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Your documents will be reviewed by the HR team
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                    <span className="text-gray-500 text-sm font-bold">3</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-500 font-medium">Account setup</p>
                    <p className="text-gray-400 text-sm mt-1">
                      You will receive system access credentials
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="max-w-5xl mx-auto">
            {/* Employee ID */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
              <h1 className="text-2xl font-bold flex justify-center items-center w-full text-gray-800 mb-6">
                Employee Information
              </h1>

              <div className="flex justify-center items-center w-full">
                <div className="w-full max-w-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2 ml-2">
                    Employee ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={employeeData.emp_id}
                      onChange={(e) => {
                        const empId = e.target.value;
                        setEmployeeData({ ...employeeData, emp_id: empId });
                        localStorage.setItem(EMPLOYEE_ID_KEY, empId);
                      }}
                      onBlur={() => loadEmployeeDocuments(employeeData.emp_id)}
                      className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition duration-300"
                      placeholder="Enter your Employee ID"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Required Documents</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload all documents to complete your onboarding process
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {documents.map((doc, index) => (
                  <div key={index} className="p-6 hover:bg-yellow-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4 flex-shrink-0">
                            <FileText size={18} className="text-gray-700" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{doc.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{doc.description}</p>

                            {doc.previewURL && (
                              <div className="flex items-center mt-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocument(doc)}
                                  className="text-sm font-semibold text-gray-700 hover:text-gray-950 flex items-center rounded-lg px-2 py-1 -ml-2 hover:bg-yellow-50 transition-colors"
                                >
                                  <FileText size={16} className="mr-2 text-yellow-600" />
                                  {doc.fileName || "View uploaded file"}
                                </button>
                                <span className="text-sm text-gray-500 mx-2">•</span>
                                <span className="text-sm text-gray-500">Uploaded {doc.date}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            doc.decision === "verified"
                              ? "bg-green-100 text-green-800"
                              : doc.decision === "submitted"
                              ? "bg-yellow-100 text-yellow-800"
                              : doc.decision === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {doc.decision}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, index)}
                        />
                        <div className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-yellow-50 transition-colors">
                          <Upload size={16} className="mr-2" />
                          {doc.file || doc.docId ? "Replace File" : "Upload File"}
                        </div>
                      </label>

                      {(doc.file || doc.docId) && (
                        <button
                          onClick={() => handleFileDelete(index)}
                          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={!employeeData.emp_id.trim() || docsCompleted !== totalDocs || submitting || loading}
                  className="px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit All Documents"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Document Preview Popup */}
      {previewDocument?.previewURL && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-2 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreviewDocument(null);
          }}
        >
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-700 bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-900 px-4 py-3 text-white sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden rounded-lg bg-yellow-400 p-2 text-gray-900 sm:block">
                  <FileText size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold sm:text-base">Document Preview</h2>
                  <p className="mt-0.5 truncate text-xs text-gray-300">
                    {previewDocument.fileName || previewDocument.name}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={previewDocument.previewURL}
                  download={previewDocument.fileName || "document"}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-gray-900 transition hover:bg-yellow-300 sm:text-sm"
                >
                  <Download size={15} />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="rounded-lg p-2 text-gray-300 transition hover:bg-gray-700 hover:text-white"
                  aria-label="Close document preview"
                >
                  <X size={21} />
                </button>
              </div>
            </header>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-100 p-2 sm:p-4">
              {previewDocument.file?.type?.startsWith("image/") ||
              /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(previewDocument.fileName || "") ? (
                <img
                  src={previewDocument.previewURL}
                  alt={previewDocument.fileName || previewDocument.name}
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              ) : (
                <iframe
                  src={previewDocument.previewURL}
                  title={`Preview of ${previewDocument.fileName || previewDocument.name}`}
                  className="h-full w-full rounded-lg border border-gray-200 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProgressCard = ({ title, completed, total }) => {
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const getStatusColor = () => {
    if (percentage === 100) return "bg-yellow-500";
    if (percentage >= 50) return "bg-gray-500";
    return "bg-red-300";
  };

  const getStatusIcon = () => {
    if (percentage === 100)
      return <CheckCircle size={20} className="text-green-500" />;
    if (percentage >= 50)
      return <Clock size={20} className="text-gray-700" />;
    return <AlertCircle size={20} className="text-red-500" />;
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {getStatusIcon()}
      </div>
      <div className="flex items-baseline mb-4">
        <p className="text-3xl font-semibold text-gray-900">
          {completed}/{total}
        </p>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium text-gray-700">{percentage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${getStatusColor()}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeJoiningFormalities;