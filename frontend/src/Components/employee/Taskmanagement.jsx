import React, { useState, useEffect } from "react";
import axios from "axios";

function EmployeeTaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/tasks");
      setTasks(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tasks", err);
      setLoading(false);
    }
  };

  // Update task status (send full task object with updated status)
  const handleStatusChange = async (id, newStatus, assignedTo) => {
    try {
      const originalTask = tasks.find((task) => task.id === id);
      if (!originalTask) return;

      const updatedTask = { ...originalTask, status: newStatus, assigned_to: assignedTo };

      await axios.put(`http://localhost:5000/api/tasks/${id}`, updatedTask);

      // Refresh tasks after update
      fetchTasks();
    } catch (err) {
      console.error("Error updating task", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Count statuses across ALL tasks
  const statusCount = (status) =>
    tasks.filter((task) => task.status === status).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-white to-blue-50 py-0 px-0">
      <header className="flex items-center justify-between py-5 bg-blue-900 mb-8 px-6">
          {/* Centered Title */}
          <div className="flex-grow text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white">
             Employee Task Management 
            </h1>
          </div>
        </header>
      {/* Status Overview - All Tasks */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-green-100 p-6 rounded-xl text-center shadow">
          <h3 className="text-lg font-semibold text-green-700">Completed</h3>
          <p className="text-3xl font-bold text-green-700">
            {statusCount("Completed")}
          </p>
        </div>
        <div className="bg-yellow-100 p-6 rounded-xl text-center shadow">
          <h3 className="text-lg font-semibold text-yellow-700">In Progress</h3>
          <p className="text-3xl font-bold text-yellow-700">
            {statusCount("In Progress")}
          </p>
        </div>
        <div className="bg-red-100 p-6 rounded-xl text-center shadow">
          <h3 className="text-lg font-semibold text-red-700">Pending</h3>
          <p className="text-3xl font-bold text-red-700">
            {statusCount("Pending")}
          </p>
        </div>
      </div>
      {/* Task List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Tasks</h2>
        {loading ? (
          <p>Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500">No tasks available.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white shadow p-5 rounded-lg border"
              >
                <div className="flex justify-between items-center">
                  <strong className="text-lg">{task.title}</strong>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      task.status === "Completed"
                        ? "bg-green-200 text-green-800"
                        : task.status === "In Progress"
                        ? "bg-yellow-200 text-yellow-800"
                        : "bg-red-200 text-red-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{task.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Assigned To: {task.assigned_to}
                </p>
                {/* Allow update for EVERY task */}
                <div className="mt-3">
                  <label className="mr-2 text-sm font-medium">Update Status:</label>
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value, task.assigned_to)
                    }
                    className="px-3 py-1 border rounded-md"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeTaskManagement;
