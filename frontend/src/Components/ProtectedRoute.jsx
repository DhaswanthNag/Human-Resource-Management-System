import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Unauthorized role - redirect to authorized dashboard
    const redirectPath =
      role === "admin" ? "/admin" : role === "hr" ? "/hr" : "/employee";
    return <Navigate to={redirectPath} replace />;
  }

  // Authorized
  return children;
};

export default ProtectedRoute;
