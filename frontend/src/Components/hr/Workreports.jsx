// src/Components/hr/HrWorkReports.jsx
import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { workReportsApi } from "../../api/workreportsApi";

const HRWorkReports = () => {
  const loggedInHRId = "HR001"; // Static HR ID

  const [reports, setReports] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [hrWorkSummary, setHrWorkSummary] = useState("");
  const [hrReportType, setHrReportType] = useState("Daily");
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 10;

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await workReportsApi.getAll();
      const data = Array.isArray(res) ? res : res?.data || [];
      setReports(data);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleHRSubmit = async (e) => {
    e.preventDefault();
    if (!hrWorkSummary.trim()) return;
    setSubmitting(true);
    try {
      const result = await workReportsApi.submit({
        content: hrWorkSummary.trim(),
        frequency: hrReportType,
        role: "HR",
        user_id: loggedInHRId,
      });
      const newReport = result?.data || result;
      setReports((prev) => [newReport, ...prev]);
      setHrWorkSummary("");
    } catch (err) {
      setError(err.message || "Failed to submit HR report");
    } finally {
      setSubmitting(false);
    }
  };

  const normalizeStatus = (status) => {
    if (!status) return ["Pending"];
    return Array.isArray(status) ? status : [status];
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  // Filters
  const filteredReports = reports
    .filter((r) =>
      String(r.report_id || "").toLowerCase().includes(searchId.toLowerCase())
    )
    .filter(
      (r) =>
        filterType === "All" ||
        r.frequency?.toLowerCase() === filterType.toLowerCase()
    )
    .filter((r) => {
      if (filterStatus === "All") return true;
      const statuses = normalizeStatus(r.status);
      return statuses.some((s) => s === filterStatus);
    })
    .filter((r) => {
      if (!filterDate) return true;
      const reportDate = new Date(r.created_at).toISOString().split("T")[0];
      return reportDate === filterDate;
    });

  // Pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(
    indexOfFirstReport,
    indexOfLastReport
  );
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 py-0 px-0 mr-6">
      <div className="max-w-screen mx-auto space-y-8">
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow-sm text-sm">
            {error}
          </div>
        )}

        {/* HR Report Submit */}
        <div className="bg-white rounded-xl shadow-md border p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">
            Submit HR Report
          </h2>
          <form onSubmit={handleHRSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Report Type
                </label>
                <select
                  value={hrReportType}
                  onChange={(e) => setHrReportType(e.target.value)}
                  className="w-full mt-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-500"
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-600">
                  Work Summary
                </label>
                <textarea
                  value={hrWorkSummary}
                  onChange={(e) => setHrWorkSummary(e.target.value)}
                  placeholder="Describe your work..."
                  className="w-full mt-1 border rounded-lg px-3 py-2 h-24 resize-none text-sm focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!hrWorkSummary.trim() || submitting}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="sticky top-0 z-20 bg-white p-3 rounded-xl shadow border flex flex-col sm:flex-row gap-3">
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

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-md border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-600 text-white text-xs">
                <tr>
                  <th className="px-4 py-3">Report ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date/Time</th>
                  <th className="px-4 py-3">Comment</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-white-500">
                      Loading...
                    </td>
                  </tr>
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-white-500">
                      No Reports Found
                    </td>
                  </tr>
                ) : (
                  currentReports.map((r, idx) => {
                    const statuses = normalizeStatus(r.status);

                    return (
                      <tr
                        key={r._id || idx}
                        className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="px-4 py-3">{r.report_id}</td>
                        <td className="px-4 py-3">{r.frequency}</td>
                        <td className="px-4 py-3">{r.content}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              r.status === "Reviewed"
                                ? "bg-green-100 text-green-700"
                                : r.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {statuses.join(", ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white-600">
                          {formatDateTime(r.created_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-white-700">
                          {r.comment ? (
                            <div className="bg-white-100 px-2 py-1 rounded">
                              <b>
                                {r.commented_by_role === 'admin' ? 'Admin' :
                                r.commented_by_role === 'hr' ? 'HR' :
                                r.commented_by_role || 'User'}:
                              </b> {r.comment}
                            </div>
                          ) : (
                            <span className="text-white-200">No comment</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 text-sm"
            >
              Prev
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white-200 rounded disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRWorkReports;