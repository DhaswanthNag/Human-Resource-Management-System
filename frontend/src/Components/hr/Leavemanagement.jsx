// src/Components/hr/LeaveManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

const HRLeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState({});

  // Fetch all leaves
  const fetchLeaves = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leaves");
      setLeaves(res.data);
    } catch (err) {
      console.error("Error fetching leaves:", err);
    } finally {
      setLoading(false);
    }
  };

  // Update leave status by HR
  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/leaves/${id}/status`, {
        status,
      });
      fetchLeaves(); // Refresh after update
    } catch (err) {
      console.error("Error updating leave:", err);
    }
  };

  // Calculate leave balances
  const calculateLeaveBalances = () => {
    const balances = {};
    leaves.forEach((leave) => {
      if (leave.status.includes("Approved")) {
        const days =
          moment(leave.end_date).diff(moment(leave.start_date), "days") + 1;
        if (!balances[leave.user_id]) {
          balances[leave.user_id] = { Annual: 20, Casual: 10, Sick: 8 };
        }
        if (balances[leave.user_id][leave.leave_type] !== undefined) {
          balances[leave.user_id][leave.leave_type] -= days;
        }
      }
    });
    setLeaveBalance(balances);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (leaves.length > 0) {
      calculateLeaveBalances();
    }
  }, [leaves]);

  // Prepare events for calendar
  const events = leaves
    .filter((leave) => leave.status.includes("Approved"))
    .map((leave) => ({
      title: `${leave.user_id} - ${leave.leave_type}`,
      start: new Date(leave.start_date),
      end: new Date(leave.end_date),
      allDay: true,
    }));

  return (
    <div className="p-8 bg-gradient-to-br from-blue-400 via-white to-blue-50 min-h-screen px-0 py-0 space-y-12">
        <header className="flex items-center justify-between py-5 bg-blue-900 mb-8 px-6">
          {/* Centered Title */}
          <div className="flex-grow text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white">
              Leave Management
            </h1>
          </div>
        </header>

      {/* Leave Approval Section */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">
          Pending Leave Requests
        </h3>
        {loading ? (
          <p className="text-gray-600">Loading leave requests...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
            <table className="w-full border-collapse">
              <thead className="bg-blue-100 text-blue-700">
                <tr>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Employee</th>
                  <th className="border p-3 text-left">Leave Type</th>
                  <th className="border p-3 text-left">Start Date</th>
                  <th className="border p-3 text-left">End Date</th>
                  <th className="border p-3 text-left">Reason</th>
                  <th className="border p-3 text-center">HR Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves
                  .filter((leave) => leave.status === "Pending")
                  .map((leave) => (
                    <tr
                      key={leave.id}
                      className="hover:bg-gray-50 transition duration-200"
                    >
                      <td className="border p-3">{leave.id}</td>
                      <td className="border p-3">{leave.user_id}</td>
                      <td className="border p-3">{leave.leave_type}</td>
                      <td className="border p-3">{leave.start_date}</td>
                      <td className="border p-3">{leave.end_date}</td>
                      <td className="border p-3">{leave.reason}</td>
                      <td className="border p-3 text-center">
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() =>
                              handleUpdateStatus(leave.id, "Approved by HR")
                            }
                            className="bg-green-500 text-white px-4 py-1 rounded-lg shadow hover:bg-green-600 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(leave.id, "Rejected by HR")
                            }
                            className="bg-red-500 text-white px-4 py-1 rounded-lg shadow hover:bg-red-600 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {leaves.filter((leave) => leave.status === "Pending").length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="text-center text-gray-500 py-6 italic"
                    >
                      No pending leave requests.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Leave Balance Tracking */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">
          Leave Balance Tracking
        </h3>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
          <table className="w-full border-collapse">
            <thead className="bg-green-100 text-green-700">
              <tr>
                <th className="border p-3 text-left">Employee</th>
                <th className="border p-3 text-left">Annual</th>
                <th className="border p-3 text-left">Casual</th>
                <th className="border p-3 text-left">Sick</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(leaveBalance).length > 0 ? (
                Object.entries(leaveBalance).map(([user, balances]) => (
                  <tr key={user} className="hover:bg-gray-50">
                    <td className="border p-3 font-medium text-gray-800">
                      {user}
                    </td>
                    <td className="border p-3 text-gray-700">
                      {balances.Annual}
                    </td>
                    <td className="border p-3 text-gray-700">
                      {balances.Casual}
                    </td>
                    <td className="border p-3 text-gray-700">
                      {balances.Sick}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center text-gray-500 py-6 italic"
                  >
                    No balances to show yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leave Calendar */}
      <section>
        <h3 className="text-2xl font-semibold mb-4 text-gray-700">
          Leave Calendar
        </h3>
        <div className="bg-white rounded-xl shadow-lg p-4 border">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            className="rounded-lg"
          />
        </div>
      </section>
    </div>
  );
};

export default HRLeaveManagement;
