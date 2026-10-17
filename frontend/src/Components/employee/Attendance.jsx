
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CalendarDays, Clock3, CheckCircle2, XCircle, RefreshCw, Download,
  ClipboardCheck, AlertCircle, LogIn, LogOut, History,
  Send, CalendarCheck, X
} from "lucide-react";

const API_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";
// const STATUSES = ["Present", "Absent", "Late", "Half Day", "Leave", "Not Marked"];
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const getToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("userData") || "{}");
    return localStorage.getItem("authToken") || localStorage.getItem("token") || user.token || user.authToken || "";
  } catch {
    return localStorage.getItem("authToken") || localStorage.getItem("token") || "";
  }
};
const formatHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "—";
  const toMinutes = (value) => {
    const [h, m] = String(value).split(":").map(Number);
    return h * 60 + m;
  };
  let minutes = toMinutes(checkOut) - toMinutes(checkIn);
  if (minutes < 0) minutes += 1440;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
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
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-2 text-xs text-gray-500">{detail}</p>
        </div>
        <div className={`rounded-xl p-3 ${accent}`}><Icon size={21} /></div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [date, setDate] = useState(today());
  const [records, setRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [correctionDate, setCorrectionDate] = useState(today());
  const [correctionReason, setCorrectionReason] = useState("");

  const request = useCallback(async (method, path, data, params) => {
    const token = getToken();
    if (!token) throw new Error("Your login session was not found. Please sign in again.");
    const response = await axios({
      method,
      url: `${API_URL}${path}`,
      data,
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [selfData, historyData, correctionData] = await Promise.all([
        request("get", "/attendance/me", null, { date }),
        request("get", "/attendance/me/history"),
        request("get", "/attendance/me/corrections")
      ]);

      const list = Array.isArray(historyData.records) ? historyData.records : [];
      setRecords(list.filter((r) =>
        String(r.date || r.attendance_date || "").slice(0, 10).startsWith(date.slice(0, 7))
      ));
      setTodayRecord(selfData.record || selfData.today || null);
      setCorrections(Array.isArray(correctionData.requests) ? correctionData.requests : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }, [date, request]);

  useEffect(() => { loadData(); }, [loadData]);

  const summary = useMemo(() => {
    const count = (status) => records.filter((r) => r.status === status).length;
    const total = records.length;
    const present = count("Present");
    return {
      total, present, absent: count("Absent"), late: count("Late"),
      halfDay: count("Half Day"), leave: count("Leave"),
      percentage: total ? Math.round((present / total) * 100) : 0
    };
  }, [records]);

  const doAttendanceAction = async (action) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request("post", `/attendance/me/${action}`);
      setNotice(result.message || "Attendance updated successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to update attendance.");
    } finally {
      setBusy(false);
    }
  };

  const submitCorrection = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request("post", "/attendance/me/corrections", {
        date: correctionDate,
        reason: correctionReason.trim()
      });
      setNotice(result.message || "Correction request submitted.");
      setCorrectionReason("");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to submit correction request.");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const columns = ["Date", "Status", "Check In", "Check Out", "Working Hours", "Notes"];
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = records.map((r) => [
      String(r.date || r.attendance_date || "").slice(0, 10),
      r.status, r.checkIn || r.check_in, r.checkOut || r.check_out,
      formatHours(r.checkIn || r.check_in, r.checkOut || r.check_out), r.notes
    ]);
    const csv = [columns, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `my-attendance-${date.slice(0, 7)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-gray-900 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col justify-between gap-5 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7 lg:flex-row lg:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-bold tracking-wider text-yellow-800 ring-1 ring-yellow-200">
              <CalendarCheck size={15} /> EMPLOYEE SELF-SERVICE
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Attendance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">View your attendance, record working times, review monthly totals, and submit requests.</p>
          </div>
        <div className="flex flex-nowrap gap-2.5">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
            <CalendarDays size={17} className="text-gray-500" />
            <input
            aria-label="Select attendance date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-w-0 bg-transparent text-sm outline-none"
            />
        </label>
        <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
        >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
        </button>
        <button
            onClick={exportCsv}
            disabled={!records.length}
            className="inline-flex shrink-0 mr-4 items-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-300 disabled:opacity-50"
        >
            <Download size={16} />
            Export CSV
        </button>
        </div>
        </header>

        {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={18} /><span>{error}</span><button className="ml-auto" onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}
        {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={18} />{notice}</div>}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard title="Present" value={summary.present} detail={`${summary.percentage}% of loaded records`} icon={CheckCircle2} accent="bg-emerald-50 text-emerald-700" />
          <SummaryCard title="Absent" value={summary.absent} detail="Days marked absent" icon={XCircle} accent="bg-rose-50 text-rose-700" />
          <SummaryCard title="Late arrivals" value={summary.late} detail="Days marked late" icon={Clock3} accent="bg-amber-50 text-amber-700" />
          <SummaryCard title="Leave / Half day" value={`${summary.leave} / ${summary.halfDay}`} detail="Approved leave and half days recorded" icon={ClipboardCheck} accent="bg-blue-50 text-blue-700" />
        </section>

        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><h2 className="text-lg font-bold">Today's attendance</h2><p className="mt-1 text-sm text-gray-500">{today()}</p></div>
            <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyles[todayRecord?.status] || statusStyles["Not Marked"]}`}>{todayRecord?.status || "Not Marked"}</span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Check-in</p><p className="mt-2 text-xl font-bold">{todayRecord?.checkIn || "—"}</p></div>
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Check-out</p><p className="mt-2 text-xl font-bold">{todayRecord?.checkOut || "—"}</p></div>
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Working hours</p><p className="mt-2 text-xl font-bold">{formatHours(todayRecord?.checkIn, todayRecord?.checkOut)}</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => doAttendanceAction("check-in")} disabled={busy || Boolean(todayRecord?.checkIn)} className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"><LogIn size={17} />{todayRecord?.checkIn ? `Checked in at ${todayRecord.checkIn}` : "Check in"}</button>
            <button onClick={() => doAttendanceAction("check-out")} disabled={busy || !todayRecord?.checkIn || Boolean(todayRecord?.checkOut)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"><LogOut size={17} />{todayRecord?.checkOut ? `Checked out at ${todayRecord.checkOut}` : "Check out"}</button>
          </div>
          <p className="mt-3 text-xs text-gray-500">Check-in and check-out are subject to your organization's attendance policy.</p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div><h2 className="text-lg font-bold">My attendance history</h2><p className="mt-1 text-sm text-gray-500">Personal records for the selected month.</p></div>
            <span className="text-xs text-gray-500">{records.length} record(s)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Date</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Check-in</th><th className="px-5 py-3">Check-out</th><th className="px-5 py-3">Working hours</th><th className="px-5 py-3">Notes</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500"><RefreshCw size={20} className="mx-auto mb-2 animate-spin" />Loading attendance...</td></tr> :
                  records.length ? records.map((r, i) => {
                    const checkIn = r.checkIn || r.check_in || "";
                    const checkOut = r.checkOut || r.check_out || "";
                    return <tr key={`${r.date || r.attendance_date}-${i}`} className="hover:bg-yellow-50/30">
                      <td className="whitespace-nowrap px-5 py-4">{String(r.date || r.attendance_date || "").slice(0, 10)}</td>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[r.status] || statusStyles["Not Marked"]}`}>{r.status || "Not Marked"}</span></td>
                      <td className="px-5 py-4">{checkIn || "—"}</td><td className="px-5 py-4">{checkOut || "—"}</td><td className="px-5 py-4">{formatHours(checkIn, checkOut)}</td><td className="px-5 py-4">{r.notes || "—"}</td>
                    </tr>;
                  }) : <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500"><History size={24} className="mx-auto mb-2" />No attendance records found for this month.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6">
          <form onSubmit={submitCorrection} className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-yellow-50 p-3 text-yellow-700"><ClipboardCheck size={20} /></div><div><h2 className="font-bold">Request attendance correction</h2><p className="mt-1 text-xs text-gray-500">For a missed check-in, check-out, or incorrect record.</p></div></div>
            <label className="block text-sm font-medium text-gray-700">Attendance date<input required type="date" max={today()} value={correctionDate} onChange={(e) => setCorrectionDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-yellow-400" /></label>
            <label className="block text-sm font-medium text-gray-700">Reason<textarea required minLength={5} maxLength={500} rows={3} value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} placeholder="Explain the correction needed..." className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-yellow-400" /></label>
            <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-gray-950 hover:bg-yellow-300 disabled:opacity-50"><Send size={16} />Submit request</button>
            <div className="border-t border-gray-100 pt-4"><h3 className="mb-3 font-semibold">Correction request status</h3>{corrections.length ? corrections.map((r) => <div key={r.id} className="mb-2 flex items-start justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm"><div><p className="font-medium">{String(r.attendance_date || r.attendanceDate || "").slice(0, 10)}</p><p className="mt-1 text-xs text-gray-500">{r.reason}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs ring-1 ring-gray-200">{r.status}</span></div>) : <p className="text-sm text-gray-500">No correction requests yet.</p>}</div>
          </form>
        </section>
      </div>
    </div>
  );
}
