import React, { useState } from "react";
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
  Menu,
} from "lucide-react";

const API_URL = "http://localhost:5000";

const EmployeeJoiningFormalities = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [employeeData, setEmployeeData] = useState({
    emp_id: "",
  });

  const initialDocuments = () => [
    {
      name: "Aadhar Card",
      description: "Government-issued identity proof",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
    },
    {
      name: "PAN Card",
      description: "Permanent Account Number card",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
    },
    {
      name: "Passport Size Photo",
      description: "Recent color passport photo",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
    },
    {
      name: "Bank Details",
      description: "Cancelled cheque or passbook copy",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
    },
    {
      name: "Educational Certificates",
      description: "10th, 12th, UG, PG certificates",
      decision: "pending",
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
    },
  ];

  const [documents, setDocuments] = useState(initialDocuments);

  // ✅ Handle file upload
  const handleFileChange = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const updatedDocs = [...documents];
    updatedDocs[index] = {
      ...updatedDocs[index],
      file,
      previewURL: URL.createObjectURL(file),
      fileName: file.name,
      date: new Date().toLocaleDateString(),
      decision: "submitted",
    };
    setDocuments(updatedDocs);
  };

  // ✅ Handle file delete
  const handleFileDelete = (index) => {
    const updatedDocs = [...documents];
    updatedDocs[index] = {
      ...updatedDocs[index],
      file: null,
      previewURL: "",
      fileName: "",
      date: "",
      decision: "pending",
    };
    setDocuments(updatedDocs);
  };

  // ✅ Submit data to backend
  const handleSubmit = async () => {
    if (!employeeData.emp_id) {
      alert("Please enter your Employee ID.");
      return;
    }

    const allUploaded = documents.every(
      (doc) => doc.decision === "submitted" || doc.decision === "verified"
    );
    if (!allUploaded) {
      alert("Please upload all required documents before submitting.");
      return;
    }

    try {
      // Ensure employee exists
      await axios.post(`${API_URL}/api/employees`, {
        emp_id: employeeData.emp_id,
      });

      // Upload each document
      for (let doc of documents) {
        if (doc.file instanceof File) {
          const formData = new FormData();
          formData.append("file", doc.file);
          formData.append("name", doc.name);
          formData.append("description", doc.description);
          formData.append("emp_id", employeeData.emp_id);

          await axios.post(
            `${API_URL}/api/employees/${employeeData.emp_id}/documents`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        }
      }

      alert("Documents submitted successfully!");

      // Reset form
      setEmployeeData({ emp_id: "" });
      setDocuments(initialDocuments());
    } catch (err) {
      console.error("Error uploading:", err);
      alert(`Failed to upload data: ${err.message}`);
    }
  };

  const totalDocs = documents.length;
  const docsCompleted = documents.filter(
    (doc) => doc.decision !== "pending"
  ).length;
  const percentage = Math.round((docsCompleted / totalDocs) * 100);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-400 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-blue-900 border-b border-gray-200 shadow-sm">
    <div className="flex-grow text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white">
             Document Uploading
            </h1>
          </div>
        
        
      </header>

      {/* Progress Summary */}
      <div className="bg-blue-50 py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row  items-center justify-between">
          <div className="flex items-center mb-2 sm:mb-0">
            <CheckCircle size={22} className="text-blue-600 mr-2" />
            <span className="text-lg font-medium text-blue-800">
              Progress: {docsCompleted}/{totalDocs} documents
            </span>
          </div>
          <div className="flex items-center w-full sm:w-auto">
            <div className="w-96 bg-gray-200 rounded-full h-4 mr-3">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium text-blue-800">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="hidden md:flex ">
        <div className="max-w-6xl mx-auto w-full px-6 mt-6 mb-4">
          <div className="flex gap-4  justify-center">
            <button
              className={`px-6 py-3 rounded-lg ${
                activeTab === "dashboard"
                  ? "bg-blue-100 text-blue-700 border border-blue-300 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("dashboard")}
            >
              <LayoutDashboard size={18} className="mr-2 inline" />
              Dashboard
            </button>
            <button
              className={`px-6 py-3 rounded-lg ${
                activeTab === "documents"
                  ? "bg-blue-100 text-blue-700 border border-blue-300 shadow-sm"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("documents")}
            >
              <FileText size={18} className="mr-2 inline" />
              Documents
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-2 bg-gradient-to-br from-blue-200 via-white to-blue-50">
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
                completed={0}
                total={totalDocs}
              />
              <ProgressCard
                title="Overall Progress"
                completed={docsCompleted}
                total={totalDocs}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-medium text-gray-800 mb-6 flex items-center">
                <AlertCircle size={20} className="mr-2 text-blue-600" />
                Next Steps
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <span className="text-blue-700 text-sm font-bold">1</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-gray-800 font-medium">
                      Complete document submission
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      Upload all required documents to proceed with verification
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
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
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
              <h1 className="text-2xl font-semibold flex justify-center items-center w-full text-gray-800 mb-6">
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
                      onChange={(e) =>
                        setEmployeeData({ ...employeeData, emp_id: e.target.value })
                      }
                      className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your Employee ID"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800">Required Documents</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload all documents to complete your onboarding process
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {documents.map((doc, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mr-4 flex-shrink-0">
                            <FileText size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">{doc.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{doc.description}</p>

                            {doc.previewURL && (
                              <div className="flex items-center mt-2">
                                <a
                                  href={doc.previewURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <FileText size={16} className="mr-1" />
                                  {doc.fileName || "View uploaded file"}
                                </a>
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
                        <div className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          <Upload size={16} className="mr-2" />
                          {doc.file ? "Replace File" : "Upload File"}
                        </div>
                      </label>

                      {doc.file && (
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
                  disabled={!employeeData.emp_id || docsCompleted !== totalDocs}
                  className="px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit All Documents
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const ProgressCard = ({ title, completed, total }) => {
  const percentage = Math.round((completed / total) * 100);

  const getStatusColor = () => {
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    return "bg-yellow-500";
  };

  const getStatusIcon = () => {
    if (percentage === 100)
      return <CheckCircle size={20} className="text-green-500" />;
    if (percentage >= 50)
      return <Clock size={20} className="text-blue-500" />;
    return <AlertCircle size={20} className="text-yellow-500" />;
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
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
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
