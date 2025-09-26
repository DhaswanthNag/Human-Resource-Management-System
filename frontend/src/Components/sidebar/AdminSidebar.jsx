import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import {
  User,
  Users,
  UserRoundCog,
  FilePen,
  FileCheck,
  ListCheck,
  BarChart2,
  CalendarX,
  CreditCard,
  Calendar,
  Mail,
  UserCircle,
  ShieldCheck,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

export default function AdminSidebar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userData");
    
    // Redirect to login page immediately
    navigate("/login");
  };

  const menuItems = [
    { icon: User, label: "Profile" },
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Users, label: "Interview Panel" },
    { icon: UserRoundCog, label: "Candidate Management" },
    { icon: FilePen, label: "Offer Letter Generator" },
    { icon: FileCheck, label: "Joining Formalities" },
    { icon: ListCheck, label: "Task Management" },
    { icon: BarChart2, label: "Work Reports" },
    { icon: CalendarX, label: "Leave Management" },
    { icon: CreditCard, label: "Payslip Generator" },
    { icon: Calendar, label: "Calendar & Meetings" },
    { icon: Mail, label: "Email Notifications" },
    { icon: UserCircle, label: "User Management" },
    { icon: ShieldCheck, label: "Role Management" },
  ];

  return (
    <aside
      className={`${
        sidebarOpen ? "w-66" : "w-20"
      } transition-all duration-300 bg-gray-900 border-gray-100 shadow-sm fixed left-0 top-0 h-full`}
    >
      {/* Header with toggle and logo */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-lg text-xl text-white hover:bg-gray-700 ml-2"
        >
          ☰
        </button>
        <div className="flex items-center gap-2">
          {sidebarOpen && <img src={logo} alt="Logo" className="h-14 w-auto mr-5" />}
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-2 pb-2 pt-2 space-y-1 text-sm bg-gray-900 h-full">
        {menuItems.map(({ icon: Icon, label }) => (
          <div
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors text-lg hover:scale-105
              ${
                activeTab === label
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-blue-500"
              }`}
          >
            <Icon size={18} />
            {sidebarOpen && <span>{label}</span>}
          </div>
        ))}

        {/* Logout */}
        <div 
          className="flex items-center text-lg gap-2 px-4 py-2 rounded-md cursor-pointer text-rose-600 hover:text-red-500 hover:scale-105 hover:bg-gray-700"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          {sidebarOpen && <span>Log out</span>}
        </div>
      </nav>
    </aside>
  );
}