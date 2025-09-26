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
  LogOut,
  LayoutDashboard,
} from "lucide-react";

export default function HrSidebar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) {
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
        sidebarOpen ? "w-66" : "w-20"
      } transition-all duration-300 bg-gray-900 border-gray-100 shadow-sm fixed left-0 top-0 h-full`}
    >
      <div className="flex items-center justify-between p-3">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-lg text-xl text-white hover:bg-gray-700 ml-2"
        >
          ☰
        </button>
        <div className="flex items-center gap-2">
          {sidebarOpen && (
            <img src={logo} alt="Logo" className="h-14 w-auto mr-5" />
          )}
        </div>
      </div>

      <nav className="px-2 pb-2 pt-2 space-y-1 text-sm bg-gray-900 h-full">
        {[
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
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors
              ${
                activeTab === label
                  ? "bg-blue-600 text-white text-lg"
                  : "text-gray-300 text-lg hover:bg-gray-700 hover:text-blue-500 hover:scale-105"
              }`}
          >
            <Icon size={18} />
            {sidebarOpen && <span>{label}</span>}
          </div>
        ))}
        <div
          className="flex items-center text-xl gap-2 mt-4 px-4 rounded-xl hover:text-red-500 cursor-pointer text-red-600"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          {sidebarOpen && <span>Log out</span>}
        </div>
      </nav>
    </aside>
  );
}