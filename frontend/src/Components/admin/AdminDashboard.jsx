import React, { useState } from "react";
import AdminSidebar from "../sidebar/AdminSidebar";
import Calendarandmeeting from "./Calendarandmeeting";
import AdminTaskAssignment from "./Taskmanagement";
import Joiningformalities from "./Joiningformalities";
import { Users, FileText, CreditCard } from "lucide-react";
import Rolemanagement from "./Rolemanagement";
import AdminProfilePage from "./Profile";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import OfferLetter from "./Offerletter";
import Interviewpanel from "./Interviewpanel";
import Payslip from "./Payslip";
import Candidatemanagement from "./Candidatemanagement"
import Workreports from "./Workreports"
import Leavemanagement from "./Leavemanagement"
import Usermanagement from "./Usermanagement";

// ---- StatCard Component ----
const StatCard = ({ title, amount, percent, up }) => (
  <div className="w-full bg-white rounded-xl shadow p-4">
    <div className="text-xs text-gray-500">{title}</div>
    <div className="text-2xl font-semibold">{amount}</div>
    <div className={`text-xs mt-1 font-semibold ${up ? "text-green-500" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {percent}%
    </div>
    <div className="w-full h-1 mt-3 rounded bg-gray-200">
      <div
        className={`h-full rounded ${up ? "bg-green-500" : "bg-red-500"}`}
        style={{ width: `${percent}%` }}
      ></div>
    </div>
  </div>
);

// ---- Mock Data ----
const genderData = [
  { name: "Male", value: 40 },
  { name: "Female", value: 54 },
  { name: "Other", value: 6 },
];
const COLORS = ["#3b83f6ff", "#06c3fdff", "#0658fdff"];

const projectStatus = [
  { name: "Completed", count: 24 },
  { name: "In Progress", count: 11 },
  { name: "On Hold", count: 3 },
  { name: "Cancelled", count: 2 },
];

// ---- Card Wrapper ----
const Card = ({ className = "", children }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

// ---- KPI Card ----
const Kpi = ({ label, value, delta, icon: Icon }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-gray-500 text-xs uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {delta && (
          <div className={`text-xs mt-1 font-medium ${delta.startsWith("+") ? "text-green-600" : "text-rose-600"}`}>
            {delta} this month
          </div>
        )}
      </div>
      {Icon && (
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <Icon size={22} />
        </div>
      )}
    </div>
  </Card>
);

// ---- Badge Component ----
const Badge = ({ children, tone = "default" }) => {
  const tones = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-blue-100 text-blue-700",
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs ${tones[tone]}`}>{children}</span>;
};

// ---- Main Component ----
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [meetings, setMeetings] = useState([
    { id: 1, title: "HR Sync", start: new Date() },
    { id: 2, title: "Budget Review", start: new Date() },
    { id: 3, title: "Hiring Plan", start: new Date() },
  ]);
  const [unreadEmails] = useState(12);
  const [pendingApprovals] = useState(7);

  const totalEmployees = genderData.reduce((acc, x) => acc + x.value, 0);

  // Badge counts dynamically derived from state
  const badgeCounts = {
    meetings: meetings.length,
    emails: unreadEmails,
    approvals: pendingApprovals,
  };

  // ---- Render content based on active tab ----
  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 ml-20 mr-20 gap-10 mt-6 mb-6">
              <Kpi label="Total Employees" value={totalEmployees} delta="+8" icon={Users} />
              <Kpi label="Monthly Payroll" value="$250k" delta="+10" icon={CreditCard} />
              <Kpi label="Pending Approvals" value={pendingApprovals} delta="+2" icon={FileText} />
            </div>

            {/* Stat Cards */}
            <Card className="p-5 lg:col-span-1">
              <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-3">
                <StatCard title="Total Employees" amount={totalEmployees} percent={100} up />
                <StatCard title="Shortlisted" amount={20} percent={27} up />
                <StatCard title="Rejected" amount={15} percent={11} up={false} />
              </div>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
              {/* Pie Chart */}
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Workforce Composition</h2>
                  <Badge tone="info">This quarter</Badge>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genderData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={55}>
                        {genderData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-sm text-gray-500">Total: {totalEmployees}</div>
              </Card>

              {/* Bar Chart */}
              <Card className="p-5 lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Project Status</h2>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectStatus}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#3bbeffff" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Leave Widget */}
              <Card className="p-5">
                <h2 className="font-semibold mb-3">Employees on Leave Today</h2>
                <ul className="space-y-3 text-sm">
                  {[
                    { n: "Sai Ramm", r: "Engineer", t: "Only Today" },
                    { n: "Alice", r: "Architect", t: "14th to 16th" },
                    { n: "Mark", r: "Engineer", t: "Only Today" },
                  ].map((p) => (
                    <li key={p.n} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.n}</div>
                        <div className="text-xs text-gray-500">{p.r}</div>
                      </div>
                      <span className="text-rose-600 text-xs font-medium">{p.t}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        );

      case "Calendar & Meetings":
        return <Calendarandmeeting meetings={meetings} setMeetings={setMeetings} />;
      case "Profile":
        return (<AdminProfilePage/>);
      case "Email Notifications":
        return <div className="p-4">📧 You have {unreadEmails} unread emails</div>;
      case "Interview Panel":
        return <Interviewpanel/>;
      case "Candidate Management":
        return <Candidatemanagement/>;
        
      case "Offer Letter Generator":
        return <OfferLetter/>;  
        
      case "Joining Formalities":
        return <Joiningformalities/>;
      case "Task Management":
        return <AdminTaskAssignment/>
      case "Leave Management":
        return <Leavemanagement/>;
      case "Payslip Generator":
        return <Payslip/>;
      case "User Management":
        return <Usermanagement/>;
      case "Role Management":
        return <Rolemanagement/>;
        case "Work Reports":
        return <Workreports/>;   
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar */}
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        badgeCounts={badgeCounts} // ✅ dynamic counts
      />

      {/* Main Content */}
      <main className={`flex-1 p-2 md:p-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
       

        {/* Dynamic Tab Content */}
        <div className="mt-6">{renderContent()}</div>

        {/* Footer */}
        <footer className="text-xs text-gray-500 p-4 text-right">
          © {new Date().getFullYear()} HRMS Admin Dashboard UI
        </footer>
      </main>
    </div>
  );
}