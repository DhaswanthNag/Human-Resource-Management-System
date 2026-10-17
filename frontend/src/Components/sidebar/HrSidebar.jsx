
import React, { useRef } from "react";
// import { useNavigate } from "react-router-dom";

import {
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
  LayoutDashboard,
  PanelLeft, // Icon for the toggle button
} from "lucide-react";

export default function HrSidebar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) {
  // const navigate = useNavigate();
  const sidebarRef = useRef(null); // Create a ref for the sidebar element

  // Effect to handle clicks outside of the sidebar
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
  //       setSidebarOpen(false);
  //     }
  //   };

  //   if (sidebarOpen) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [sidebarOpen, setSidebarOpen]);

  // const handleLogout = () => {
  //   // Clear any stored authentication data
  //   localStorage.removeItem("authToken");
  //   localStorage.removeItem("userRole");
  //   localStorage.removeItem("userData");

  //   // Redirect to login page immediately
  //   navigate("/login");
  // };

  const menuItems = [
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
  ];

  return (
    <aside
      ref={sidebarRef} // Attach the ref to the sidebar
      className={`fixed left-0 top-20 z-40 flex h-[calc(100vh-5rem)] flex-col overflow-hidden border-r border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out ${
        sidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Button to toggle the sidebar open/closed state */}
      <div className={`flex shrink-0 items-center border-b border-gray-100 px-4 py-4 ${sidebarOpen ? "justify-between" : "justify-center"}`}>
        {sidebarOpen && (
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
            Human Resources
          </span>
        )}
        <button
          type="button"
          onClick={() => setSidebarOpen((s) => !s)}
          className="rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
        >
          <PanelLeft size={21} />
        </button>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4 pb-8 text-sm" aria-label="HR navigation">
        {menuItems.map(({ icon: Icon, label }) => (
          <div
            key={label}
            role="button"
            tabIndex={0}
            title={!sidebarOpen ? label : undefined}
            aria-current={activeTab === label ? "page" : undefined}
            onClick={() => setActiveTab(label)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setActiveTab(label);
              }
            }}
            className={`group relative flex min-h-11 items-center rounded-xl py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
              sidebarOpen ? "gap-3 px-3" : "justify-center px-2"
            } ${
              activeTab === label
                ? "bg-yellow-400 font-semibold text-gray-950 shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
            }`}
          >
            <Icon size={19} className="shrink-0" />
            {sidebarOpen && (
              <span className="truncate text-sm">{label}</span>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
