import React, { useState, useEffect, useCallback } from "react";
import {
  UserRound,
  Users,
  UserPlus,
  CalendarDays,
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  X,
  Mail,
  BriefcaseBusiness,
  ClipboardList,
  AlertCircle,
  CheckCircle,
  // Clock,
  UserCheck,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_URL || "http://localhost:5000";
const STATUSES = ["Applied", "Screening", "Interview", "Offered", "Hired", "Rejected"];
const INITIAL_FORM = {
  id: null,
  name: "",
  email: "",
  position: "",
  status: "Applied",
  assignedTo: "",
  assignedHrUserId: "",
  interviewDate: "",
};

const getAuthConfig = () => {
  const token = localStorage.getItem("token");
  return {
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  };
};

const CandidateManagement = () => {
  const [candidates, setCandidates] = useState([]);
  const [hrUsers, setHrUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const mapCandidate = (candidate) => ({
    id: candidate.candidate_id ?? candidate.id,
    candidateCode: candidate.candidate_code || candidate.candidateCode || `candidate${String(candidate.candidate_id ?? candidate.id ?? "").padStart(3, "0")}`,
    name: candidate.name || "",
    email: candidate.email || "",
    position: candidate.job_applied || candidate.position || "",
    status: candidate.status || "Applied",
    assignedTo: candidate.assigned_to || candidate.assignedTo || "",
    assignedHrUserId: candidate.assigned_hr_user_id || candidate.assignedHrUserId || "",
    assignedHrName: candidate.assigned_hr_name || candidate.assignedHrName || "",
    interviewDate: candidate.interview_date
      ? String(candidate.interview_date).slice(0, 10)
      : candidate.interviewDate
      ? String(candidate.interviewDate).slice(0, 10)
      : "",
  });

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/candidates`,
        getAuthConfig()
      );
      setCandidates(
        (Array.isArray(response.data) ? response.data : []).map(mapCandidate)
      );
    } catch (err) {
      console.error("Error fetching candidates:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to load candidates. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    const fetchHRUsers = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users/interviewers`,
          getAuthConfig()
        );
        const users = Array.isArray(response.data.users)
          ? response.data.users
          : [];
        setHrUsers(
          users.filter(
            (user) => user.role?.trim().toLowerCase() === "hr"
          )
        );
      } catch (err) {
        console.error("Error fetching HR users:", err);
        setHrUsers([]);
      }
    };

    fetchHRUsers();
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !saving) closeModal();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [saving]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError(null);
  };

  const openAddModal = () => {
    setFormData({ ...INITIAL_FORM });
    setError(null);
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleEdit = (candidate) => {
    setFormData({ ...INITIAL_FORM, ...candidate });
    setError(null);
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ ...INITIAL_FORM });
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage("");

    const apiPayload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      jobApplied: formData.position.trim(),
      position: formData.position.trim(),
      status: formData.status,
      assignedTo: formData.assignedTo || null,
      assignedHrUserId: formData.assignedHrUserId || null,
      interviewDate: formData.interviewDate || null,
    };

    setSaving(true);
    try {
      if (formData.id) {
        const response = await axios.put(
          `${API_BASE_URL}/api/candidates/${formData.id}`,
          apiPayload,
          getAuthConfig()
        );
        const updatedCandidate = mapCandidate(response.data);
        setCandidates((previous) =>
          previous.map((candidate) =>
            String(candidate.id) === String(formData.id)
              ? updatedCandidate
              : candidate
          )
        );
        setSuccessMessage("Candidate updated successfully.");
      } else {
        const response = await axios.post(
          `${API_BASE_URL}/api/candidates`,
          apiPayload,
          getAuthConfig()
        );
        setCandidates((previous) => [mapCandidate(response.data), ...previous]);
        setSuccessMessage("Candidate added successfully.");
      }
      setIsModalOpen(false);
      setFormData({ ...INITIAL_FORM });
      await fetchCandidates();
    } catch (err) {
      console.error("Error saving candidate:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to save candidate. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (candidate) => {
    const confirmed = window.confirm(`Delete candidate "${candidate.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setError(null);
    setSuccessMessage("");
    setDeletingId(candidate.id);
    try {
      await axios.delete(
        `${API_BASE_URL}/api/candidates/${candidate.id}`,
        getAuthConfig()
      );
      setCandidates((previous) =>
        previous.filter((item) => String(item.id) !== String(candidate.id))
      );
      setSuccessMessage("Candidate deleted successfully.");
    } catch (err) {
      console.error("Error deleting candidate:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to delete candidate. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getHRDisplayName = (candidate) => {
    const assignedHR = hrUsers.find(
      (user) => String(user.user_id) === String(candidate.assignedHrUserId)
    );

    if (assignedHR) {
      return `${assignedHR.name} (${assignedHR.user_id})`;
    }

    if (candidate.assignedHrName && candidate.assignedHrUserId) {
      return `${candidate.assignedHrName} (${candidate.assignedHrUserId})`;
    }

    return candidate.assignedHrUserId || "Unassigned";
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      [
        candidate.name,
        candidate.email,
        candidate.position,
        candidate.assignedTo,
        candidate.assignedHrUserId,
        getHRDisplayName(candidate),
        candidate.candidateCode,
        String(candidate.id),
      ].some((value) => String(value || "").toLowerCase().includes(term));
    const matchesStatus = statusFilter === "All" || candidate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = STATUSES.reduce((counts, status) => {
    counts[status] = candidates.filter((candidate) => candidate.status === status).length;
    return counts;
  }, {});

  const getStatusStyle = (status) => {
    switch (status) {
      case "Applied":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "Screening":
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
      case "Interview":
        return "border-purple-200 bg-purple-50 text-purple-700";
      case "Offered":
      case "Hired":
        return "border-green-200 bg-green-50 text-green-700";
      case "Rejected":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-gray-200 bg-gray-100 text-gray-600";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not scheduled";
    const parsed = new Date(`${String(date).slice(0, 10)}T00:00:00`);
    return Number.isNaN(parsed.getTime())
      ? String(date)
      : parsed.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
  };

  const inputClass =
    "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-100";

  const renderStatus = (status) => (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusStyle(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || "Applied"}
    </span>
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 p-4 sm:p-6 md:p-8">
      <header className="mb-6 mt-2 sm:mb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1 w-9 shrink-0 rounded-full bg-yellow-400" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">
                RECRUITMENT & TALENT ACQUISITION
              </span>
            </div>
            <h1 className="break-words text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Candidate Management
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Manage applicants, track recruitment progress, schedule interviews, and assign candidates.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={fetchCandidates}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-yellow-300 hover:bg-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2"
            >
              <Plus size={18} />
              Add Candidate
            </button>
          </div>
        </div>
      </header>

      {error && !isModalOpen && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:items-center">
          <AlertCircle size={19} className="mt-0.5 shrink-0 sm:mt-0" />
          <span className="min-w-0 flex-1 break-words">{error}</span>
          <button type="button" onClick={fetchCandidates} className="shrink-0 font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <span className="min-w-0 flex-1 break-words">{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage("")} className="font-semibold" aria-label="Dismiss message">
            <X size={17} />
          </button>
        </div>
      )}

      {/* Overview cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:mb-8">
        {[
          {
            label: "Total Candidates",
            value: candidates.length,
            description: "Applicants in recruitment",
            icon: Users,
            iconStyle: "bg-gray-100 text-gray-700",
            barStyle: "bg-gray-700",
            progress: 100,
          },
          {
            label: "In Screening",
            value: statusCounts.Screening,
            description: "Under initial review",
            icon: ClipboardList,
            iconStyle: "bg-yellow-100 text-yellow-800",
            barStyle: "bg-yellow-400",
            progress: candidates.length ? (statusCounts.Screening / candidates.length) * 100 : 0,
          },
          {
            label: "Interviews",
            value: statusCounts.Interview,
            description: "Candidates in interview stage",
            icon: CalendarDays,
            iconStyle: "bg-gray-100 text-gray-700",
            barStyle: "bg-gray-400",
            progress: candidates.length ? (statusCounts.Interview / candidates.length) * 100 : 0,
          },
          {
            label: "Hired",
            value: statusCounts.Hired,
            description: "Successfully hired candidates",
            icon: UserCheck,
            iconStyle: "bg-yellow-100 text-yellow-800",
            barStyle: "bg-yellow-400",
            progress: candidates.length ? (statusCounts.Hired / candidates.length) * 100 : 0,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <h2 className="mt-3 text-3xl font-bold text-gray-900">{card.value}</h2>
                  <p className="mt-1 text-xs text-gray-500">{card.description}</p>
                </div>
                <div className={`shrink-0 rounded-xl p-3 ${card.iconStyle}`}>
                  <Icon size={21} />
                </div>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full transition-all ${card.barStyle}`} style={{ width: `${card.progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate list */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="shrink-0 rounded-lg bg-yellow-100 p-2 text-yellow-800">
                <UserRound size={19} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Recruitment Pipeline</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {filteredCandidates.length} of {candidates.length} candidate{candidates.length === 1 ? "" : "s"} displayed
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
            <div className="relative min-w-0 flex-1">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, email, role or ID..."
                className={`${inputClass} pl-10`}
                aria-label="Search candidates"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass} sm:w-40`}
              aria-label="Filter candidates by status"
            >
              <option value="All">All statuses</option>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <RefreshCw size={28} className="mb-4 animate-spin text-yellow-500" />
            <p className="text-sm font-medium">Loading candidates...</p>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="px-4 py-16 text-center text-gray-500 sm:px-6 sm:py-20">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <Users size={25} className="text-gray-500" />
            </div>
            <p className="font-semibold text-gray-800">
              {candidates.length ? "No matching candidates" : "No candidates yet"}
            </p>
            <p className="mt-1 text-sm">
              {candidates.length
                ? "Try another search term or status filter."
                : "Add your first candidate to start tracking recruitment."}
            </p>
            {!candidates.length && (
              <button type="button" onClick={openAddModal} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-yellow-300">
                <Plus size={16} /> Add Candidate
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Responsive candidate cards */}
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:hidden">
              {filteredCandidates.map((candidate) => (
                <article key={candidate.id} className="flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-yellow-300 hover:shadow-md">
                  <div className="mb-4 flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                      <UserRound size={21} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-bold text-gray-900">{candidate.name}</h3>
                      <p className="mt-1 break-all text-sm text-gray-500">{candidate.email}</p>
                    </div>
                  </div>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    {renderStatus(candidate.status)}
                    <span className="text-xs text-gray-400">ID: {candidate.candidateCode}</span>
                  </div>
                  <div className="space-y-3 rounded-xl bg-gray-50 p-3">
                    <div className="flex items-start gap-2 text-sm">
                      <BriefcaseBusiness size={16} className="mt-0.5 shrink-0 text-gray-400" />
                      <span className="min-w-0 break-words text-gray-700">{candidate.position || "Position not specified"}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <UserCheck size={16} className="mt-0.5 shrink-0 text-gray-400" />
                      <span className="min-w-0 break-words text-gray-600">Assigned HR: {getHRDisplayName(candidate)}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <Users size={16} className="mt-0.5 shrink-0 text-gray-400" />
                      <span className="min-w-0 break-words text-gray-600">Interview Panel: {candidate.assignedTo || "Unassigned"}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CalendarDays size={16} className="mt-0.5 shrink-0 text-gray-400" />
                      <span className="min-w-0 break-words text-gray-600">{formatDate(candidate.interviewDate)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                    <button type="button" onClick={() => handleEdit(candidate)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-yellow-300 hover:bg-yellow-50">
                      <Pencil size={15} /> Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(candidate)} disabled={deletingId === candidate.id} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                      <Trash2 size={15} /> {deletingId === candidate.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4">Candidate ID</th>
                    <th className="px-5 py-4">Candidate</th>
                    <th className="px-5 py-4">Position</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Assigned HR</th>
                    <th className="px-5 py-4">Interview Panel</th>
                    <th className="px-5 py-4">Interview Date</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="transition hover:bg-yellow-50/40">
                      <td className="px-5 py-4 font-semibold text-gray-700">{candidate.candidateCode}</td>
                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                            <UserRound size={19} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">{candidate.name}</p>
                            <p className="mt-1 break-all text-xs text-gray-500">{candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-gray-700">{candidate.position || "-"}</span>
                      </td>
                      <td className="px-5 py-4">{renderStatus(candidate.status)}</td>
                      <td className="px-5 py-4 text-gray-600">{getHRDisplayName(candidate)}</td>
                      <td className="px-5 py-4 text-gray-600">{candidate.assignedTo || "Unassigned"}</td>
                      <td className="px-5 py-4 text-gray-600">{formatDate(candidate.interviewDate)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => handleEdit(candidate)} className="rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-yellow-300 hover:bg-yellow-50 hover:text-gray-900" title="Edit candidate" aria-label={`Edit ${candidate.name}`}>
                            <Pencil size={16} />
                          </button>
                          <button type="button" onClick={() => handleDelete(candidate)} disabled={deletingId === candidate.id} className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50" title="Delete candidate" aria-label={`Delete ${candidate.name}`}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Add/Edit candidate modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeModal();
          }}
        >
          <div className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-4 sm:p-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800 sm:flex">
                  {formData.id ? <Pencil size={21} /> : <UserPlus size={21} />}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                    {formData.id ? "Edit Candidate" : "Add New Candidate"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.id ? "Update applicant and interview details." : "Enter the applicant details to add them to recruitment."}
                  </p>
                </div>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:opacity-50" aria-label="Close modal">
                <X size={21} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 p-4 sm:p-6">
                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="candidate-name" className="mb-1.5 block text-sm font-semibold text-gray-700">Full Name *</label>
                    <div className="relative">
                      <UserRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="candidate-name" type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter full name" required maxLength={150} className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="candidate-email" className="mb-1.5 block text-sm font-semibold text-gray-700">Email Address *</label>
                    <div className="relative">
                      <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="candidate-email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="name@example.com" required maxLength={255} className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="candidate-position" className="mb-1.5 block text-sm font-semibold text-gray-700">Position Applied For *</label>
                    <div className="relative">
                      <BriefcaseBusiness size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="candidate-position" type="text" name="position" value={formData.position} onChange={handleChange} placeholder="e.g. Software Engineer" required maxLength={150} className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="candidate-status" className="mb-1.5 block text-sm font-semibold text-gray-700">Recruitment Status *</label>
                    <select id="candidate-status" name="status" value={formData.status} onChange={handleChange} required className={inputClass}>
                      {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="candidate-assigned-hr" className="mb-1.5 block text-sm font-semibold text-gray-700">Assigned HR</label>
                    <div className="relative">
                      <UserRound size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select
                        id="candidate-assigned-hr"
                        name="assignedHrUserId"
                        value={formData.assignedHrUserId || ""}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                      >
                        <option value="">Unassigned</option>
                        {hrUsers.map((user) => (
                          <option key={user.user_id} value={user.user_id}>
                            {user.name} ({user.user_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="candidate-assigned" className="mb-1.5 block text-sm font-semibold text-gray-700">Assigned To</label>
                    <div className="relative">
                      <UserCheck size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <select id="candidate-assigned" name="assignedTo" value={formData.assignedTo} onChange={handleChange} className={`${inputClass} pl-10`}>
                        <option value="">Unassigned</option>
                        <option value="Panel A">Panel A</option>
                        <option value="Panel B">Panel B</option>
                        <option value="Panel C">Panel C</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="candidate-interview-date" className="mb-1.5 block text-sm font-semibold text-gray-700">Interview Date</label>
                    <div className="relative">
                      <CalendarDays size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input id="candidate-interview-date" type="date" name="interviewDate" value={formData.interviewDate} onChange={handleChange} className={`${inputClass} pl-10`} />
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-5 text-gray-500">
                  Candidate details are saved through your existing backend API to the HRMS PostgreSQL database.
                </p>
              </div>

              <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row sm:justify-end sm:p-5">
                <button type="button" onClick={closeModal} disabled={saving} className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  {saving ? "Saving..." : formData.id ? "Save Changes" : "Add Candidate"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateManagement;
