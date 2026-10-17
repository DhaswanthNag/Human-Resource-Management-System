import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeSidebar from "../sidebar/EmployeeSidebar";
import TaskManagement from "./Taskmanagement";
import Payslip from "./Payslip";
import Joiningformalities from "./Joiningformalities";
import Leavemanagement from "./Leavemanagement";
import EmpProfilePage from "./Profile";
import EmployeeEmailNotifications from "./Emailnotifications";
import Attendance from "./Attendance";
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

// Navbar Component
const Navbar = ({
  onProfileSettings,
  onAttendance,
  onLogout,
  profilePhoto,
}) => {
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
          <span className="whitespace-nowrap">EMPLOYEE PORTAL</span>
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
          aria-label="Open employee profile menu"
          aria-expanded={dropdownOpen}
          className="rounded-full p-1 transition hover:bg-gray-100 focus:outline-none"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          <img
            key={profilePhoto || "default-employee-avatar"}
            src={
              profilePhoto ||
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='50' fill='%23e5e7eb'/%3E%3Ccircle cx='50' cy='37' r='18' fill='%239ca3af'/%3E%3Cpath d='M15 92c2-22 16-33 35-33s33 11 35 33' fill='%239ca3af'/%3E%3C/svg%3E"
            }
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

  // Load the profile photo belonging to the logged-in employee.
  const loadProfilePhoto = useCallback(() => {
    return (
      localStorage.getItem("employeeProfilePhoto") ||
      localStorage.getItem("profilePhoto") ||
      ""
    );
  }, []);

  const [profilePhoto, setProfilePhoto] = useState("");

  // Load the saved profile photo from the database after login.
  useEffect(() => {
    let isMounted = true;

    const fetchProfilePhoto = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("userData") || "{}");
        const token =
          localStorage.getItem("employeeAuthToken") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("token") ||
          storedUser.token ||
          storedUser.authToken ||
          "";

        if (!token) {
          if (isMounted) {
            setProfilePhoto("");
          }
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/users/profile/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load employee profile photo.");
        }

        const result = await response.json();
        const profile = result.profile || result.user || result;

        const photo =
          profile.profilePhoto ||
          profile.profile_photo ||
          profile.photo ||
          "";

        if (!isMounted) return;

        setProfilePhoto(photo);

        if (photo) {
          localStorage.setItem("employeeProfilePhoto", photo);
          localStorage.setItem("profilePhoto", photo);
        } else {
          localStorage.removeItem("employeeProfilePhoto");
          localStorage.removeItem("profilePhoto");
        }
      } catch (error) {
        console.error("Error loading employee profile photo:", error);

        if (isMounted) {
          setProfilePhoto(loadProfilePhoto());
        }
      }
    };

    fetchProfilePhoto();

    return () => {
      isMounted = false;
    };
  }, [loadProfilePhoto]);

  useEffect(() => {
    const handleProfilePhotoUpdate = (event) => {
      if (
        event.key === "employeeProfilePhoto" ||
        event.key === "profilePhoto"
      ) {
        setProfilePhoto(loadProfilePhoto());
      }
    };

    const handleProfileUpdated = () => {
      setProfilePhoto(loadProfilePhoto());
    };

    window.addEventListener("storage", handleProfilePhotoUpdate);
    window.addEventListener("employeeProfileUpdated", handleProfileUpdated);

    return () => {
      window.removeEventListener("storage", handleProfilePhotoUpdate);
      window.removeEventListener("employeeProfileUpdated", handleProfileUpdated);
    };
  }, [loadProfilePhoto]);

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

  const handleAttendance = () => setActiveTab("Attendance");

  // ✅ Modified handleLogout to navigate to the login page and prevent going back
  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem("authToken");
    localStorage.removeItem("token");
    localStorage.removeItem("userData");
    localStorage.removeItem("employeeAuthToken");
    localStorage.removeItem("hrAuthToken");
    localStorage.removeItem("employeeProfilePhoto");
    localStorage.removeItem("profilePhoto");

    setProfilePhoto("");

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
              icon={CalendarDays}
              label="Attendance"
              desc="Check in, check out, and view your attendance history."
              onClick={() => setActiveTab("Attendance")}
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

      case "Attendance":
        return <Attendance />;

      case "Notifications":
        return <EmployeeEmailNotifications />;

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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 relative">
      <Navbar
        onProfileSettings={handleProfileSettings}
        onAttendance={handleAttendance}
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
        className={`min-h-screen min-w-0 flex-1 overflow-auto pt-28 px-8 transition-all duration-200 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="mt-2 min-w-0">{renderContent()}</div>

        <footer className="text-xs text-gray-500 p-4 text-right">
          © {new Date().getFullYear()} HRMS Employee Dashboard UI
        </footer>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
