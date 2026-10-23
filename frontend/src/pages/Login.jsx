import React, { useState } from "react";
import background from "../assets/background1.jpg"; // adjust path if file is in src/assets

import {
  FaUser,
  FaLock,
  FaCheckCircle,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // ✅ for smooth animation

const HRMSAuth = () => {
  const [mode, setMode] = useState("login");
  const [credentials, setCredentials] = useState({ userId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [swapped, setSwapped] = useState(false); // ✅ controls swap once

  const API_BASE = "http://localhost:5000/api/auth";
  const navigate = useNavigate();

  const isPasswordStrong = (password) =>
    typeof password === "string" && password.length > 0;

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // Login submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await axios.post(`${API_BASE}/login`, credentials);
      const data = res.data;

      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("userId", data.userId);

        setMessage({
          text: "Login successful! Redirecting...",
          type: "success",
        });

        setTimeout(() => {
          if (data.dashboard) {
            navigate(data.dashboard);
          } else {
            if (data.role === "admin") navigate("/admin-dashboard");
            else if (data.role === "hr") navigate("/hr-dashboard");
            else navigate("/employee-dashboard");
          }
        }, 1000);
      } else {
        setMessage({
          text: data.message || "Invalid credentials",
          type: "error",
        });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Something went wrong",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    if (!email) return setMessage({ text: "Enter your email", type: "error" });
    if (!isValidEmail(email))
      return setMessage({ text: "Enter a valid email", type: "error" });

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/send-otp`, { email });
      if (res.data.success || res.data.message === "OTP sent to email") {
        setMessage({ text: "OTP sent to your email", type: "success" });
        setMode("reset");
      } else {
        setMessage({
          text: res.data.message || "Failed to send OTP",
          type: "error",
        });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Error sending OTP",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!email) return setMessage({ text: "Enter your email", type: "error" });
    if (!verificationCode || verificationCode.length !== 6)
      return setMessage({ text: "Enter a valid 6-digit OTP", type: "error" });
    if (!newPassword || !confirmPassword)
      return setMessage({ text: "Fill in all password fields", type: "error" });
    if (!isPasswordStrong(newPassword))
      return setMessage({
        text: "Password cannot be empty.",
        type: "error",
      });
    if (newPassword !== confirmPassword)
      return setMessage({ text: "Passwords do not match", type: "error" });

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/reset-password`, {
        email,
        otp: verificationCode,
        newPassword,
      });
      if (res.data.success || res.data.message === "Password updated successfully") {
        setMessage({
          text: "Password reset successfully! Please login.",
          type: "success",
        });
        setTimeout(() => {
          setMode("login");
          setCredentials({ userId: "hr001", password: "" });
          setEmail("");
          setVerificationCode("");
          setNewPassword("");
          setConfirmPassword("");
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }, 1500);
      } else {
        setMessage({
          text: res.data.message || "Failed to reset password",
          type: "error",
        });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Error resetting password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle one-time swap (starts on right, moves to left permanently)
  const handleSwap = () => {
    if (!swapped) {
      setSwapped(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-200/90 relative">
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url(${background})` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <motion.div
        className="relative z-10 w-full max-w-4xl bg-white/95 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col md:flex-row"
        // animate={{ flexDirection: swapped ? "row" : "row-reverse" }} // ✅ start right → swap left
        // transition={{ duration: 1.2, ease: "easeInOut" }} // ✅ Slow & smooth//
      >
        {/* LEFT (Info Section) */}
        <motion.div
          // className="md:w-1/2 bg-gradient-to-br from-blue-800/90 to-teal-700/90 text-white p-8 flex flex-col justify-center"
          className="md:w-1/2 bg-gradient-to-br from-gray-200/90 to-gray-700/90 text-black p-8 flex flex-col justify-center"
          layout
        >
          <h2 className="text-2xl md:text-3xl text-gray-800 font-bold mb-4">
            Human Resource Management System
          </h2>
          <p className="opacity-90 mb-6">
            Empowering multinational organizations with a centralized solution
            to manage global talent, streamline HRMS operations, and drive
            enterprise-wide efficiency.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center">
              <FaCheckCircle className="mr-3 text-gray-700" /> Employee data
              management
            </li>
            <li className="flex items-center">
              <FaCheckCircle className="mr-3 text-gray-700" /> Payroll & benefits
            </li>
            <li className="flex items-center">
              <FaCheckCircle className="mr-3 text-gray-700" /> Leave &
              Attendance Tracking
            </li>
            <li className="flex items-center">
              <FaCheckCircle className="mr-3 text-gray-700" /> Performance &
              Talent Management
            </li>
          </ul>
        </motion.div>

        {/* RIGHT (Login / Reset Form) */}
        <motion.div
          className="md:w-1/2 p-8 flex flex-col justify-center cursor-pointer"
          onClick={handleSwap} // ✅ only swaps once
          layout
        >
          {message.text && (
            <div
              className={`mb-4 p-3 rounded text-sm ${
                message.type === "error"
                  ? "bg-red-100 text-red-700"
                  : message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {mode === "login" ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-200 mb-4">
                  <span className="text-2xl font-bold text-yellow-500">HRMS</span>
                </div>
                <h1 className="text-gray-900 font-bold">
                  Human Resource Management System
                </h1>
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="userId"
                    value={credentials.userId}
                    onChange={handleChange}
                    placeholder="User ID"
                    required
                    className="w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition duration-300"
                  />
                </div>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    className="w-full pl-10 pr-10 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 transition duration-300"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-sm text-yellow-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 text-black py-3 rounded-lg flex items-center justify-center disabled:opacity-60"
                >
                  {loading ? "Logging in..." : "Login"}{" "}
                  {!loading && <FaArrowRight className="ml-2" />}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold mb-4 text-center">
                Forgot Password
              </h2>
              <form onSubmit={resetPassword} className="space-y-4">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                  disabled={loading}
                />
                <div>
                  <button
                    type="button"
                    onClick={sendOTP}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg disabled:opacity-60"
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>
                {(message.text.includes("OTP sent") || verificationCode) && (
                  <>
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full border rounded-lg px-4 py-3"
                      maxLength={6}
                      required
                      disabled={loading}
                    />
                    <div className="text-xs text-gray-500 mb-1">
                      Enter any non-empty password. No uppercase, digit, symbol, or minimum-length rule.
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border rounded-lg px-4 py-3 pr-12"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        tabIndex={-1}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border rounded-lg px-4 py-3 pr-12"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg disabled:opacity-60"
                      >
                        {loading ? "Resetting..." : "Reset Password"}
                      </button>
                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={loading}
                        className="flex-1 bg-gray-500 text-white py-3 rounded-lg disabled:opacity-60"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </>
                )}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setEmail("");
                      setVerificationCode("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setShowNewPassword(false);
                      setShowConfirmPassword(false);
                      setMessage({ text: "", type: "" });
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HRMSAuth;
