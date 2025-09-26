// src/Components/admin/LeaveManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle, XCircle, Search } from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const AdminLeaveManagementDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [leaveBalance, setLeaveBalance] = useState({
    Casual: 12,
    Sick: 8,
    Annual: 15,
  });

  // Fetch all leaves
  const fetchLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaves");
      setLeaves(res.data);
    } catch (err) {
      console.error("Error fetching leaves:", err);
    }
  };

  // Update leave status
  const handleUpdateStatus = async (id, status, leaveType) => {
    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}/status`, { status });

      // Deduct balance if final approved
      if (status === "Approved by Admin") {
        setLeaveBalance((prev) => ({
          ...prev,
          [leaveType]: prev[leaveType] > 0 ? prev[leaveType] - 1 : 0,
        }));
      }

      fetchLeaves();
    } catch (err) {
      console.error("Error updating leave:", err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  return (
    <div className="p-8  px-0 py-0 bg-gradient-to-br from-blue-400 via-white to-blue-50 min-h-screen">
        <header className="flex items-center justify-between py-5 bg-blue-900 mb-8 px-6">
          {/* Centered Title */}
          <div className="flex-grow text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white">
              Leave Management
            </h1>
          </div>
        </header>

      {/* 🔹 Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by employee or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none"
          />
        </div>
      </div>

      {/* 🔹 Leave Requests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {leaves
          .filter(
            (leave) =>
              ["Approved by HR", "Rejected by HR"].includes(leave.status) &&
              (leave.user_id?.toString().toLowerCase().includes(search.toLowerCase()) ||
                leave.leave_type?.toLowerCase().includes(search.toLowerCase()))
          )
          .map((leave) => (
            <div
              key={leave.id}
              className="bg-white rounded-2xl shadow-lg p-5 border hover:shadow-xl transition"
            >
              {/* Employee & Status */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {leave.user_id}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    leave.status.includes("Approved")
                      ? "bg-green-100 text-green-700"
                      : leave.status.includes("Rejected")
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {leave.status}
                </span>
              </div>

              {/* Leave Details */}
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {leave.leave_type}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">From:</span> {leave.start_date}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">To:</span> {leave.end_date}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Reason:</span> {leave.reason}
              </p>

              {/* Action Buttons */}
              {leave.status === "Approved by HR" ? (
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleUpdateStatus(leave.id, "Approved by Admin", leave.leave_type)
                    }
                    className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition"
                  >
                    <CheckCircle size={18} /> Final Approve
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateStatus(leave.id, "Rejected by Admin", leave.leave_type)
                    }
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              ) : (
                <span className="text-gray-400 text-sm">No further action</span>
              )}
            </div>
          ))}
      </div>

      {/* 🔹 Leave Balance + Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leave Balance */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Leave Balance
          </h3>
          <ul className="space-y-2">
            {Object.entries(leaveBalance).map(([type, balance]) => (
              <li
                key={type}
                className="flex justify-between text-gray-600 font-medium"
              >
                <span>{type} Leave</span>
                <span className="text-purple-600">{balance} days</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Calendar */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-lg border">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Leave Calendar
          </h3>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            height="400px"
            events={leaves
              .filter((l) => l.status === "Approved by Admin")
              .map((l) => ({
                title: `${l.user_id} - ${l.leave_type}`,
                start: l.start_date,
                end: l.end_date,
                color: "#8b5cf6",
              }))}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminLeaveManagementDashboard;
