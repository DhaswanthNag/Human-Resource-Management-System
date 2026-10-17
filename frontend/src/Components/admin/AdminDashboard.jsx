import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate for redirection
import AdminSidebar from "../sidebar/AdminSidebar";
import Calendarandmeeting from "./Calendarandmeeting";
import AdminTaskAssignment from "./Taskmanagement";
import Joiningformalities from "./Joiningformalities";
import { Users, Plus, Clock, CreditCard } from "lucide-react";
import Rolemanagement from "./Rolemanagement";
import AdminProfilePage from "./Profile";
import EmailNotifications from "./Emailnotifications";
import Attendance from "./Attendance";
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
import Candidatemanagement from "./Candidatemanagement";
import Workreports from "./Workreports";
import Leavemanagement from "./Leavemanagement";
import Usermanagement from "./Usermanagement";
import logo from "../../assets/logo.png";
import adminProfile from "../../assets/admin-profile.jpg";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

// Navbar Component
const Navbar = ({ onProfileSettings, onAttendance, onLogout, profilePhoto }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex min-h-20 w-full items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-3 shadow-sm select-none sm:px-5 md:px-8">
      {/* Left logo */}
      <div className="flex shrink-0 items-center">
        <img
          src={logo}
          alt="Logo"
          className="ml-1 h-10 w-auto shrink-0 origin-left transform scale-[1.5] sm:ml-2 sm:h-12"
        />
      </div>

      {/* Centered professional title */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-1 text-center">
        <h1 className="max-w-full text-sm font-bold leading-tight tracking-wider text-gray-800 sm:text-lg sm:tracking-[0.14em] md:text-xl">
          HRMS <span className="font-medium text-gray-500">|</span>{" "}
          <span className="whitespace-nowrap">ADMINISTRATION</span>
        </h1>
        <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2">
          <span className="h-0.5 w-4 rounded-full bg-gray-300 sm:w-8" />
          <span className="h-1 w-5 rounded-full bg-yellow-500 sm:w-8" />
          <span className="h-0.5 w-4 rounded-full bg-gray-300 sm:w-8" />
        </div>
      </div>

      {/* Right profile dropdown */}
      <div className="relative z-10 flex shrink-0 items-center">
        <button
          type="button"
          aria-label="Open admin profile menu"
          aria-expanded={dropdownOpen}
          className="rounded-full p-1 transition hover:bg-gray-100 focus:outline-none"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          <img
            src={profilePhoto || adminProfile}
            alt="Profile"
            className="h-9 w-9 rounded-full border-2 border-gray-700 object-cover shadow-sm sm:h-10 sm:w-10"
          />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-3 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-yellow-50 hover:text-gray-900"
              onClick={() => {
                setDropdownOpen(false);
                onProfileSettings();
              }}
            >
              Profile Settings
            </button>
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-yellow-50 hover:text-gray-900"
              onClick={() => {
                setDropdownOpen(false);
                onAttendance();
              }}
            >
              Attendance
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              type="button"
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
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
//  const COLORS = ["#fdb306ff", "#f6e825ff", "#ff8000ff"];
const projectStatus = [
  { name: "Completed", count: 24 },
  { name: "In Progress", count: 11 },
  { name: "On Hold", count: 3 },
  { name: "Cancelled", count: 2 },
];

const Card = ({ className = "", children }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
  >
    {children}
  </div>
);

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigate = useNavigate(); // ✅ Initialize useNavigate

  const handleAttendance = () => {
    setActiveTab("Attendance");
  };

  const [adminProfileData, setAdminProfileData] = useState({
    profilePhoto: "",
  });

  // Fetch the logged-in admin's saved profile from the backend.
  const fetchAdminProfile = useCallback(async () => {
    try {
      let token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      if (!token) {
        try {
          const userData = JSON.parse(
            localStorage.getItem("userData") || "{}"
          );
          token = userData.token || userData.authToken || "";
        } catch {
          token = "";
        }
      }

      if (!token) {
        console.warn(
          "Admin profile cannot be loaded: authentication token not found."
        );
        return;
      }

      const response = await axios.get(`${API_URL}/users/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profile =
        response.data?.profile ||
        response.data?.user ||
        response.data;

      setAdminProfileData({
        profilePhoto:
          profile?.profilePhoto || profile?.profile_photo || "",
      });
    } catch (error) {
      console.error(
        "Error fetching admin profile:",
        error.response?.data || error.message || error
      );
    }
  }, []);

  const [meetings, setMeetings] = useState([
    { id: 1, title: "HR Sync", start: new Date() },
    { id: 2, title: "Budget Review", start: new Date() },
    { id: 3, title: "Hiring Plan", start: new Date() },
  ]);
  // const [unreadEmails] = useState(12);

  const [shortlistedCount, setShortlistedCount] = useState(0); // ✅ new
  const [rejectedCount, setRejectedCount] = useState(0); // ✅ new

  // State for role management statistics (automatically updated by rolemanagement.jsx)
  const [roleStats, setRoleStats] = useState({
    totalRoles: 0,
    membersThisMonth: 0,
    lastUpdated: "",
  });

  const totalEmployees = genderData.reduce((acc, x) => acc + x.value, 0);

  // Fetch role statistics from localStorage (updated by RoleManagement component)
  const fetchRoleStats = () => {
    try {
      const storedStats = localStorage.getItem("dashboardStats");
      if (storedStats) {
        const stats = JSON.parse(storedStats);
        setRoleStats({
          totalRoles: stats.totalRoles || 0,
          membersThisMonth: stats.membersThisMonth || 0,
          lastUpdated: stats.lastUpdated || "",
        });
      }
    } catch (error) {
      console.error("Error fetching role stats:", error);
    }
  };

  // Fetch shortlisted/rejected candidates
  const fetchShortlistedCandidates = async () => {
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/interviews/shortlist`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      const data = Array.isArray(response.data) ? response.data : [];

      const shortlisted = data.filter((c) => c.status === "shortlisted");
      const rejected = data.filter((c) => c.status === "rejected");

      setShortlistedCount(shortlisted.length);
      setRejectedCount(rejected.length);
    } catch (error) {
      console.error(
        "Error fetching shortlisted/rejected candidates:",
        error.response?.data || error.message || error
      );
    }
  };

  useEffect(() => {
    fetchAdminProfile();
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
  }, [fetchAdminProfile]);

  // Refresh the navbar when the profile page reports a successful save.
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchAdminProfile();
    };

    window.addEventListener("admin-profile-updated", handleProfileUpdate);
    window.addEventListener("adminProfileUpdated", handleProfileUpdate);
    window.addEventListener("hrProfilePhotoUpdated", handleProfileUpdate);
    window.addEventListener("profilePhotoUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("admin-profile-updated", handleProfileUpdate);
      window.removeEventListener("adminProfileUpdated", handleProfileUpdate);
      window.removeEventListener("hrProfilePhotoUpdated", handleProfileUpdate);
      window.removeEventListener("profilePhotoUpdated", handleProfileUpdate);
    };
  }, [fetchAdminProfile]);

  const handleProfileSettings = () => {
    fetchAdminProfile();
    setActiveTab("Profile");
  };

  // ✅ Modified handleLogout to navigate to the login page and prevent going back
  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("user");

    // Replace the current entry in history stack to prevent going back
    navigate("/login", { replace: true });

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
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Current Statistics
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-700">
                        <Users size={16} />
                        Total Roles:
                      </span>
                      <span className="font-semibold text-gray-600">
                        {roleStats.totalRoles}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Plus size={16} /> {/* Icon for Roles Added This Month */}
                        Roles Added This Month:
                      </span>
                      <span className="font-semibold text-green-600">
                        +{roleStats.membersThisMonth}
                      </span>
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
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Monthly Progress
                  </h3>
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
                        style={{
                          width: `${Math.min(
                            (roleStats.membersThisMonth / 10) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {roleStats.membersThisMonth} out of 10 roles added this
                      month
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Current Payrolls
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-600">
                        <CreditCard size={16} /> {/* Icon */}
                        Monthly Payrolls
                      </span>
                      <span className="font-semibold text-gray-700">
                        {roleStats.membersThisMonth}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 lg:col-span-1 mr-6">
              <div className="mt-0 grid gap-6 grid-cols-1 md:grid-cols-3">
                <StatCard
                  title="Total Employees"
                  amount={totalEmployees}
                  percent={100}
                  up
                />
                <StatCard
                  title="Shortlisted"
                  amount={shortlistedCount}
                  percent={Math.round(
                    (shortlistedCount /
                      (shortlistedCount + rejectedCount || 1)) *
                      100
                  )}
                  up
                />
                <StatCard
                  title="Rejected"
                  amount={rejectedCount}
                  percent={Math.round(
                    (rejectedCount /
                      (shortlistedCount + rejectedCount || 1)) *
                      100
                  )}
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
                      <Pie
                        data={genderData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        innerRadius={55}
                      >
                        {genderData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                          />
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
                      <Bar
                        dataKey="count"
                        radius={[6, 6, 0, 0]}
                        fill="#3bbeffff"
                      />
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
      case "Calendar & Meetings":
        return <Calendarandmeeting meetings={meetings} setMeetings={setMeetings} />;
      case "Profile":
        return <AdminProfilePage />;

      case "Attendance":
        return <Attendance />;

      case "Email Notifications":
        return <EmailNotifications />;
      case "Interview Panel":
        return <Interviewpanel />;
      case "Candidate Management":
        return <Candidatemanagement />;
      case "Offer Letter Generator":
        return <OfferLetter />;
      case "Joining Formalities":
        return <Joiningformalities />;
      case "Task Management":
        return <AdminTaskAssignment />;
      case "Leave Management":
        return <Leavemanagement />;
      case "Payslip Generator":
        return <Payslip />;
      case "User Management":
        return <Usermanagement />;
      case "Role Management":
        return <Rolemanagement />;
      case "Work Reports":
        return <Workreports />;
      default:
        return null;
    }
  };

  const profilePhoto = adminProfileData.profilePhoto || adminProfile;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      <Navbar
        onProfileSettings={handleProfileSettings}
        onAttendance={handleAttendance}
        onLogout={handleLogout}
        profilePhoto={profilePhoto}
      />
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      {/* Main */}
      <main
        className={`min-h-screen min-w-0 flex-1 pt-24 px-6 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="mt-2">{renderContent()}</div>

        <footer className="text-xs text-gray-500 p-4 text-right">
          © {new Date().getFullYear()} HRMS Admin Dashboard UI
        </footer>
      </main>
    </div>
  );
}
