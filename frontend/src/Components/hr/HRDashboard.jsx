// src/Components/hr/HRDashboard.jsx
import React, {useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate for redirection
import HrSidebar from "../sidebar/HrSidebar";
import Calendarandmeeting from "./Calendarandmeeting";
import Offerletter from "./Offerletter"; // ✅ Import your OfferLetter component
import Payslip from "./Payslip";
import Joiningformalities from "./Joiningformalities";
import CandidateManagement from "./CandidateManagement"
import Workreports from "./Workreports"
import Leavemanagement from "./Leavemanagement"
import HRProfilePage from "./Profile";
import HREmailNotifications from "./EmailNotifications";
import HRTaskManagement from "./Taskmanagement";
import {
  Users,
  Clock,
  // FileText,
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
import logo from "../../assets/logo.png";
import axios from "axios"; // ✅ Added for fetching shortlisted/rejected candidates

// ✅ Added Navbar (same as AdminDashboard)
const Navbar = ({ onProfileSettings, onLogout, profilePhoto }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky bg-gradient-to-r from-white via-gray-400 to-gray-100 flex items-center justify-between h-20 px-8 fixed top-0 left-0 right-0 z-30 select-none">
      {/* Left logo */}
      <div className="flex items-center">
        <img src={logo} alt="Logo" className="h-11 w-auto mr-2" />
      </div>

      {/* Centered text */}
      <div className="flex-1 text-center">
        <span className="font-extrabold text-3xl text-gray-700 tracking-wide drop-shadow-lg select-text">
          HRMS HR
        </span>
      </div>

      {/* Right profile dropdown */}
      <div className="relative">
        <button
          className="flex items-center focus:outline-none"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img
            src={profilePhoto}
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover border-2 border-black shadow-md"
          />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-white rounded shadow-lg border py-2">
            <button
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setDropdownOpen(false);
                onProfileSettings();
              }}
            >
              Profile Settings
            </button>
            <button
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setDropdownOpen(false);
                onLogout();
              }}
            >
              Attendance
            </button>
            <button
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setDropdownOpen(false);
                onLogout();
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

// ---- Mock Data ----
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

const Card = ({ className = "", children }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
    {children}
  </div>
);

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigate = useNavigate(); // ✅ Initialize useNavigate

  const [meetings, setMeetings] = useState([
    { id: 1, title: "HR Sync", start: new Date() },
    { id: 2, title: "Budget Review", start: new Date() },
    { id: 3, title: "Hiring Plan", start: new Date() },
  ]);
  const [unreadEmails] = useState(12);

  const [shortlistedCount, setShortlistedCount] = useState(0); // ✅ new
  const [rejectedCount, setRejectedCount] = useState(0); // ✅ new

  // State for role management statistics (automatically updated by rolemanagement.jsx)
  const [roleStats, setRoleStats] = useState({
    totalRoles: 0,
    membersThisMonth: 0,
    lastUpdated: ''
  });

  const totalEmployees = genderData.reduce((acc, x) => acc + x.value, 0);

  // Fetch role statistics from localStorage (updated by RoleManagement component)
  const fetchRoleStats = () => {
    try {
      const storedStats = localStorage.getItem('dashboardStats');
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        setRoleStats({
          totalRoles: stats.totalRoles || 0,
          membersThisMonth: stats.membersThisMonth || 0,
          lastUpdated: stats.lastUpdated || ''
        });
      }
    } catch (error) {
      console.error('Error fetching role stats:', error);
    }
  };

  // Fetch shortlisted/rejected candidates
  const fetchShortlistedCandidates = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/interviews/shortlist");
      const data = response.data;

      const shortlisted = data.filter((c) => c.status === "shortlisted");
      const rejected = data.filter((c) => c.status === "rejected");

      setShortlistedCount(shortlisted.length);
      setRejectedCount(rejected.length);
    } catch (error) {
      console.error("Error fetching shortlisted/rejected candidates:", error);
    }
  };

  useEffect(() => {
    fetchShortlistedCandidates();
    fetchRoleStats(); // Initial fetch of role statistics

    // Set up interval to automatically refresh role stats from rolemanagement.jsx
    const statsInterval = setInterval(() => {
      fetchRoleStats();
    }, 2000); // Refresh every 2 seconds for real-time updates

    const candidatesInterval = setInterval(() => {
      fetchShortlistedCandidates();
    }, 30000); // refresh every 30s

    return () => {
      clearInterval(statsInterval);
      clearInterval(candidatesInterval);
    };
  }, []);

  const handleProfileSettings = () => setActiveTab('Profile');

  // ✅ Modified handleLogout to navigate to the login page and prevent going back
  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('hrAuthToken');

    // Replace the current entry in history stack to prevent going back
    navigate('/login', { replace: true });

    // Optional: Force reload to clear any remaining state
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <>
            {/* Management Statistics Card - Automatically updated by rolemanagement.jsx */}
            <Card className="p-5 mb-4 mr-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg"> Management Overview</h2>
              </div>
              <div className="grid gap-6 grid-cols-2 md:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Statistics</h3>
                  <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-700">
                      <Users size={16} />
                      Total Roles:
                    </span>
                    <span className="font-semibold text-gray-600">{roleStats.totalRoles}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Plus size={16} /> {/* Icon for Roles Added This Month */}
                      Roles Added This Month:
                    </span>
                    <span className="font-semibold text-green-600">+{roleStats.membersThisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} /> {/* Icon for Last Updated */}
                      Last Updated:
                    </span>
                    <span className="text-xs text-gray-500">
                      {roleStats.lastUpdated
                        ? new Date(roleStats.lastUpdated).toLocaleTimeString()
                        : "Never"}
                    </span>
                  </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Monthly Progress</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Monthly Target: 10 roles</span>
                      <span className="text-sm font-semibold">
                        {Math.round((roleStats.membersThisMonth / 10) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((roleStats.membersThisMonth / 10) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {roleStats.membersThisMonth} out of 10 roles added this month
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Payrolls</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-600">
                        <CreditCard size={16} /> {/* Icon */}
                        Monthly Payrolls
                      </span>
                      <span className="font-semibold text-gray-700">{roleStats.membersThisMonth}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 lg:col-span-1 mr-6">
              <div className="mt-0 grid gap-6 grid-cols-1 md:grid-cols-3">
                <StatCard title="Total Employees" amount={totalEmployees} percent={100} up />
                <StatCard
                  title="Shortlisted"
                  amount={shortlistedCount}
                  percent={Math.round((shortlistedCount / (shortlistedCount + rejectedCount || 1)) * 100)}
                  up
                />
                <StatCard
                  title="Rejected"
                  amount={rejectedCount}
                  percent={Math.round((rejectedCount / (shortlistedCount + rejectedCount || 1)) * 100)}
                  up={false}
                />
              </div>
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6 mr-6">
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Workforce Composition</h2>
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
      case "Profile":
        return <HRProfilePage />;
      case "Calendar & Meetings":
        return (
          <Calendarandmeeting meetings={meetings} setMeetings={setMeetings} />
        );
      case "Candidate Management":
        return <CandidateManagement />;
      case "Joining Formalities":
        return <Joiningformalities />;
      case "Leave Management":
        return <Leavemanagement />;
      case "Interview Panel":
        return <Interviewpanel />;
      case "Payslip Generator":
        return <Payslip />;
      case "Task Management": // ✅ fixed label
        return <HRTaskManagement />;
      case "Offer Letter Generator":
        return <Offerletter />;
      case "Work Reports":
        return <Workreports />;
      case "Email Notifications":
        return <HREmailNotifications/>;
      default:
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold">{activeTab}</h2>
            <p>Content for {activeTab}</p>
          </div>
        );
    }
  };

  const profilePhoto =
    "https://i.pinimg.com/736x/2c/36/88/2c3688d7e305ec9057d76f2d0e567e4a.jpg";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      {/* ✅ Navbar added */}
      <Navbar
        onProfileSettings={handleProfileSettings}
        onLogout={handleLogout}
        profilePhoto={profilePhoto}
      />

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
        className={`flex-1 p-2 md:p-0 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        } mt-0`}
        style={{ paddingLeft: sidebarOpen ? "2rem" : "1rem" }}
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