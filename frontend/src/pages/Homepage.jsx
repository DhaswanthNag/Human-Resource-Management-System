// src/pages/Homepage.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import logo from "../assets/logo.png";
import {
  FaClock,
  FaAward,
  FaUsers,
  FaChartBar,
  FaCalendarAlt,
  FaUserShield, FaArrowRight, FaHandsHelping, FaLightbulb, FaRocket
} from "react-icons/fa";

const Homepage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close sidebar when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    }

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  // Always scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Smooth scroll to section
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 z-30 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <span className="font-bold text-lg text-gray-800 p-3.5">HRMS</span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-600 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        <nav className="flex flex-col p-4 gap-2 text-gray-700">
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              setIsSidebarOpen(false);
            }}
            className="text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-800 font-medium"
          >
            Home
          </button>
          <button
            onClick={() => {
              scrollToSection("features");
              setIsSidebarOpen(false);
            }}
            className="text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-800 font-medium"
          >
            Features
          </button>
          <button
            onClick={() => {
              scrollToSection("about");
              setIsSidebarOpen(false);
            }}
            className="text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-800 font-medium"
          >
            About
          </button>
          <button
            onClick={() => {
              scrollToSection("contact");
              setIsSidebarOpen(false);
            }}
            className="text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-800 font-medium"
          >
            Contact
          </button>
          <div className="border-t border-gray-200 my-2"></div>
          <button
            onClick={() => {
              navigate("/login");
              setIsSidebarOpen(false);
            }}
            className="text-left px-4 py-3 rounded-lg bg-yellow-500 text-gray-900 hover:bg-yellow-600 transition-colors font-medium mt-2"
          >
            Login
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full">
        {/* Navbar */}
        <header className={`flex items-center px-6 py-5 fixed w-full top-0 z-20 transition-all duration-300 ${isScrolled ? 'shadow-sm bg-gradient-to-r from-gray-100 via-gray-400 to-gray-600' : 'shadow-sm bg-gradient-to-r from-gray-100 via-gray-400 to-gray-600 backdrop-blur-sm'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-gray-800 hover:text-yellow-600 transition-colors"
            >
              <FaBars size={22} />
            </button>
            <img
              src={logo}
              alt="Logo"
              className="h-12 w-auto ml-4 shrink-0 transform scale-[1.5] origin-left"
            />

          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center absolute left-1/2 transform -translate-x-1/2 gap-8 text-lg text-gray-800">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="hover:text-yellow-300 transition-colors font-medium"
            >
              Home
            </button>
            <button onClick={() => scrollToSection("features")} className="hover:text-yellow-300 transition-colors font-medium">Features</button>
            <button onClick={() => scrollToSection("about")} className="hover:text-yellow-300 transition-colors font-medium">About</button>
            <button onClick={() => scrollToSection("contact")} className="hover:text-yellow-300 transition-colors font-medium">Contact</button>
          </nav>

          {/* Login Button Desktop */}
          <div className="ml-auto">
            <Link
              to="/login"
              className="hidden md:flex items-center px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow-sm"
            >
              Login
            </Link>
          </div>
        </header>

        {/* Page Sections */}
        <main className="mt-16 flex-1">
          {/* Home Section */}
          <section
            id="home"
            className="flex flex-col items-center justify-center text-center px-6 pt-28 pb-24 bg-gradient-to-b from-white to-gray-100"
          >
            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Modernize Your
            </h1>
            <span className="text-5xl md:text-6xl font-bold text-yellow-500 mb-8">
              HR Management
            </span>

            {/* Subtitle */}
            <p className="text-gray-600 text-lg md:text-xl max-w-4xl mb-10 leading-relaxed">
              Streamline employee management, automate workflows, and make
              data-driven decisions with our comprehensive HR management
              platform (HRMS) designed for modern businesses.
            </p>

            {/* Quick Highlights */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-5xl mb-28">
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                  <FaUsers className="text-xl" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">Employee First</h3>
                <p className="text-sm text-gray-600">Tools designed to boost team engagement</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 text-yellow-600 mb-4">
                  <FaArrowRight className="text-xl" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">Faster Workflows</h3>
                <p className="text-sm text-gray-600">Automation that saves time & reduces errors</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex gap-4 flex-wrap justify-center">
              <button
                onClick={() => scrollToSection("features")}
                className="px-8 py-3 bg-yellow-500 text-white rounded-lg shadow-sm hover:bg-yellow-600 transition-all duration-300 flex items-center gap-2 font-medium"
              >
                Get Started <FaArrowRight />
              </button>
              {/* <button className="px-8 py-3 bg-white text-yellow-600 rounded-lg shadow-sm hover:bg-gray-50 transition-all duration-300 border border-gray-200 font-medium">
                View Demo
              </button> */}
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="px-6 py-24 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-24">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                  Everything You Need to Manage Your Team
                </h2>
                <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                  Powerful features designed to simplify HR processes and enhance employee experience
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    title: "Secure & Compliant",
                    desc: "Enterprise-grade security with GDPR and SOC 2 compliance",
                    icon: <FaUserShield className="text-xl" />,
                  },
                  {
                    title: "Real-time Updates",
                    desc: "Instant notifications and live data synchronization across all devices",
                    icon: <FaClock className="text-xl" />,
                  },
                  {
                    title: "Performance Tracking",
                    desc: "Comprehensive performance reviews and goal management system",
                    icon: <FaAward className="text-xl" />,
                  },
                  {
                    title: "Team Collaboration",
                    desc: "Built-in communication tools and project management features",
                    icon: <FaUsers className="text-xl" />,
                  },
                  {
                    title: "Advanced Analytics",
                    desc: "AI-powered insights and predictive analytics for better decisions",
                    icon: <FaChartBar className="text-xl" />,
                  },
                  {
                    title: "Smart Scheduling",
                    desc: "Automated shift planning and resource allocation optimization",
                    icon: <FaCalendarAlt className="text-xl" />,
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-100 text-yellow-600 mb-4 group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="px-6 py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">About Us</h2>
                <p className="text-gray-600 text-lg max-w-4xl mx-auto">
                  HRMS is built to simplify and automate HR processes for modern businesses.
                  We empower teams with cutting-edge tools that streamline operations, improve collaboration,
                  and unlock new opportunities for growth.
                  Our mission is to create a smarter, faster, and more human-centered approach to HR management.
                </p>
              </div>

              {/* Feature Highlights */}
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
                <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                    <FaHandsHelping className="text-2xl" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-xl mb-4">Our Mission</h3>
                  <p className="text-gray-600 text-center">
                    Empower organizations with seamless HR solutions that put people first.
                  </p>
                </div>
                <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                    <FaRocket className="text-2xl" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-xl mb-4">Innovation</h3>
                  <p className="text-gray-600 text-center">
                    We leverage the latest technology to drive efficiency and growth.
                  </p>
                </div>
                <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                    <FaUsers className="text-2xl" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-xl mb-4">Collaboration</h3>
                  <p className="text-gray-600 text-center">
                    Building stronger teams by improving communication and engagement.
                  </p>
                </div>
                <div className="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 text-yellow-600 mb-6">
                    <FaLightbulb className="text-2xl" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-xl mb-4">Vision</h3>
                  <p className="text-gray-600 text-center">
                    A future where HR is smarter, faster, and more human-centered.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="px-6 py-24 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                  Contact us
                </h2>
                <p className="text-gray-600 text-lg">
                  Have questions or need support? Reach out to our team today.
                </p>
              </div>

              <form className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-300"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Your Email"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-300"
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <textarea
                    placeholder="Your Message"
                    rows="5"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-300"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="mt-6 px-8 py-4 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition-colors duration-300 font-medium w-full md:w-auto"
                >
                  Send Message
                </button>
              </form>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
            {/* Logo and company info */}
            <div className="flex items-center mb-4 md:mb-0">
              <img
                src={logo}
                alt="Logo"
                className="h-10 w-auto mr-12 shrink-0 transform scale-[1.5] origin-left"
              />
              {/* <span className="text-xl font-semibold">HRMS</span> */}
            </div>

            {/* Centered Text */}
            <p className="text-center text-gray-300 text-sm md:text-base mb-4 md:mb-0">
              © 2025 HRMS. All rights reserved. Built with modern technology for the future of work.
            </p>

            {/* Legal links */}
            <div className="flex gap-6 text-sm">
            <a
              href="https://example.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Privacy
            </a>

            <a
              href="https://example.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Terms
            </a>

            <a
              href="https://example.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Security
            </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Homepage;