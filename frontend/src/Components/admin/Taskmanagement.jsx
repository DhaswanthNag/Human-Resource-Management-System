import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const statusColors = {
  Completed: "bg-green-100 text-green-900 border-green-300",
  "In Progress": "bg-yellow-100 text-yellow-900 border-yellow-300",
  Pending: "bg-red-100 text-red-900 border-red-300",
};

const AdminTaskAssignment = () => {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", assigned_to: "" });
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.assigned_to) return;

    try {
      if (editingTask) {
        await axios.put(`${API_URL}/api/tasks/${editingTask.id}`, {
          ...form,
          status: editingTask.status,
        });
        setEditingTask(null);
      } else {
        await axios.post(`${API_URL}/api/tasks`, {
          ...form,
          status: "Pending",
        });
      }
      setForm({ title: "", description: "", assigned_to: "" });
      fetchTasks();
    } catch (error) {
      console.error("Failed to create/update task", error);
    }
  };

  const handleEdit = (task) => {
    setForm({ title: task.title, description: task.description, assigned_to: task.assigned_to });
    setEditingTask(task);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`${API_URL}/api/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      console.error("Failed to delete task", error);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  let filteredTasks = filter === "All" ? tasks : tasks.filter((t) => t.status === filter);

  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term) ||
        task.assigned_to.toLowerCase().includes(term) ||
        formatDate(task.created_at).includes(term)
    );
  }

  const stats = {
    Completed: tasks.filter((t) => t.status === "Completed").length,
    "In Progress": tasks.filter((t) => t.status === "In Progress").length,
    Pending: tasks.filter((t) => t.status === "Pending").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-0 px-0 mr-6">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-xs p-2 mb-6 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300"
        />
      <div className="max-w-8xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(stats).map(([label, count]) => (
          <div
            key={label}
            className={`p-6 rounded-2xl shadow-md border flex flex-col items-center ${statusColors[label]}`}
          >
            <div className="text-xl font-semibold mb-2">{label}</div>
            <div className="text-4xl font-bold">{count}</div>
          </div>
        ))}
      </div>
      <div className="max-w-screen mx-auto flex flex-col lg:flex-row gap-10">
        {/* Task Form */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-7 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-700 mb-5">
            {editingTask ? "Edit Task" : "Assign a New Task"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300"
              required
            />
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300"
              required
            />
            <input
              type="text"
              name="assigned_to"
              placeholder="Assign To (employee ID)"
              value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              className="w-full border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500  transition duration-300"
              required
            />
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-800 transition"
            >
              {editingTask ? "Update Task" : "Create Task"}
            </button>
          </form>
        </div>
        {/* Task List */}
        <div className="flex-1">
          <div className="flex gap-3 mb-6">
            {["All", "Pending", "In Progress", "Completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full border text-sm font-medium shadow transition ${
                  filter === f
                    ? "bg-gray-600 text-white border-gray-700 scale-105"
                    : "bg-gray-100 text-gray-800 border-transparent hover:border-indigo-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {loading ? (
            <div className="text-gray-500 py-10 text-center">Loading tasks...</div>
          ) : filteredTasks.length > 0 ? (
            <div className="space-y-5">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white flex flex-col md:flex-row justify-between md:items-center gap-2 border rounded-xl shadow-sm hover:shadow-lg p-4 transition"
                >
                  <div>
                    <div className="text-lg font-medium">
                      {task.title} <span className="text-indigo-600 text-sm font-semibold">— {task.assigned_to}</span>
                    </div>
                    <div className="text-gray-500 text-sm">{task.description}</div>
                    <div className="text-xs text-gray-400 my-1">{formatDate(task.created_at)}</div>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${statusColors[task.status]}`}
                    >
                      {task.status}
                    </span>
                    <button
                      onClick={() => handleEdit(task)}
                      className="px-3 py-1 text-sm bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">No tasks found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTaskAssignment;
