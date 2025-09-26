import React, { useState,  } from "react";
import EmployeeSidebar from "../sidebar/EmployeeSidebar";
import TaskManagement from "./Taskmanagement";
import Payslip from "./Payslip";
import Joiningformalities from "./Joiningformalities";
import Leavemanagement from "./Leavemanagement";
import EmpProfilePage from "./Profile";
import {
  // User,
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

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 place-items-center mt-10">
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
        return <EmpProfilePage/>;

      case "Tasks":
        return (
         <TaskManagement />
        );

      case "Work Reports":
        return (
          <Workreports/>
        );

      case "Payslips":
        return (
          <Payslip/>
        );

      case "Calendar":
        return <Calendarandmeeting events={events} setEvents={setEvents} />;
      case "Joining Formalities":
              return (
                <Joiningformalities />
              );
      case "Leave Management":
        return (
         <Leavemanagement/>
        );

      case "Notifications":
        return (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-3">Notifications</h2>
            <p>📩 You have no new notifications</p>
          </div>
        );

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
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar with dynamic badge */}
      <EmployeeSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        events={events}
      />

      {/* Main content */}
      <div
        className={`flex-1 overflow-auto transition-all duration-200 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="mt-6">{renderContent()}</div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;