
import React, { useRef } from "react";
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
    role="button"
    tabIndex={0}
    aria-current={active ? "page" : undefined}
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
    className={`group relative flex min-h-11 items-center rounded-xl py-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
      isSidebarOpen ? "gap-3 px-3" : "justify-center px-2"
    } ${
      active
        ? "bg-yellow-400 font-semibold text-gray-950 shadow-sm"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950"
    }`}
    title={!isSidebarOpen ? label : undefined}
  >
    <Icon size={19} className={`shrink-0 ${className}`} />
    {isSidebarOpen && <span className={`truncate text-sm ${className}`}>{label}</span>}
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
      className={`fixed left-0 top-20 z-40 flex h-[calc(100vh-5rem)] flex-col overflow-hidden border-r border-gray-200 bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Sidebar header */}
      <div className={`flex shrink-0 items-center border-b border-gray-100 px-4 py-4 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
        {isSidebarOpen && (
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
            Employee
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsSidebarOpen((s) => !s)}
          className="rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-950"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={isSidebarOpen}
        >
          <PanelLeft size={21} />
        </button>
      </div>

      {/* Sidebar navigation */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-4 pb-8 text-sm" aria-label="Employee navigation">
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
