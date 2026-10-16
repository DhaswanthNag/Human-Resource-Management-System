// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Page imports
import Homepage from "./pages/Homepage";
import Login from "./pages/Login"; // ✅ Make sure file exists as src/pages/LoginForm.jsx
import SetupPassword from './Components/SetupPassword';

// Dashboard imports
import AdminDashboard from "./Components/admin/AdminDashboard";   // ✅ src/Components/admin/Dashboard.jsx
import HRDashboard from "./Components/hr/HRDashboard";         // ✅ src/Components/hr/Dashboard.jsx
import EmployeeDashboard from "./Components/employee/EmployeeDashboard"; // ✅ src/Components/employee/Dashboard.jsx

// Payslip imports
import Payslip from "./Components/admin/Payslip";           // ✅ src/Components/admin/Payslip.jsx
import HRPayslip from "./Components/hr/Payslip";            // ✅ src/Components/hr/Payslip.jsx
import EmployeePayslip from "./Components/employee/Payslip"; // ✅ src/Components/employee/Payslip.jsx

// Taskmanagement imports
import AdminTaskManagement from "./Components/admin/Taskmanagement";   // ✅ src/Components/admin/Taskmanagement.jsx
import HRTaskManagement from "./Components/hr/Taskmanagement";         // ✅ src/Components/hr/Taskmanagement.jsx
import EmployeeTaskManagement from "./Components/employee/Taskmanagement"; // ✅ src/Components/employee/Taskmanagement.jsx

function App() {
  return (
    <Router>
      <Routes>
        {/* Homepage */}
        <Route path="/" element={<Homepage />} />

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Setup Password Page */}
        <Route path="/setup-password/:token" element={<SetupPassword />} />

        {/* Dashboard section */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/employee" element={<EmployeeDashboard />} />

        {/* Payslip section */}
        <Route path="/admin/payslip" element={<Payslip />} />
        <Route path="/hr/payslip" element={<HRPayslip />} />
        <Route path="/employee/payslip" element={<EmployeePayslip />} />

        {/* Task Management section */}
        <Route path="/admin/tasks" element={<AdminTaskManagement />} />
        <Route path="/hr/tasks" element={<HRTaskManagement />} />
        <Route path="/employee/tasks" element={<EmployeeTaskManagement />} />
      </Routes>
    </Router>
  );
}

export default App;
