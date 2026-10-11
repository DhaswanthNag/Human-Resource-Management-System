import React from "react";
import AdminNavbar from "../Components/navbars/AdminNavbar";
import HrNavbar from "../Components/navbars/HrNavbar";
import EmployeeNavbar from "../Components/navbars/EmployeeNavbar";
import HomeNavbar from "../Components/navbars/HomeNavbar";

const NavbarLayout = ({ role, children }) => {
  const renderNavbar = () => {
    switch (role) {
      case "admin":
        return <AdminNavbar />;
      case "hr":
        return <HrNavbar />;
      case "employee":
        return <EmployeeNavbar />;
      default:
        return <HomeNavbar />;
    }
  };

  return (
    <div>
      {renderNavbar()}
      <main className="p-6">{children}</main>
    </div>
  );
};

export default NavbarLayout;
