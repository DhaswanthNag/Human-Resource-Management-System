// src/pages/Homepage.jsx
import React, { useState } from "react";
import { FaHome, FaSignInAlt } from "react-icons/fa";
import LoginForm from "./LoginForm";
import logo from "../assets/logo.png"; 

const Homepage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState("home");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 bg-blue-500 text-black shadow-lg h-full`}
      >
        {/* Header with toggle */}
        <div className="flex items-center justify-between p-2 border-b border-blue-700">
            <button
                onClick={() => setSidebarOpen((s) => !s)}
                className="p-3 rounded-lg text-xl text-black hover:bg-blue-700 ml-1 mt-4"
            >
                ☰
            </button>
            <div className="flex items-center gap-2">
            {sidebarOpen && (
                <img src={logo} alt="Logo" className="h-14 w-auto mr-5 mt-3" />
            )}
            </div>
        </div>

        {/* Navigation */}
        <nav className="mt-4 ml-2 flex flex-col space-y-2">
          <button
            onClick={() => setActivePage("home")}
            className="flex items-center gap-3 px-4 py-2 text-xl rounded-md hover:bg-blue-700 transition-colors text-left"
          >
            <FaHome size={18} />
            {sidebarOpen && <span>Home</span>}
          </button>
          <button
            onClick={() => setActivePage("login")}
            className="flex items-center gap-3 px-4 py-2 text-xl rounded-md hover:bg-blue-700 transition-colors text-left"
          >
            <FaSignInAlt size={18} />
            {sidebarOpen && <span>Login</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        {/* Top Navbar */}
        <div
          className="flex text-white px-4 py-6 shadow-md"
          style={{ backgroundColor: "#2a1e9aff" }}
        >
          <h1 className="mx-auto text-2xl md:text-3xl font-bold">
            Human Resource Management System
          </h1>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-0">
          {activePage === "home" && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Welcome to HRMS
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Our Human Resource Management System helps organizations
                streamline employee management, payroll, attendance, and more.
                Use the sidebar to navigate to different sections.
              </p>
            </section>
          )}

          {activePage === "login" && (
            <section>
              <LoginForm />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Homepage;
