import React, {useRef } from "react";
import {
  LayoutDashboard,
  Upload,
  ClipboardList,
  CalendarDays,
  Mail,
  CreditCard,
  BarChart2,
  CalendarX,
  PanelLeft, // Icon for the toggle button
} from "lucide-react";

const SidebarItem = ({ icon: Icon, label, active, onClick, isSidebarOpen, className = "" }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors text-lg hover:scale-105
      ${
        active
          ? "bg-gray-700 text-white"
          : "text-black hover:bg-gray-200 hover:text-black"
      }
      ${!isSidebarOpen && "overflow-hidden"}
    `}
  >
    <Icon size={18} className={className} />
    {isSidebarOpen && <span className={`text-lg ${className}`}>{label}</span>}
  </div>
);

const EmployeeSidebar = ({ isSidebarOpen, setIsSidebarOpen, activeTab, setActiveTab }) => {
  const sidebarRef = useRef(null); // Create a ref for the sidebar element

  // Effect to handle clicks outside of the sidebar
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
  //       setIsSidebarOpen(false);
  //     }
  //   };

  //   if (isSidebarOpen) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, [isSidebarOpen, setIsSidebarOpen]);


  return (
    <aside
      ref={sidebarRef} // Attach the ref to the sidebar
      className={`${
        isSidebarOpen ? "w-66" : "w-19"
      } transition-all duration-300 bg-gray-100 border-gray-100 shadow-sm fixed left-0 top-20 h-full z-50`}
    >
      {/* Sidebar header */}
      <div className="flex items-center p-4">
        <button
          onClick={() => setIsSidebarOpen((s) => !s)}
          className="p-2 rounded-lg text-gray-800 hover:bg-gray-200"
        >
          <PanelLeft size={22} />
        </button>
      </div>

      {/* Sidebar navigation */}
      <nav className="px-2 pb-2 pt-0 space-y-1 text-sm bg-gray-100 h-full">
        <SidebarItem
          icon={LayoutDashboard}
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
          active={activeTab === "Leave Management"}
          onClick={() => setActiveTab("Leave Management")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={BarChart2}
          label="Work Reports"
          active={activeTab === "Work Reports"}
          onClick={() => setActiveTab("Work Reports")}
          isSidebarOpen={isSidebarOpen}
        />
        <SidebarItem
          icon={CreditCard}
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
    </aside>
  );
};

export default EmployeeSidebar;
