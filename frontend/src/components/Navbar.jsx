import { Menu, ChevronRight, ShieldCheck } from "lucide-react";

import { useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const pageNames = {
  "/tickets": "Triage Queue",
  "/resources": "Resources",
  "/bookings": "My Bookings",
  "/admin/analytics": "Analytics",
  "/admin/resources": "Manage Resources",
  "/admin/bookings": "Manage Bookings",
};

export default function Navbar({ onMenuClick }) {
  const { user, isAdmin } = useAuth();

  const location = useLocation();

  const pageName =
    pageNames[location.pathname] ||
    (location.pathname.startsWith("/tickets/")
      ? "Ticket Details"
      : location.pathname.startsWith("/resources/")
        ? "Resource Details"
        : "Workspace");

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={23} />
        </button>

        <div className="breadcrumb">
          <span>Workspace</span>

          <ChevronRight size={15} />

          <strong>{pageName}</strong>
        </div>
      </div>

      <div className="navbar-right">
        {isAdmin && (
          <span className="admin-indicator">
            <ShieldCheck size={15} />
            Admin
          </span>
        )}

        <div className="navbar-avatar" title={user.name}>
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
