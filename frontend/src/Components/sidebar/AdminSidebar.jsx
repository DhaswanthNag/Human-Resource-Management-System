import React, { useRef } from "react";
// import { useNavigate } from "react-router-dom";
import {
  // User,
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
  LayoutDashboard,
  PanelLeft, // Icon for the toggle button
} from "lucide-react";

export default function AdminSidebar({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab }) {
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
    { icon: UserCircle, label: "User Management" },
    { icon: ShieldCheck, label: "Role Management" },
  ];

  return (
    <aside
      ref={sidebarRef} // Attach the ref to the sidebar
      className={`${
        sidebarOpen ? "w-66" : "w-19"
      } transition-all duration-300 bg-gray-100 border-gray-100 shadow-sm fixed left-0 top-20 h-full z-50`}
    >
      {/* Button to toggle the sidebar open/closed state */}
      <div className="flex items-center p-4">
        <button
          onClick={() => setSidebarOpen((s) => !s)}
          className="p-2 rounded-lg text-gray-800 hover:bg-gray-200"
        >
          <PanelLeft size={22} />
        </button>
      </div>

      <nav className="px-2 pb-2 pt-0 space-y-1 text-sm bg-gray-100 h-full">
        {menuItems.map(({ icon: Icon, label }) => (
          <div
            key={label}
            onClick={() => setActiveTab(label)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors text-lg hover:scale-105
              ${
                activeTab === label
                  ? "bg-gray-700 text-white"
                  : "text-black hover:bg-gray-200 hover:text-black"
              }
              // Add a class to handle overflow for a clean look when collapsed
              ${!sidebarOpen && "overflow-hidden"}
              `}
          >
            <Icon size={18} />
            {sidebarOpen && <span>{label}</span>}
          </div>
        ))}
      </nav>
    </aside>
  );
}