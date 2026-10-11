import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../sidebar/EmployeeSidebar";
import TaskManagement from "./Taskmanagement";
import Payslip from "./Payslip";
import Joiningformalities from "./Joiningformalities";
import Leavemanagement from "./Leavemanagement";
import EmpProfilePage from "./Profile";
import EmployeeEmailNotifications from "./Emailnotifications";
import {
  Upload,
  ClipboardList,
  CalendarDays,
  FileText,
  Briefcase,
  Mail,
  Activity,
  CalendarX,
} from "lucide-react";
import Calendarandmeeting from "./Calendarandmeeting";
import Workreports from "./Workreports";
import logo from "../../assets/logo.png";

// ✅ Navbar copied from AdminDashboard with title adjusted
const Navbar = ({ onProfileSettings, onLogout, profilePhoto }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky bg-gradient-to-r from-white via-gray-400 to-gray-100  flex items-center justify-between h-20 px-8 fixed top-0 left-0 right-0 z-30 select-none">
      {/* Left logo */}
      <div className="flex items-center">
        <img src={logo} alt="Logo" className="h-11 w-auto mr-2" />
      </div>

      {/* Centered text */}
      <div className="flex-1 text-center">
        <span className="font-extrabold text-3xl text-gray-700 tracking-wide drop-shadow-lg select-text">
          HRMS Employee
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

const DashboardCard = ({ icon: Icon, label, desc, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer bg-gray-100 shadow-md hover:scale-105 hover:shadow-xl transition p-6 rounded-xl flex flex-col items-center text-center w-72 h-40"
  >
    <Icon size={28} className="text-blue-600 mb-3" />
    <h3 className="font-semibold">{label}</h3>
    <p className="text-sm text-gray-500 mt-1">{desc}</p>
  </div>
);

const EmployeeDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const navigate = useNavigate();

  // ✅ Centralized events state for Calendar & Sidebar
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Team Meeting",
      start: new Date(new Date().getTime() + 1000 * 60 * 15),
      type: "internal",
      link: "https://zoom.us/j/123456789",
    },
    {
      id: 2,
      title: "Client Call",
      start: new Date(new Date().getTime() + 1000 * 60 * 60),
      type: "external",
      link: "https://meet.google.com/xyz-123",
    },
  ]);

  const handleProfileSettings = () => setActiveTab("Profile");

  // ✅ Modified handleLogout to navigate to the login page and prevent going back
  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('employeeAuthToken');

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
          <div className="grid grid-cols-1 bg-white-50 sm:grid-cols-2 lg:grid-cols-3 gap-14 place-items-center">
            <DashboardCard
              icon={Activity}
              label="View Own Activity"
              desc="Track your HR history and status."
              onClick={() => setActiveTab("Own Activity")}
            />
            <DashboardCard
              icon={Upload}
              label="Upload Documents"
              desc="Submit your files safely and securely."
              onClick={() => setActiveTab("Joining Formalities")}
            />
            <DashboardCard
              icon={ClipboardList}
              label="Update Status"
              desc="Check off tasks and track progress."
              onClick={() => setActiveTab("Tasks")}
            />
            <DashboardCard
              icon={CalendarDays}
              label="Apply for Leave"
              desc="Submit or track leave requests."
              onClick={() => setActiveTab("Leave Management")}
            />
            <DashboardCard
              icon={FileText}
              label="Work Reports"
              desc="View and download performance reports."
              onClick={() => setActiveTab("Work Reports")}
            />
            <DashboardCard
              icon={Briefcase}
              label="Download Payroll"
              desc="Download your Payslip."
              onClick={() => setActiveTab("Payslips")}
            />
            <DashboardCard
              icon={CalendarX}
              label="Meeting Invites"
              desc="Access upcoming video meetings."
              onClick={() => setActiveTab("Calendar")}
            />
            <DashboardCard
              icon={Mail}
              label="Notifications"
              desc="View system updates and alerts."
              onClick={() => setActiveTab("Notifications")}
            />
          </div>
        );

      case "Profile":
        return <EmpProfilePage />;

      case "Tasks":
        return <TaskManagement />;

      case "Work Reports":
        return <Workreports />;

      case "Payslips":
        return <Payslip />;

      case "Calendar":
        return <Calendarandmeeting events={events} setEvents={setEvents} />;

      case "Joining Formalities":
        return <Joiningformalities />;

      case "Leave Management":
        return <Leavemanagement />;

      case "Notifications":
        return <EmployeeEmailNotifications/>;

      case "Own Activity":
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-3">View Own Activity</h2>
            <p>Track your HR history and status here.</p>
          </div>
        );

      default:
        return null;
    }
  };

  const profilePhoto =
    "https://i.pinimg.com/1200x/38/79/47/387947599416cc6f6e64bd57936d730f.jpg";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      <Navbar
        onProfileSettings={handleProfileSettings}
        onLogout={handleLogout}
        profilePhoto={profilePhoto}
      />

      {/* Sidebar with dynamic badge */}
      <EmployeeSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        events={events}
      />

      {/* Main content */}
      <main
        className={`flex-1 overflow-auto transition-all duration-200 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        } mt-0`}
        style={{ paddingLeft: isSidebarOpen ? "2rem" : "1rem" }} // ✅ Match Admin layout
      >
        <div className="mt-6">{renderContent()}</div>

        <footer className="text-xs text-gray-500 p-4 text-right">
          © {new Date().getFullYear()} HRMS Employee Dashboard UI
        </footer>
      </main>
    </div>
  );
};

export default EmployeeDashboard;