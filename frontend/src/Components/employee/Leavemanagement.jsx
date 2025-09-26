import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, ClipboardList, User, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

const EmployeeLeaveManagement = () => {
  const [form, setForm] = useState({
    userId: "",
    leaveType: "Casual",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [status, setStatus] = useState("");
  const [events, setEvents] = useState([]);
  const [leaveBalance,] = useState({
    Casual: 6,
    Sick: 4,
    Annual: 10,
  });

  const [myLeaves, setMyLeaves] = useState([]); // Store employee's applied leaves

  // Fetch employee leaves after applying or on mount
  const fetchMyLeaves = async (userId) => {
    if (!userId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/leaves/user/${userId}`);
      setMyLeaves(res.data);

      // Update calendar
      const formattedEvents = res.data.map((leave) => ({
        title: `${leave.leaveType} (${leave.status})`,
        start: leave.startDate,
        end: leave.endDate,
        color:
          leave.status === "Approved"
            ? "#16a34a" // green
            : leave.status === "Rejected"
            ? "#dc2626" // red
            : "#f59e0b", // yellow pending
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error("Error fetching employee leaves:", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/leaves/", {
        ...form,
        status: "Pending", // Default status until HR approves
      });

      setStatus("✅ Leave applied successfully!");
      fetchMyLeaves(form.userId); // Refresh leaves
    } catch (err) {
      console.error("Error:", err);
      setStatus("❌ Failed to apply leave.");
    }
  };

  useEffect(() => {
    if (form.userId) {
      fetchMyLeaves(form.userId);
    }
  }, [form.userId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Apply Leave Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white shadow-xl rounded-2xl p-8 border border-gray-100"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Apply for Leave
          </h2>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Employee ID */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <User className="w-4 h-4 mr-2 text-blue-500" /> Employee ID
              </label>
              <input
                type="text"
                name="userId"
                value={form.userId}
                onChange={handleChange}
                required
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="Enter your Employee ID"
              />
            </div>

            {/* Leave Type */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <ClipboardList className="w-4 h-4 mr-2 text-green-500" /> Leave Type
              </label>
              <select
                name="leaveType"
                value={form.leaveType}
                onChange={handleChange}
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-400 focus:outline-none"
              >
                <option value="Casual">Casual</option>
                <option value="Sick">Sick</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-purple-500" /> Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-red-500" /> End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  required
                  className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <FileText className="w-4 h-4 mr-2 text-indigo-500" /> Reason
              </label>
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                required
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                placeholder="Enter reason for leave"
                rows="3"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-6 rounded-lg font-semibold shadow-md hover:from-indigo-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-[1.02]"
            >
              Submit Leave Request
            </button>
          </form>

          {status && (
            <p
              className={`mt-6 text-center font-medium ${
                status.includes("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {status}
            </p>
          )}

          {/* Employee Leave History */}
          <div className="mt-10">
            <div className="space-y-4">
              {myLeaves.map((leave) => (
                <div
                  key={leave._id || leave.id}
                  className="p-4 bg-gray-50 rounded-lg border shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-700">
                      {leave.leaveType} Leave ({leave.startDate} → {leave.endDate})
                    </p>
                    <p className="text-sm text-gray-500">Reason: {leave.reason}</p>
                  </div>
                  <div>
                    {leave.status === "Approved" && (
                      <span className="flex items-center text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" /> Approved
                      </span>
                    )}
                    {leave.status === "Rejected" && (
                      <span className="flex items-center text-red-600 font-medium">
                        <XCircle className="w-4 h-4 mr-1" /> Rejected
                      </span>
                    )}
                    {leave.status === "Pending" && (
                      <span className="flex items-center text-yellow-600 font-medium">
                        <Clock className="w-4 h-4 mr-1" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right: Leave Balance + Calendar */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {/* Leave Balance */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Balance</h3>
            {Object.entries(leaveBalance).map(([type, days]) => (
              <div key={type} className="mb-4">
                <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
                  <span>{type} Leave</span>
                  <span>{days} days</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      type === "Casual"
                        ? "bg-blue-500"
                        : type === "Sick"
                        ? "bg-red-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${(days / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Leave Calendar */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Leave Calendar</h3>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              height="auto"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default EmployeeLeaveManagement;
