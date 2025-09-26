import React, { useEffect, useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

const API_BASE =
  process.env.REACT_APP_API_BASE || "http://localhost:5000/api/users";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    position: "",
  });

  // ✅ Safe effect (doesn’t accidentally return a non-function)
  useEffect(() => {
    let isMounted = true; // guard for unmount
    const loadUsers = async () => {
      const data = await fetchUsers();
      if (isMounted) setUsers(data);
    };
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const normalizeUsers = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.users)) return payload.users;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/all`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return normalizeUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert("Error fetching users. Please try again later.");
      return [];
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", role: "", position: "" });
    setModalOpen(true);
  };

  const openEditUserModal = (user) => {
    if (!user) return;
    setEditingUser(user);
    setForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "",
      position: user.position || "",
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      };
      const userId =
        editingUser?._id || editingUser?.id || editingUser?.user_id;
      const url =
        editingUser && userId ? `${API_BASE}/${userId}` : `${API_BASE}/add`;
      const method = editingUser && userId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());

      setModalOpen(false);
      setUsers(await fetchUsers()); // refresh list
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Could not save user. Check console/network for details.");
    }
  };

  const deleteUser = async (userId) => {
    if (
      !userId ||
      !window.confirm("Are you sure you want to delete this user?")
    )
      return;
    try {
      const res = await fetch(`${API_BASE}/${userId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (!res.ok) throw new Error(await res.text());
      setUsers(await fetchUsers());
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Could not delete user.");
    }
  };

  const shareCredentials = async (userId) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/${userId}/share-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      alert(data.message || "Credentials shared successfully!");
    } catch (err) {
      console.error("Error sharing credentials:", err);
      alert("Could not share credentials. Please check server logs.");
    }
  };

  // Filtered users for search
  const q = filter.trim().toLowerCase();
  const filteredUsers = users.filter((user) =>
    [user?.name, user?.email, user?.role].some((f) =>
      String(f || "").toLowerCase().includes(q)
    )
  );

  // Stats from filtered users
  const stats = {
    total: filteredUsers.length,
    employees: filteredUsers.filter((u) => u.role === "employee").length,
    hr: filteredUsers.filter((u) => u.role === "hr").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-white to-blue-50 flex flex-col">
      {/* --- Header --- */}
      <header className="bg-blue-900 px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          User Management
        </h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employees..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={openAddUserModal}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center shadow-md transition"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Add Employee
          </button>
        </div>
      </header>

      {/* --- Stats Cards --- */}
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={stats.employees} color="blue" />
        <StatCard title="Total HR's" value={stats.hr} color="green" />
        <StatCard title="Total Members" value={stats.total} color="yellow" />
      </div>

      {/* --- Employee Table --- */}
      <main className="flex-1 px-6 pb-10">
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
          <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-medium text-gray-800">
              Employee Directory
            </h2>
            <span className="text-sm text-gray-500">
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "employee" : "employees"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto border-collapse">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <Th>ID</Th>
                  <Th>Employee</Th>
                  <Th>Role</Th>
                  <Th>Position</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user, index) => {
                  const userId = user._id || user.id || user.user_id;
                  return (
                    <tr
                      key={userId || index}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="py-4 px-4 text-center">
                        {userId || "N/A"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center capitalize">
                        {user.role}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {user.position}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => openEditUserModal(user)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          >
                            <PencilSquareIcon className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => shareCredentials(userId)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          >
                            <ShareIcon className="w-4 h-4" /> Send Email
                          </button>
                          <button
                            onClick={() => deleteUser(userId)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <TrashIcon className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-gray-500 text-sm"
                    >
                      {users.length === 0
                        ? "No employees added yet"
                        : "No employees found matching your search"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- Modal --- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleFormSubmit}
            className="bg-white w-full max-w-md rounded-xl shadow-xl transition-transform transform scale-100"
          >
            <div className="bg-blue-700 px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-semibold text-white">
                {editingUser ? "Edit Employee" : "Add New Employee"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                required
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Role"
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  options={["", "employee", "hr"]}
                />
                <Input
                  label="Position"
                  name="position"
                  value={form.position}
                  onChange={handleFormChange}
                />
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingUser ? "Update Employee" : "Add Employee"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* --- Reusable Components --- */
function StatCard({ title, value, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border flex justify-between items-center">
      <div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className={`${colorMap[color]} p-3 rounded-full font-bold text-lg`}>
        ●
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      />
    </div>
  );
}

function Select({ label, options = [], ...props }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        {...props}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "" ? "Select" : o}
          </option>
        ))}
      </select>
    </div>
  );
}

function Th({ children }) {
  return (
    <th className="py-3 px-4 text-xs font-medium uppercase tracking-wide text-gray-500 text-center">
      {children}
    </th>
  );
}
