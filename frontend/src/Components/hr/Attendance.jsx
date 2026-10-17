import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays, Users, CheckCircle2, XCircle, Clock3, Search,
  RefreshCw, Download, ClipboardCheck, AlertCircle, Save,
  UserCheck, ArrowUpRight, Filter, Building2, History,
  BarChart3, FileText, X, ShieldCheck
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";
const STATUSES = ["Present", "Absent", "Late", "Half Day", "Leave"];

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const getToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");
    return (
      localStorage.getItem("hrAuthToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      user.token ||
      user.authToken ||
      user.user?.token ||
      user.user?.authToken ||
      ""
    );
  } catch {
    return (
      localStorage.getItem("hrAuthToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      ""
    );
  }
};

const normalizeId = (value) => String(value ?? "").trim().toLowerCase();

const decodeTokenPayload = (token) => {
  try {
    if (!token || token.split(".").length !== 3) return {};

    const payloadPart = token.split(".")[1];
    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const binary = atob(paddedBase64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return {};
  }
};

const getLoggedInUser = () => {
  const ids = [];
  const emails = [];
  const names = [];
  const roles = [];
  const visited = new Set();

  const addValues = (target, values, normalize = normalizeId) => {
    values.forEach((value) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        target.push(normalize(value));
      }
    });
  };

  const readIdentity = (source) => {
    if (!source || typeof source !== "object" || visited.has(source)) return;
    visited.add(source);

    addValues(ids, [
      source.userId,
      source.user_id,
      source.employeeId,
      source.employee_id,
      source.employeeID,
      source.userID,
      source.id,
      source.uuid,
      source.sub,
      source.accountId,
      source.account_id
    ]);

    addValues(emails, [
      source.email,
      source.emailAddress,
      source.email_address,
      source.employeeEmail,
      source.employee_email,
      source.userEmail,
      source.user_email,
      source.username
    ], (value) => String(value).trim().toLowerCase());

    addValues(names, [
      source.employeeName,
      source.employee_name,
      source.fullName,
      source.full_name,
      source.name,
      source.displayName,
      source.display_name
    ], (value) => String(value).trim().toLowerCase());

    addValues(roles, [
      source.role,
      source.userRole,
      source.user_role,
      source.employeeRole,
      source.employee_role,
      source.roleName,
      source.role_name
    ], (value) => String(value).trim().toLowerCase());

    [
      source.user,
      source.employee,
      source.profile,
      source.data,
      source.account
    ].forEach(readIdentity);
  };

  try {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");
    readIdentity(user);
    readIdentity(decodeTokenPayload(getToken()));
  } catch {
    readIdentity(decodeTokenPayload(getToken()));
  }

  return {
    ids: [...new Set(ids)],
    emails: [...new Set(emails)],
    names: [...new Set(names)],
    roles: [...new Set(roles)],
    userId: ids[0] || "",
    email: emails[0] || "",
    name: names[0] || "",
    role: roles.includes("hr") ? "hr" : roles[0] || ""
  };
};

const getRecordIdentity = (item) => ({
  id: normalizeId(
    item.employeeId ??
    item.employee_id ??
    item.employeeID ??
    item.userId ??
    item.user_id ??
    item.userID ??
    item.user_id_fk ??
    item.accountId ??
    item.account_id ??
    item.id
  ),
  email: normalizeId(
    item.employeeEmail ??
    item.employee_email ??
    item.email ??
    item.email_address ??
    item.userEmail ??
    item.user_email ??
    item.username
  ),
  name: normalizeId(
    item.employeeName ??
    item.employee_name ??
    item.fullName ??
    item.full_name ??
    item.name ??
    item.displayName ??
    item.display_name
  )
});

const isCurrentUserRecord = (record, currentUser) => {
  const identity = getRecordIdentity(record);

  if (identity.id && currentUser.ids.includes(identity.id)) return true;
  if (identity.email && currentUser.emails.includes(identity.email)) return true;

  // Use the name only when neither side has an email or ID available.
  if (
    identity.name &&
    !identity.id &&
    !identity.email &&
    currentUser.ids.length === 0 &&
    currentUser.emails.length === 0 &&
    currentUser.names.length > 0
  ) {
    return currentUser.names.includes(identity.name);
  }

  return false;
};

const statusStyles = {
  Present: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Absent: "bg-rose-50 text-rose-700 ring-rose-200",
  Late: "bg-amber-50 text-amber-800 ring-amber-200",
  "Half Day": "bg-orange-50 text-orange-700 ring-orange-200",
  Leave: "bg-blue-50 text-blue-700 ring-blue-200",
  "Not Marked": "bg-gray-100 text-gray-600 ring-gray-200"
};

function SummaryCard({ title, value, detail, icon: Icon, accent }) {
  return (
    <div className="group rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
          <p className="mt-2 text-xs leading-5 text-gray-500">{detail}</p>
        </div>
        <div className={`rounded-xl p-3 transition-transform duration-200 group-hover:scale-105 ${accent}`}>
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

const normalizeRecord = (item) => ({
  ...item,
  employeeId: item.employeeId ?? item.employee_id ?? item.employeeID ?? item.userId ?? item.user_id ?? item.user_id_fk ?? item.id ?? "",
  employeeName: item.employeeName ?? item.employee_name ?? item.fullName ?? item.full_name ?? item.name ?? "Unnamed employee",
  employeeEmail: String(item.employeeEmail ?? item.employee_email ?? item.email ?? item.email_address ?? item.userEmail ?? item.user_email ?? item.username ?? "").trim().toLowerCase(),
  role: String(item.role ?? item.employee_role ?? item.user_role ?? "").trim().toLowerCase(),
  position: item.position ?? item.department ?? item.department_name ?? item.employee_role ?? "—",
  department: item.department ?? item.department_name ?? item.position ?? "—",
  status: item.status || "Not Marked",
  checkIn: String(item.checkIn ?? item.check_in ?? "").slice(0, 5),
  checkOut: String(item.checkOut ?? item.check_out ?? "").slice(0, 5),
  notes: item.notes ?? ""
});

const sameRecord = (a, b) =>
  normalizeId(a.employeeId) === normalizeId(b.employeeId) &&
  a.status === b.status &&
  a.checkIn === b.checkIn &&
  a.checkOut === b.checkOut &&
  a.notes === b.notes;

export default function Attendance() {
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState([]);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [positionFilter, setPositionFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyEmployee, setHistoryEmployee] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showExceptions, setShowExceptions] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const loggedInUser = useMemo(() => getLoggedInUser(), []);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const token = getToken();
      if (!token) throw new Error("Your login session was not found. Please sign in again.");

      const response = await axios.get(`${API_URL}/attendance`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.records ?? response.data.attendance;

      if (!Array.isArray(data)) {
        throw new Error("The attendance API returned an unexpected response.");
      }

      const normalized = data.map(normalizeRecord);

      const visibleRecords = normalized.filter((record) => {
        if (loggedInUser.role !== "hr") return true;
        return !isCurrentUserRecord(record, loggedInUser);
      });

      setRecords(visibleRecords);
      setOriginalRecords(visibleRecords.map((record) => ({ ...record })));
    } catch (err) {
      setRecords([]);
      setOriginalRecords([]);
      setError(err.response?.data?.message || err.message || "Unable to load attendance records.");
    } finally {
      setLoading(false);
    }
  }, [date, loggedInUser]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const dirtyRecords = useMemo(() => records.filter((record) => {
    const original = originalRecords.find(
      (item) => normalizeId(item.employeeId) === normalizeId(record.employeeId)
    );
    return !original || !sameRecord(record, original);
  }), [records, originalRecords]);

  const loadReport = async () => {
    setReportLoading(true);
    setError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Your login session was not found. Please sign in again.");

      const response = await axios.get(`${API_URL}/attendance/report`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!Array.isArray(response.data.report)) {
        throw new Error("The attendance report returned an unexpected response.");
      }

      const visibleReport = response.data.report.filter((item) => {
        if (loggedInUser.role !== "hr") return true;

        const identity = getRecordIdentity(item);
        return !(
          (identity.id && loggedInUser.ids.includes(identity.id)) ||
          (identity.email && loggedInUser.emails.includes(identity.email))
        );
      });

      setReport(visibleReport);
      setShowReport(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to generate attendance report.");
    } finally {
      setReportLoading(false);
    }
  };

  const loadHistory = async (record) => {
    setHistoryEmployee(record);
    setHistory(null);
    setHistoryLoading(true);
    setError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Your login session was not found. Please sign in again.");

      const response = await axios.get(
        `${API_URL}/attendance/history/${encodeURIComponent(record.employeeId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!Array.isArray(response.data.records)) {
        throw new Error("The attendance history returned an unexpected response.");
      }

      setHistory(response.data.records);
    } catch (err) {
      setHistoryEmployee(null);
      setError(err.response?.data?.message || err.message || "Unable to load attendance history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const summary = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === "Present" || r.status === "Late").length;
    const absent = records.filter((r) => r.status === "Absent").length;
    const late = records.filter((r) => r.status === "Late").length;
    const halfDay = records.filter((r) => r.status === "Half Day").length;
    const leave = records.filter((r) => r.status === "Leave").length;
    const marked = records.filter((r) => r.status !== "Not Marked").length;
    const unmarked = total - marked;

    return {
      total, present, absent, late, halfDay, leave, unmarked,
      percentage: total ? Math.round((present / total) * 100) : 0,
      exceptions: absent + late + halfDay + unmarked
    };
  }, [records]);

  const positions = useMemo(() => [
    ...new Set(records.map((r) => r.position).filter((p) => p && p !== "—"))
  ].sort(), [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((r) => {
      const matchesSearch = !query ||
        String(r.employeeName).toLowerCase().includes(query) ||
        String(r.employeeId ?? "").toLowerCase().includes(query) ||
        String(r.position).toLowerCase().includes(query) ||
        String(r.role).toLowerCase().includes(query);

      const matchesStatus = statusFilter === "All" || r.status === statusFilter;
      const matchesRole = roleFilter === "All" || r.role === roleFilter;
      const matchesPosition = positionFilter === "All" || r.position === positionFilter;

      return matchesSearch && matchesStatus && matchesRole && matchesPosition;
    });
  }, [records, search, statusFilter, roleFilter, positionFilter]);

  const exceptionRecords = useMemo(() => filteredRecords.filter((r) =>
    ["Absent", "Late", "Half Day", "Not Marked"].includes(r.status)
  ), [filteredRecords]);

  const updateRecord = (employeeId, field, value) => {
    setRecords((current) => current.map((r) =>
      normalizeId(r.employeeId) === normalizeId(employeeId) ? { ...r, [field]: value } : r
    ));
  };

  const saveRecord = async (record) => {
    if (record.employeeId === undefined || record.employeeId === null || record.employeeId === "") {
      setError("This employee record has no employee ID, so attendance cannot be saved.");
      return false;
    }

    setSavingId(record.employeeId);
    setError("");
    setNotice("");

    try {
      const token = getToken();
      if (!token) throw new Error("Your login session was not found. Please sign in again.");

      await axios.put(
        `${API_URL}/attendance/${encodeURIComponent(record.employeeId)}`,
        {
          date,
          status: record.status,
          checkIn: record.checkIn || null,
          checkOut: record.checkOut || null,
          notes: record.notes || ""
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOriginalRecords((current) => {
        const next = current.filter(
          (item) => normalizeId(item.employeeId) !== normalizeId(record.employeeId)
        );
        return [...next, { ...record }];
      });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Unable to save attendance for ${record.employeeName}.`);
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveRecord = async (record) => {
    const success = await saveRecord(record);
    if (success) {
      setNotice(`Attendance saved for ${record.employeeName}.`);
    }
  };

  const saveAllRecords = async () => {
    if (!dirtyRecords.length) {
      setNotice("There are no unsaved attendance changes.");
      return;
    }

    setSavingAll(true);
    setError("");
    setNotice("");

    const token = getToken();
    if (!token) {
      setError("Your login session was not found. Please sign in again.");
      setSavingAll(false);
      return;
    }

    let saved = 0;
    const failures = [];

    for (const record of dirtyRecords) {
      try {
        if (record.employeeId === undefined || record.employeeId === null || record.employeeId === "") {
          throw new Error("Missing employee ID.");
        }

        await axios.put(
          `${API_URL}/attendance/${encodeURIComponent(record.employeeId)}`,
          {
            date,
            status: record.status,
            checkIn: record.checkIn || null,
            checkOut: record.checkOut || null,
            notes: record.notes || ""
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setOriginalRecords((current) => {
          const next = current.filter(
            (item) => normalizeId(item.employeeId) !== normalizeId(record.employeeId)
          );
          return [...next, { ...record }];
        });
        saved += 1;
      } catch (err) {
        failures.push(`${record.employeeName}: ${err.response?.data?.message || err.message || "Save failed"}`);
      }
    }

    setSavingAll(false);

    if (failures.length) {
      setError(`${saved} record(s) saved. ${failures.length} record(s) failed: ${failures.join("; ")}`);
    } else {
      setNotice(`Successfully saved attendance changes for ${saved} staff member(s).`);
    }

    if (saved) await loadAttendance();
  };

  const exportCsv = () => {
    const columns = ["Employee ID", "Employee Name", "Role", "Position", "Status", "Check In", "Check Out", "Notes"];
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = filteredRecords.map((r) => [
      r.employeeId, r.employeeName, r.role, r.position, r.status, r.checkIn, r.checkOut, r.notes
    ]);

    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportReportCsv = () => {
    const columns = ["Role", "Status", "Count"];
    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = report.map((r) => [r.role, r.status, r.count]);
    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col justify-between gap-5 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-bold tracking-wider text-yellow-800 ring-1 ring-yellow-200/80">
              <ClipboardCheck size={15} /> PEOPLE OPERATIONS
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Attendance Management</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
              Monitor daily attendance, review employee records, and manage working hours from one place.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 transition focus-within:border-yellow-400 focus-within:bg-white">
              <CalendarDays size={18} className="shrink-0 text-gray-500" />
              <input
                aria-label="Select attendance date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-gray-700 outline-none"
              />
            </label>
            <button onClick={loadAttendance} disabled={loading || savingAll} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
            <button onClick={exportCsv} disabled={!filteredRecords.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-yellow-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={loadReport} disabled={reportLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
              {reportLoading ? <RefreshCw size={16} className="animate-spin" /> : <BarChart3 size={16} />} Reports
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span className="break-words">{error}</span>
            <button onClick={() => setError("")} className="ml-auto" aria-label="Dismiss error"><X size={16} /></button>
          </div>
        )}
        {notice && (
          <div role="status" className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            <CheckCircle2 size={18} className="shrink-0" /> {notice}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Total Staff" value={summary.total} detail="Accounts included in this attendance view" icon={Users} accent="bg-gray-100 text-gray-700" />
          <SummaryCard title="Present" value={summary.present} detail={`${summary.percentage}% present or late`} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-700" />
          <SummaryCard title="Absent" value={summary.absent} detail="Staff marked absent for this date" icon={XCircle} accent="bg-rose-50 text-rose-700" />
          <SummaryCard title="Late Arrivals" value={summary.late} detail={`${summary.unmarked} records not marked`} icon={Clock3} accent="bg-amber-50 text-amber-700" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Half Day" value={summary.halfDay} detail="Staff with half-day attendance" icon={Clock3} accent="bg-orange-50 text-orange-700" />
          <SummaryCard title="On Leave" value={summary.leave} detail="Staff marked on leave" icon={ShieldCheck} accent="bg-blue-50 text-blue-700" />
          <SummaryCard title="Not Marked" value={summary.unmarked} detail="Attendance needs to be reviewed" icon={AlertCircle} accent="bg-gray-100 text-gray-700" />
          <SummaryCard title="Exceptions" value={summary.exceptions} detail="Absent, late, half-day or unmarked" icon={ClipboardCheck} accent="bg-rose-50 text-rose-700" />
        </div>

        {showReport && (
          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700"><BarChart3 size={20} /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Organization attendance report</h2>
                  <p className="mt-1 text-sm text-gray-500">Server-generated attendance counts for {date}.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={exportReportCsv} disabled={!report.length} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-gray-950 disabled:opacity-50"><Download size={14} /> Export</button>
                <button onClick={() => setShowReport(false)} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" aria-label="Close report"><X size={17} /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr><th className="px-5 py-3">Role</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Staff count</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.length ? report.map((item, index) => (
                    <tr key={`${item.role}-${item.status}-${index}`}>
                      <td className="px-5 py-3 capitalize">{item.role}</td>
                      <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[item.status] || statusStyles["Not Marked"]}`}>{item.status}</span></td>
                      <td className="px-5 py-3 font-semibold text-gray-900">{item.count}</td>
                    </tr>
                  )) : <tr><td colSpan="3" className="px-5 py-8 text-center text-gray-500">No report data found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-50 text-yellow-700"><UserCheck size={19} /></div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900">Daily attendance</h2>
              </div>
              <p className="mt-2 text-sm text-gray-500">Review staff attendance and save status changes for {date}.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <div className="relative">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, ID or role" aria-label="Search attendance records" className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:bg-white focus:ring-4 focus:ring-yellow-50 sm:w-64" />
              </div>
              <div className="relative">
                <Filter size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter attendance by status" className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-9 text-sm font-medium text-gray-700 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 sm:w-40">
                  <option value="All">All statuses</option>
                  {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  <option value="Not Marked">Not Marked</option>
                </select>
              </div>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} aria-label="Filter attendance by role" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700 outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 sm:w-36">
                <option value="All">All roles</option>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </select>
              <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} aria-label="Filter attendance by position" className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700 outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 sm:w-44">
                <option value="All">All positions</option>
                {positions.map((position) => <option key={position} value={position}>{position}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3.5 sm:px-6">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Building2 size={15} /> Staff directory
              <span className="rounded-md bg-white px-2 py-1 text-gray-700 ring-1 ring-gray-200">{filteredRecords.length} shown</span>
              {dirtyRecords.length > 0 && <span className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800">{dirtyRecords.length} unsaved</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setShowExceptions((value) => !value)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${showExceptions ? "bg-rose-100 text-rose-800" : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                <AlertCircle size={14} /> {showExceptions ? "Show all records" : "Review exceptions"}
              </button>
              <button onClick={saveAllRecords} disabled={savingAll || loading || dirtyRecords.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-3.5 py-2.5 text-xs font-bold text-gray-950 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50">
                {savingAll ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                {savingAll ? "Saving all..." : `Save All${dirtyRecords.length ? ` (${dirtyRecords.length})` : ""}`}
              </button>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Present
                <span className="ml-2 h-2 w-2 rounded-full bg-rose-500" /> Absent
                <span className="ml-2 h-2 w-2 rounded-full bg-amber-500" /> Late
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left text-sm">
              <thead className="bg-white text-[11px] uppercase tracking-[0.1em] text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-bold sm:px-6">Employee</th>
                  <th className="px-5 py-4 font-bold">Department / Role</th>
                  <th className="px-5 py-4 font-bold">Attendance status</th>
                  <th className="px-5 py-4 font-bold">Check-in</th>
                  <th className="px-5 py-4 font-bold">Check-out</th>
                  <th className="px-5 py-4 font-bold">Notes</th>
                  <th className="px-5 py-4 font-bold">History</th>
                  <th className="px-5 py-4 text-right font-bold sm:px-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="8" className="px-5 py-16 text-center text-gray-500">
                    <RefreshCw size={22} className="mx-auto mb-3 animate-spin text-yellow-600" />
                    <p className="font-medium text-gray-700">Loading attendance records</p>
                    <p className="mt-1 text-xs text-gray-400">Please wait while we fetch the latest data.</p>
                  </td></tr>
                ) : (showExceptions ? exceptionRecords : filteredRecords).length === 0 ? (
                  <tr><td colSpan="8" className="px-5 py-16 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500"><ClipboardCheck size={25} /></div>
                    <p className="font-semibold text-gray-800">No attendance records found</p>
                    <p className="mt-1 text-sm text-gray-500">Try another date or adjust your search and filters.</p>
                  </td></tr>
                ) : (showExceptions ? exceptionRecords : filteredRecords).map((record) => (
                  <tr key={String(record.employeeId)} className="group transition-colors hover:bg-yellow-50/30">
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-700 ring-1 ring-gray-200 transition-colors group-hover:bg-yellow-100 group-hover:text-yellow-900 group-hover:ring-yellow-200">
                          {String(record.employeeName).trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{record.employeeName}</div>
                          <div className="mt-1 text-xs text-gray-500">ID: {record.employeeId}</div>
                          <div className="mt-1 text-[11px] capitalize text-gray-400">{record.role || "Unknown role"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600"><Building2 size={13} /> {record.position}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[record.status] || statusStyles["Not Marked"]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${record.status === "Present" ? "bg-emerald-500" : record.status === "Absent" ? "bg-rose-500" : record.status === "Late" ? "bg-amber-500" : record.status === "Leave" ? "bg-blue-500" : record.status === "Half Day" ? "bg-orange-500" : "bg-gray-400"}`} />
                          {record.status}
                        </span>
                        <select aria-label={`Attendance status for ${record.employeeName}`} value={record.status} onChange={(e) => updateRecord(record.employeeId, "status", e.target.value)} className="block w-32 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-700 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50">
                          <option value="Not Marked">Not Marked</option>
                          {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <input aria-label={`Check-in for ${record.employeeName}`} type="time" value={record.checkIn} onChange={(e) => updateRecord(record.employeeId, "checkIn", e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2.5 text-xs text-gray-700 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50" />
                    </td>
                    <td className="px-5 py-4">
                      <input aria-label={`Check-out for ${record.employeeName}`} type="time" value={record.checkOut} onChange={(e) => updateRecord(record.employeeId, "checkOut", e.target.value)} className="rounded-lg border border-gray-200 bg-white px-2.5 py-2.5 text-xs text-gray-700 outline-none transition focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50" />
                    </td>
                    <td className="px-5 py-4">
                      <input aria-label={`Notes for ${record.employeeName}`} value={record.notes} onChange={(e) => updateRecord(record.employeeId, "notes", e.target.value)} placeholder="Add a note..." maxLength={500} className="w-36 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50" />
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => loadHistory(record)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-yellow-300 hover:bg-yellow-50">
                        <History size={14} /> History
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right sm:px-6">
                      <button onClick={() => handleSaveRecord(record)} disabled={savingId !== null || savingAll} className="inline-flex min-w-[92px] items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3.5 py-2.5 text-xs font-bold text-gray-950 shadow-sm transition hover:bg-yellow-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50">
                        {String(savingId) === String(record.employeeId) ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        {String(savingId) === String(record.employeeId) ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
              Showing <strong className="font-semibold text-gray-800">{(showExceptions ? exceptionRecords : filteredRecords).length}</strong> of{" "}
              <strong className="font-semibold text-gray-800">{records.length}</strong> staff records
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-yellow-100 text-yellow-800"><ArrowUpRight size={14} /></span>
              HR attendance workspace
            </span>
          </div>
        </div>

        {historyEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4" role="dialog" aria-modal="true" aria-label="Employee attendance history">
            <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 p-5 sm:p-6">
                <div>
                  <div className="flex items-center gap-2 text-yellow-700"><History size={19} /><span className="text-xs font-bold uppercase tracking-wider">Attendance history</span></div>
                  <h2 className="mt-2 text-xl font-bold text-gray-900">{historyEmployee.employeeName}</h2>
                  <p className="mt-1 text-sm text-gray-500">Employee ID: {historyEmployee.employeeId}</p>
                </div>
                <button onClick={() => { setHistoryEmployee(null); setHistory(null); }} className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" aria-label="Close attendance history"><X size={18} /></button>
              </div>
              <div className="max-h-[60vh] overflow-auto p-5 sm:p-6">
                {historyLoading ? (
                  <div className="py-12 text-center text-gray-500"><RefreshCw size={22} className="mx-auto mb-3 animate-spin text-yellow-600" />Loading attendance history...</div>
                ) : history?.length ? (
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                      <tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Check-in</th><th className="px-3 py-3">Check-out</th><th className="px-3 py-3">Notes</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map((item, index) => (
                        <tr key={`${item.date}-${index}`}>
                          <td className="whitespace-nowrap px-3 py-3">{String(item.date).slice(0, 10)}</td>
                          <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[item.status] || statusStyles["Not Marked"]}`}>{item.status}</span></td>
                          <td className="px-3 py-3">{item.checkIn || item.check_in || "—"}</td>
                          <td className="px-3 py-3">{item.checkOut || item.check_out || "—"}</td>
                          <td className="max-w-40 px-3 py-3">{item.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center">
                    <FileText size={28} className="mx-auto mb-3 text-gray-400" />
                    <p className="font-semibold text-gray-800">No attendance history found</p>
                    <p className="mt-1 text-sm text-gray-500">No saved attendance records are available for this staff member.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}