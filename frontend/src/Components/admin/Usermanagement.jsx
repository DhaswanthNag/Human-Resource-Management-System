import React, { useCallback, useEffect, useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  UsersIcon,
  UserGroupIcon,
  UserIcon,
  XMarkIcon,
  CheckIcon,
  ClipboardDocumentIcon,
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
    <div className="flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden bg-gray-50 text-gray-800">
      {/* --- Header --- */}
      <header className="mx-auto flex w-full max-w-7xl flex-col items-stretch justify-between gap-5 px-4 py-6 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-yellow-400"></span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
              ADMINISTRATION
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            User Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Manage employee accounts, roles, positions, and account instructions.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
          <div className="relative w-full sm:min-w-0 sm:flex-1 md:w-72 md:flex-none">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-gray-700 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
            />
          </div>

          <button
            onClick={openAddUserModal}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200 sm:w-auto"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-md">
              <PlusIcon className="h-5 w-5 text-gray-900" />
            </span>
            Add Employee
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        {/* --- Stats Cards --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard title="Total Employees" value={stats.employees} color="blue" />
          <StatCard title="Total HR's" value={stats.hr} color="blue" />
          <StatCard title="Total Members" value={stats.total} color="yellow" />
        </div>
      </div>

      {/* --- Employee Table --- */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                <UsersIcon className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                  Employee Directory
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  View and manage registered accounts
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600">
              {filteredUsers.length} {filteredUsers.length === 1 ? "employee" : "employees"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-100">
                <tr>
                  <Th>ID</Th>
                  <Th>Employee</Th>
                  <Th>Role</Th>
                  <Th>Position</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user, index) => {
                  const userId = user._id || user.id || user.user_id;

                  return (
                    <tr key={userId || index} className="transition hover:bg-yellow-50/40">
                      <td className="max-w-36 break-all px-4 py-4 text-xs font-medium text-gray-500">
                        {userId || "N/A"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                            <UserIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="break-words font-semibold text-gray-900">
                              {user.name}
                            </div>
                            <div className="mt-1 break-all text-xs text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                          user.role === "admin"
                            ? "border-red-200 bg-red-50 text-red-500"
                            : user.role === "hr"
                            ? "border-orange-200 bg-orange-50 text-orange-500"
                            : "border-blue-200 bg-blue-50 text-blue-500"
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-600">
                        {user.position || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditUserModal(user)}
                            title="Edit employee"
                            aria-label="Edit employee"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-yellow-600 transition hover:bg-yellow-50"
                          >
                            <PencilSquareIcon className="h-4 w-4 text-yellow-500" />
                            Edit
                          </button>

                          <button
                            onClick={() => shareCredentials(userId)}
                            title="Send account instructions"
                            aria-label="Send account instructions"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                          >
                            <EnvelopeIcon className="h-4 w-4 text-green-600" />
                            Email
                          </button>

                          <button
                            onClick={() => deleteUser(userId)}
                            title="Delete employee"
                            aria-label="Delete employee"
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                        <MagnifyingGlassIcon className="h-7 w-7 text-gray-400" />
                      </div>
                      <p className="mt-4 font-semibold text-gray-800">
                        {users.length === 0
                          ? "No employees added yet"
                          : "No employees found matching your search"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {users.length === 0
                          ? "Add an employee to get started."
                          : "Try searching with a different name, email, or role."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>Showing {filteredUsers.length} of {users.length} users</span>
            <span>Manage accounts securely through the admin panel</span>
          </div>
        </div>
      </main>

      {/* --- Modal --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/60 p-3 backdrop-blur-sm sm:p-5">
          <form
            onSubmit={handleFormSubmit}
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 bg-gray-800 px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-300">
                  User Administration
                </p>
                <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
                  {editingUser ? "Edit Employee" : "Add New Employee"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-600 transition hover:bg-gray-100"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <Input label="Full Name" name="name" value={form.name} onChange={handleFormChange} required />
              <Input label="Email" type="email" name="email" value={form.email} onChange={handleFormChange} required />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200"
              >
                <PlusIcon className="h-4 w-4" />
                {editingUser ? "Update Employee" : "Add Employee"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- Newly Created User Credentials Modal --- */}
      {credentials && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-gray-950/70 p-3 backdrop-blur-sm sm:p-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="credentials-modal-title"
            className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            <div className="bg-gray-800 px-5 py-5 text-white sm:px-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <h2 id="credentials-modal-title" className="text-xl font-bold">
                User Created Successfully
              </h2>
              <p className="mt-1 text-sm text-gray-300">
                Nexora Technology Solutions Private Limited
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">
                Save these credentials now. The temporary password
                will not be displayed again after you close this window.
              </div>

              <div>
                <label htmlFor="new-user-id" className="mb-2 block text-sm font-semibold text-gray-700">
                  User ID
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="new-user-id"
                    type="text"
                    readOnly
                    value={credentials.userId}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />

                  <button
                    type="button"
                    onClick={() => copyToClipboard(credentials.userId, "User ID")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 text-gray-600" />
                    Copy ID
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new-user-password" className="mb-2 block text-sm font-semibold text-gray-700">
                  Temporary Password
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="new-user-password"
                    type="text"
                    readOnly
                    value={credentials.temporaryPassword}
                    onFocus={(e) => e.target.select()}
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(credentials.temporaryPassword, "Password")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 text-gray-600" />
                    Copy Password
                  </button>
                </div>
              </div>

              {copyMessage && (
                <p role="status" className="rounded-lg bg-gray-50 p-3 text-sm font-medium text-green-700">
                  {copyMessage}
                </p>
              )}

              <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={copyAllCredentials}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-900 transition hover:bg-yellow-300 focus:outline-none focus:ring-4 focus:ring-yellow-200"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                  Copy All Credentials
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCredentials(null);
                    setCopyMessage("");
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
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
    blue: "text-gray-800",
    green: "text-green-600",
    yellow: "text-yellow-600",
  };

  const Icon =
    color === "blue"
      ? UsersIcon
      : color === "yellow"
      ? UserGroupIcon
      : UserIcon;

  return (
    <div className="group flex min-w-0 items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-yellow-300 hover:shadow-md sm:p-6">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
        <p className="mt-1 text-xs text-gray-500">Based on current search results</p>
      </div>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-50">
        <Icon className={`h-6 w-6 ${colorMap[color]}`} />
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label htmlFor={props.id || props.name} className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      <input
        {...props}
        id={props.id || props.name}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
      />
    </div>
  );
}

function Select({ label, options = [], ...props }) {
  return (
    <div>
      <label htmlFor={props.id || props.name} className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      <select
        {...props}
        id={props.id || props.name}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100"
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
    <th className="whitespace-nowrap px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
      {children}
    </th>
  );
}
