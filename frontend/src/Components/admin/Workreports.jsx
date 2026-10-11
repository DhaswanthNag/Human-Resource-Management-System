// src/Components/admin/AdminWorkReports.jsx
import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaFileDownload,
  FaPencilAlt, // Edit icon
  FaSave,      // Save icon
  FaTimes,     // Cancel icon
} from "react-icons/fa";
import { workReportsApi } from "../../api/workreportsApi";

const PAGE_SIZE = 10; // ✅ Show 10 reports per page

const AdminWorkReports = () => {
  const [reports, setReports] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [, setError] = useState(null);

  // ✅ New state to track which report is being edited
  const [editingReportId, setEditingReportId] = useState(null);

  // ✅ Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    workReportsApi
      .getAll()
      .then((res) => {
        const data = Array.isArray(res) ? res : res?.data || [];
        setReports(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ✅ Function to handle saving the updated comment
  const handleSaveComment = async (reportId) => {
    const comment = commentInputs[reportId];
    // Allow submitting an empty string to clear the comment
    if (typeof comment !== "string") return;

    try {
      const updated = await workReportsApi.comment(reportId, {
        comment: comment.trim(),
        status: "Reviewed",
      });
      setReports((prev) =>
        prev.map((r) => (r.report_id === reportId ? updated : r))
      );
      setError(null);
      setEditingReportId(null); // Exit editing mode on success
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ Function to enter editing mode for a report
  const handleStartEdit = (report) => {
    setEditingReportId(report.report_id);
    // Pre-fill the input with the current comment
    setCommentInputs((prev) => ({
      ...prev,
      [report.report_id]: report.comment || "",
    }));
  };

  // ✅ Function to cancel editing
  const handleCancelEdit = () => {
    setEditingReportId(null);
  };


  // ✅ Export CSV
  const exportCSV = () => {
    try {
      if (!reports || reports.length === 0) {
        alert("No reports to export");
        return;
      }

      // Convert JSON → CSV
      const headers = [
        "Report ID",
        "Employee ID",
        "Type",
        "Summary",
        "Status",
        "Admin Comment",
        "Date/Time",
      ];

      const rows = reports.map((r) => [
        r.report_id,
        r.user_id,
        r.frequency,
        `"${(r.content || "").replace(/"/g, '""')}"`, // escape quotes
        Array.isArray(r.status) ? r.status.join(", ") : r.status || "Pending",
        `"${(r.comment || "").replace(/"/g, '""')}"`,
        new Date(r.created_at).toLocaleString(),
      ]);

      const csvContent =
        [headers, ...rows].map((row) => row.join(",")).join("\n");

      // Trigger download
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "work_reports.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError("Failed to export CSV");
    }
  };

  const StatusBadge = ({ status }) => {
    const statusText = Array.isArray(status)
      ? status.join(", ")
      : status || "Pending";
    let bgColor = "bg-gray-100 text-gray-800";
    if (statusText.includes("Reviewed"))
      bgColor = "bg-green-100 text-green-800";
    else if (statusText.includes("Rejected"))
      bgColor = "bg-red-100 text-red-800";
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${bgColor}`}
      >
        {statusText}
      </span>
    );
  };

  // ✅ Filtering
  const filtered = reports
    .filter((r) => r.user_id?.toLowerCase().includes(searchId.toLowerCase()))
    .filter((r) => filterType === "All" || r.frequency === filterType)
    .filter((r) => {
      if (filterStatus === "All") return true;
      const statusText = Array.isArray(r.status)
        ? r.status.join(", ")
        : r.status || "Pending";
      return statusText.includes(filterStatus);
    })
    .filter((r) => {
      if (!filterDate) return true;
      const reportDate = new Date(r.created_at).toISOString().split("T")[0];
      return reportDate === filterDate;
    });

  // ✅ Pagination slice
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="min-h-screen py-0 px-0 bg-gray-50 mr-6">
      <div className="max-w-screen mx-auto">
        {/* Title */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-gray">
              Admin panel for managing employee work reports
            </h1>
          </div>
          <button
            onClick={exportCSV}
            className="bg-gray-600 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
          >
            <FaFileDownload />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-20 bg-white p-3 rounded-xl shadow border flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex items-center flex-1 gap-2">
            <FaSearch className="text-white-500" />
            <input
              placeholder="Search by Report ID"
              value={searchId}
              onChange={(e) => {
                setSearchId(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 border-none text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">All Types</option>
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Report ID",
                    "Employee",
                    "Type",
                    "Summary",
                    "Status",
                    "Comment",
                    "Date/Time",
                    "Actions",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-3 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.map((r) => {
                  const isEditing = editingReportId === r.report_id;
                  return (
                    <tr key={r.report_id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 font-medium">
                        {r.report_id}
                      </td>
                      <td className="px-3 sm:px-6 py-4">{r.user_id}</td>
                      <td className="px-3 sm:px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                            r.frequency === "Daily"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {r.frequency}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 max-w-[200px] truncate">
                        {r.content}
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 sm:px-6 py-4 min-w-[200px]">
                        {isEditing ? (
                          <textarea
                            rows={3}
                            value={commentInputs[r.report_id] ?? ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [r.report_id]: e.target.value,
                              }))
                            }
                            className="w-full border rounded-lg px-3 py-2 text-xs sm:text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Add or update comment..."
                          />
                        ) : (
                          <p className="text-xs text-gray-700">
                            {r.comment || (
                              <span className="text-gray-400">No comment yet.</span>
                            )}
                          </p>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 sm:px-6 py-4 font-medium">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveComment(r.report_id)}
                              className="flex items-center text-green-600 hover:text-green-900 gap-1 text-xs sm:text-sm"
                            >
                              <FaSave /> Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center text-red-600 hover:text-red-900 gap-1 text-xs sm:text-sm"
                            >
                              <FaTimes /> Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(r)}
                            className="flex items-center text-indigo-600 hover:text-indigo-900 gap-1 text-xs sm:text-sm"
                          >
                            <FaPencilAlt /> Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!loading && paginated.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-gray-500 text-sm"
                    >
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-4 border-t">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWorkReports;