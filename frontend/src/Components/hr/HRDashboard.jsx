// src/Components/hr/HRDashboard.jsx
import React, { useMemo, useState } from "react";
import HrSidebar from "../sidebar/HrSidebar";
import Calendarandmeeting from "./Calendarandmeeting";
import Offerletter from "./Offerletter"; // ✅ Import your OfferLetter component
import Payslip from "./Payslip";
import Joiningformalities from "./Joiningformalities";
import CandidateManagement from "./CandidateManagement"
import Workreports from "./Workreports"
import Leavemanagement from "./Leavemanagement"
import HRProfilePage from "./Profile";
import HRTaskManagement from "./Taskmanagement";
import {
  Users,
  FileText,
  // Search,
  // User,
  CreditCard,
  Plus,
} from "lucide-react";
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
import Interviewpanel from "./Interviewpanel";

// ---- Mock Data ----
const StatCard = ({ title, amount, percent, up }) => (
  <div className="w-full bg-white rounded-xl shadow p-4">
    <div className="text-xs text-gray-500">{title}</div>
    <div className="text-2xl font-semibold">{amount}</div>
    <div
      className={`text-xs mt-1 font-semibold ${
        up ? "text-green-500" : "text-red-500"
      }`}
    >
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

// ---- Small UI atoms ----
const Card = ({ className = "", children }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
  >
    {children}
  </div>
);

const Kpi = ({ label, value, delta, icon: Icon }) => (
  <Card className="p-5">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-gray-500 text-xs uppercase tracking-wide">
          {label}
        </div>
        <div className="text-2xl font-semibold mt-1">{value}</div>
        {delta && (
          <div
            className={`text-xs mt-1 font-medium ${
              delta.startsWith("+") ? "text-green-600" : "text-rose-600"
            }`}
          >
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

const Badge = ({ children, tone = "default" }) => {
  const tones = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
    info: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs ${tones[tone]}`}>
      {children}
    </span>
  );
};

export default function HRDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const totalEmployees = useMemo(
    () => genderData.reduce((acc, x) => acc + x.value, 0),
    []
  );

  const [meetings, setMeetings] = useState([
    { id: 1, title: "Team Sync", start: new Date() },
    { id: 2, title: "Client Call", start: new Date() },
    { id: 3, title: "Project Review", start: new Date() },
  ]);
  const [unreadEmails] = useState(7);

  // ---- Render content ----
  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <>
            {/* employees and approvals */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 ml-20 mr-20 gap-10 mt-6 mb-6">
              <Kpi
                label="Total Employees"
                value={totalEmployees}
                delta="+8"
                icon={Users}
              />
              <Kpi
                label="Monthly Payroll"
                value={"$120k"}
                delta="+10"
                icon={CreditCard}
              />
              <Kpi
                label="Pending Approvals"
                value={12}
                delta="+2"
                icon={FileText}
              />
            </div>

            {/* Stat cards */}
            <Card className="p-5 lg:col-span-1">
              <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-3">
                <StatCard title="Total Employees" amount="94" percent={100} up />
                <StatCard title="Shortlisted" amount="20" percent={27} up />
                <StatCard title="Rejected" amount="15" percent={11} up={false} />
              </div>
            </Card>

            {/* Charts Row */}
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
                      <Pie
                        data={genderData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        innerRadius={55}
                      >
                        {genderData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  Total: {totalEmployees}
                </div>
              </Card>

              {/* Project Status */}
              <Card className="p-5 lg:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Project Status</h2>
                  <button className="text-xs bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                    <Plus size={14} />
                    New
                  </button>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectStatus}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        fill="#3bbeffff"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Leave Widget */}
              <Card className="p-5">
                <h2 className="font-semibold mb-3">Employees on Leave Today</h2>
                <ul className="space-y-3 text-sm">
                  {[
                    { n: "Sai ramm", r: "Engineer", t: "Only Today" },
                    { n: "Alice", r: "Architect", t: "14th to 16th" },
                    { n: "Mark", r: "Engineer", t: "Only Today" },
                  ].map((p) => (
                    <li
                      key={p.n}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{p.n}</div>
                        <div className="text-xs text-gray-500">{p.r}</div>
                      </div>
                      <span className="text-rose-600 text-xs font-medium">
                        {p.t}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </>
        );
      case "Profile":
        return (<HRProfilePage/>);
      case "Calendar & Meetings":
        return (
          <Calendarandmeeting meetings={meetings} setMeetings={setMeetings} />
        );
        case "Candidate Management":
                return <CandidateManagement/>;
        case "Joining Formalities":
        return (
          <Joiningformalities />
          
        );
          case "Leave Management":
                return <Leavemanagement/>;
        case "Interview Panel":
        return (
          <Interviewpanel />
        );
        case "Payslip Generator":
        return (
          <Payslip />
        );
      
      case "Task Management": // ✅ fixed label
        return <HRTaskManagement />;

      case "Offer Letter Generator":
        return <Offerletter />;
          case "Work Reports":
        return <Workreports/>;

      case "Email Notifications":
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold">Email Notifications</h2>
            <p>📩 You have {unreadEmails} unread emails</p>
          </div>
        );

      default:
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold">{activeTab}</h2>
            <p>Content for {activeTab}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* Sidebar with badge counts */}
      <HrSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        badgeCounts={{
          meetings: meetings.length,
          emails: unreadEmails,
        }}
      />

      {/* Main */}
      <main
        className={`flex-1 p-2 md:p-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        

        {/* Dynamic Content */}
        <div className="mt-6">{renderContent()}</div>

        <footer className="text-xs text-gray-500 p-4 text-right">
          © {new Date().getFullYear()} HRMS Hr Dashboard UI
        </footer>
      </main>
    </div>
  );
}
