// src/Components/employee/Workreports.jsx
import React, { useState, useEffect } from "react";
import { FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { workReportsApi } from "../../api/workreportsApi";

const Workreports = () => {
  const [workSummary, setWorkSummary] = useState("");
  const [reportType, setReportType] = useState("Daily");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Filters
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  // 🔹 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await workReportsApi.getMy();
      const data = Array.isArray(res) ? res : res?.data || [];
      setReports(data);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!workSummary.trim()) return;
    setLoading(true);
    try {
      const result = await workReportsApi.submit({
        content: workSummary.trim(),
        frequency: reportType,
      });
      const newReport = result?.data || result;
      setReports((prev) => [newReport, ...prev]);
      setWorkSummary("");
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Status badge component
  const StatusBadge = ({ status }) => {
    const text = Array.isArray(status) ? status.join(", ") : status || "Pending";
    let bg = "bg-gray-100 text-gray-800";
    let icon = <FaClock className="mr-1" />;

    if (text.includes("Reviewed")|| text.includes("Approved")) {
      bg = "bg-green-100 text-green-800";
      icon = <FaCheckCircle className="mr-1" />;
    } else if (text.includes("Rejected")) {
      bg = "bg-red-100 text-red-800";
      icon = <FaTimesCircle className="mr-1" />;
    }

    return (
      <span
        className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium shadow-sm ${bg}`}
      >
        {icon}
        {text}
      </span>
    );
  };

  // 🔹 Filtering logic
  const filteredReports = reports
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

  // 🔹 Pagination slice
  const indexOfLast = currentPage * reportsPerPage;
  const indexOfFirst = indexOfLast - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  return (
    <div className="min-h-screen  bg-gradient-to-br from-blue-400 via-white to-blue-50 py-0 px-0 ">
      <header className="flex items-center justify-between py-5 bg-blue-900 mb-8 px-6">
          {/* Centered Title */}
          <div className="flex-grow text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white">
              Work Reports
            </h1>
          </div>
        </header>
      <div className="max-w-6xl mx-auto">
        {/* Submit Report Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border p-4 sm:p-8 mb-8 sm:mb-10">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
            Submit New Report
          </h3>
          {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Work Summary
                </label>
                <textarea
                  value={workSummary}
                  onChange={(e) => setWorkSummary(e.target.value)}
                  placeholder="Describe your work..."
                  className="w-full border rounded-lg px-3 py-3 h-28 resize-none text-sm sm:text-base focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!workSummary.trim() || loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-lg shadow-md flex items-center justify-center font-semibold hover:scale-[1.02] disabled:opacity-50 text-sm sm:text-base"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>

        {/* Report History */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-md border overflow-hidden">
          {/* Sticky Filters */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b px-4 sm:px-8 py-4 sm:py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg sm:text-xl font-semibold">
              My Report History
            </h3>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-2 py-1 text-sm"
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
                className="border rounded-lg px-2 py-1 text-sm"
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
                className="border rounded-lg px-2 py-1 text-sm"
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reviewed By</th>
                  <th className="px-4 py-3">Comment</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                )}
                {!loading && currentReports.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-gray-500">
                      No reports found.
                    </td>
                  </tr>
                )}
                {!loading &&
                  currentReports.map((r) => (
                    <tr key={r.report_id || r.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                            r.frequency === "Daily"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {r.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-800">{r.content}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.reviewed_by ? r.reviewed_by : "--"}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {r.comment ? `${r.comment}` : "--"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden p-4 space-y-4">
            {loading && <p>Loading...</p>}
            {!loading && currentReports.length === 0 && (
              <p className="text-center text-gray-500 text-sm">No reports found.</p>
            )}
            {!loading &&
              currentReports.map((r) => (
                <div
                  key={r.report_id || r.id}
                  className="border rounded-xl p-4 hover:shadow-lg hover:bg-gray-50 transition"
                >
                  <div className="flex flex-wrap items-center justify-between mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                        r.frequency === "Daily"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {r.frequency}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-gray-800 text-sm mb-2">{r.content}</p>
                  <p className="text-xs text-gray-500 mb-1">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                  {r.reviewed_by && (
                    <p className="text-xs text-gray-700">
                      <b>Reviewed by:</b> {r.reviewed_by}
                    </p>
                  )}
                  {r.comment && (
                    <p className="text-xs text-gray-700">
                      <b>Comment:</b> {r.comment}
                    </p>
                  )}
                </div>
              ))}
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t flex items-center justify-between bg-gray-50">
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1 bg-white border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-white border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workreports;
