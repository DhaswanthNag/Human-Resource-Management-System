import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import {
  User,
  FileText,
  Upload,
  ClipboardList,
  CalendarDays,
  Mail,
  Briefcase,
  LogOut,
  Activity,
  Menu,
  CalendarX,
} from "lucide-react";

const SidebarItem = ({ icon: Icon, label, active, onClick, isSidebarOpen, className = "" }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors
      ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-blue-500 hover:scale-105"
      }`}
  >
    <Icon size={18} className={className} />
    {isSidebarOpen && (
      <span className={`text-lg ${className}`}>{label}</span>
    )}
  </div>
);

const EmployeeSidebar = ({ isSidebarOpen, setIsSidebarOpen, activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userData");
    
    // Redirect to login page immediately
    navigate("/login");
  };

  return (
    <aside
      className={`${
        isSidebarOpen ? "w-64" : "w-20"
      } transition-all duration-300 bg-gray-900 text-white fixed left-0 top-0 h-full`}
    >
      {/* Sidebar header */}
      <div className="flex items-center justify-between bg-gray-900 p-3">
        <button
          onClick={() => setIsSidebarOpen((s) => !s)}
          className="p-2 rounded-lg text-xl text-white hover:bg-gray-700"
        >
          <Menu size={20} />
        </button>
        {isSidebarOpen && (
          <img src={logo} alt="Logo" className="h-14 w-auto mr-16" />
        )}
      </div>

      {/* Sidebar navigation */}
      <nav className="mt-4 ml-2 flex-1 space-y-1 px-2">
        <SidebarItem
          icon={User}
          label="Profile"
          active={activeTab === "Profile"}
          onClick={() => setActiveTab("Profile")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={Activity}
          label="Dashboard"
          active={activeTab === "Dashboard"}
          onClick={() => setActiveTab("Dashboard")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={Upload}
          label="Joining Formalities"
          active={activeTab === "Joining Formalities"}
          onClick={() => setActiveTab("Joining Formalities")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={ClipboardList}
          label="Tasks"
          active={activeTab === "Tasks"}
          onClick={() => setActiveTab("Tasks")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={CalendarX}
          label="Leave Management"
          active={activeTab === "Leavemanagement"}
          onClick={() => setActiveTab("Leave Management")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={FileText}
          label="Work Reports"
          active={activeTab === "Work Reports"}
          onClick={() => setActiveTab("Work Reports")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={Briefcase}
          label="Payslips"
          active={activeTab === "Payslips"}
          onClick={() => setActiveTab("Payslips")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={CalendarDays}
          label="Calendar"
          active={activeTab === "Calendar"}
          onClick={() => setActiveTab("Calendar")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={Mail}
          label="Notifications"
          active={activeTab === "Notifications"}
          onClick={() => setActiveTab("Notifications")}
          isSidebarOpen={isSidebarOpen}
        />
      </nav>

      {/* Logout */}
      <div className="p-2 ml-2 mt-0 mb-4">
        <SidebarItem
          icon={LogOut}
          label="Logout"
          isSidebarOpen={isSidebarOpen}
          className="text-red-500"
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
};

export default EmployeeSidebar;