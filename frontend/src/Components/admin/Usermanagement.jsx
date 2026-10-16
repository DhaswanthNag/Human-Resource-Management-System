
import React, { useCallback, useEffect, useState } from "react";

import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api/users";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "", position: "" });

  // State for copying and displaying newly created user credentials
  const [credentials, setCredentials] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  const getAuthHeader = () => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("token");

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getErrorMessage = async (res) => {
    const text = await res.text();

    if (!text) return `Request failed with status ${res.status}`;

    try {
      const data = JSON.parse(text);
      return data.message || data.error || text;
    } catch {
      return text;
    }
  };

  const normalizeUsers = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.users)) return payload.users;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/all`, {
        headers: getAuthHeader()
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res));
      }

      const data = await res.json();
      return normalizeUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      alert(`Error fetching users: ${err.message}`);
      return [];
    }
  }, []);

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
  }, [fetchUsers]);

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
      position: user.position || ""
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Copy credentials to clipboard
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(String(text));

      setCopyMessage(`${label} copied successfully!`);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      setCopyMessage(
        "Automatic copying failed. Select the text and press Ctrl+C."
      );
    }
  };

  // Copy all newly created user credentials
  const copyAllCredentials = async () => {
    if (!credentials) return;

    const text =
      `Nexora Technology Solutions Private Limited\n` +
      `HRMS Account Credentials\n\n` +
      `User ID: ${credentials.userId}\n` +
      `Temporary Password: ${credentials.temporaryPassword}\n\n` +
      `Please save these credentials securely.`;

    await copyToClipboard(text, "All credentials");
  };

  // Send account instructions using the existing backend endpoint.
  const sendAccountEmail = async (userId) => {
    if (!userId) {
      throw new Error("The user ID is missing. Unable to send the email.");
    }

    const res = await fetch(
      `${API_BASE}/${encodeURIComponent(userId)}/share-credentials`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader()
        }
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        data.message ||
        data.error ||
        "Unable to send account instructions."
      );
    }

    return data;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeader()
      };

      const userId = editingUser?._id || editingUser?.id || editingUser?.user_id;
      const url =
        editingUser && userId
          ? `${API_BASE}/${encodeURIComponent(userId)}`
          : `${API_BASE}/add`;

      const method = editingUser && userId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(form)
      });

      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          responseData.message ||
          responseData.error ||
          `Unable to save user (${res.status})`
        );
      }

      setModalOpen(false);
      setUsers(await fetchUsers()); // refresh list

      if (!editingUser) {
        const createdUserId =
          responseData.user_id ||
          responseData.userId ||
          responseData._id ||
          responseData.id;

        if (responseData.temporaryPassword) {
          setCredentials({
            userId:
              createdUserId ||
              "Check the User Management table",
            temporaryPassword: responseData.temporaryPassword,
          });
          setCopyMessage("");
        }

        // Automatically send account instructions after creating the user.
        if (createdUserId) {
          try {
            const emailData = await sendAccountEmail(createdUserId);

            alert(
              `User created successfully.\n\n` +
              `${emailData.message || "Account instructions sent successfully."}`
            );
          } catch (emailError) {
            console.error("Employee email error:", emailError);

            alert(
              "User created successfully, but the email could not be sent.\n\n" +
              `${emailError.message}\n\n` +
              "You can retry using the Send Email action in the employee table."
            );
          }
        } else {
          alert(
            "User created successfully, but the server did not return a user ID. " +
            "Automatic email sending was skipped."
          );
        }
      } else {
        alert("User updated successfully.");
      }
    } catch (err) {
      console.error("Error saving user:", err);
      alert(err.message || "Could not save user. Check console/network for details.");
    }
  };

  const deleteUser = async (userId) => {
    if (!userId || !window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: getAuthHeader()
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res));
      }

      setUsers(await fetchUsers());
      alert("User deleted successfully.");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(`Could not delete user: ${err.message}`);
    }
  };

  const shareCredentials = async (userId) => {
    if (!userId) return;

    try {
      const data = await sendAccountEmail(userId);
      alert(data.message || "Account instructions sent successfully!");
    } catch (err) {
      console.error("Error sharing credentials:", err);
      alert(err.message || "Could not share credentials. Please check server logs.");
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* --- Header --- */}
      <header className="px-6 py-5 mr-4 ml-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-700">User Management</h1>

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
            className="bg-gray-600 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg flex items-center justify-center shadow-md transition"
          >
            <PlusIcon className="w-5 h-5 mr-2" /> Add Employee
          </button>
        </div>
      </header>

      {/* --- Stats Cards --- */}
      <div className="px-6 py-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
        <StatCard title="Total Employees" value={stats.employees} color="blue" />
        <StatCard title="Total HR's" value={stats.hr} color="green" />
        <StatCard title="Total Members" value={stats.total} color="yellow" />
      </div>

      {/* --- Employee Table --- */}
      <main className="flex-1 px-6 pb-10">
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
          <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-medium text-gray-800">Employee Directory</h2>
            <span className="text-sm text-gray-500">
              {filteredUsers.length} {filteredUsers.length === 1 ? "employee" : "employees"}
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
                    <tr key={userId || index} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-4 text-center">{userId || "N/A"}</td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>

                      <td className="py-4 px-4 text-center capitalize">{user.role}</td>
                      <td className="py-4 px-4 text-center">{user.position}</td>

                      <td className="py-4 px-4">
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => openEditUserModal(user)}
                            className="text-yellow-500 hover:text-yellow-600 flex items-center gap-1"
                          >
                            <PencilSquareIcon className="w-4 h-4" /> Edit
                          </button>

                          <button
                            onClick={() => shareCredentials(userId)}
                            className="text-green-500 hover:text-green-700 flex items-center gap-1"
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
                    <td colSpan={5} className="py-6 text-center text-gray-500 text-sm">
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
            <div className="bg-gray-700 px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-semibold text-white">
                {editingUser ? "Edit Employee" : "Add New Employee"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <Input label="Full Name" name="name" value={form.name} onChange={handleFormChange} required />
              <Input label="Email" type="email" name="email" value={form.email} onChange={handleFormChange} required />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Role"
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  options={["", "employee", "hr"]}
                  required
                />
                <Input label="Position" name="position" value={form.position} onChange={handleFormChange} required />
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
                className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
              >
                {editingUser ? "Update Employee" : "Add Employee"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- Newly Created User Credentials Modal --- */}
      {credentials && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="credentials-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="rounded-t-2xl bg-gray-800 px-6 py-5 text-white">
              <h2 id="credentials-modal-title" className="text-xl font-bold">
                User Created Successfully
              </h2>
              <p className="mt-1 text-sm text-gray-300">
                Nexora Technology Solutions Private Limited
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Save these credentials now. The temporary password
                will not be displayed again after you close this window.
              </div>

              <div>
                <label htmlFor="new-user-id" className="mb-2 block text-sm font-semibold text-gray-700">
                  User ID
                </label>

                <div className="flex gap-2">
                  <input
                    id="new-user-id"
                    type="text"
                    readOnly
                    value={credentials.userId}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.userId, "User ID")}
                    className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Copy ID
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-user-password" className="mb-2 block text-sm font-semibold text-gray-700">
                  Temporary Password
                </label>

                <div className="flex gap-2">
                  <input
                    id="new-user-password"
                    type="text"
                    readOnly
                    value={credentials.temporaryPassword}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(credentials.temporaryPassword, "Password")
                    }
                    className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Copy Password
                  </button>
                </div>
              </div>

              {copyMessage && (
                <p role="status" className="text-sm font-medium text-green-700">
                  {copyMessage}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="button"
                  onClick={copyAllCredentials}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                >
                  Copy All Credentials
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCredentials(null);
                    setCopyMessage("");
                  }}
                  className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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
      <div className={`${colorMap[color]} p-3 rounded-full font-bold text-lg`}>●</div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-md border focus:outline-none focus:ring-2 focus:ring-yellow-500 transition duration-300 text-sm"
      />
    </div>
  );
}

function Select({ label, options = [], ...props }) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">{label}</label>
      <select
        {...props}
        className="w-full px-4 py-2.5 rounded-md border focus:ring-1 focus:ring-yellow-600 focus:border-yellow-500 text-sm"
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
