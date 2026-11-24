import { NavLink } from "react-router-dom";

import {
  Activity,
  Inbox,
  Layers,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  CalendarCheck,
  LogOut,
  X,
} from "lucide-react";

import useAuth from "../hooks/useAuth";

const workspaceLinks = [
  {
    label: "Triage Queue",
    path: "/tickets",
    icon: Inbox,
  },
  {
    label: "Resources",
    path: "/resources",
    icon: Layers,
  },
  {
    label: "My Bookings",
    path: "/bookings",
    icon: CalendarDays,
  },
];

const adminLinks = [
  {
    label: "Analytics",
    path: "/admin/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    label: "Manage Resources",
    path: "/admin/resources",
    icon: Settings,
  },
  {
    label: "Manage Bookings",
    path: "/admin/bookings",
    icon: CalendarCheck,
  },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, logout } = useAuth();

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  function renderLinks(links) {
    return links.map(({ label, path, icon: Icon }) => (
      <NavLink
        key={path}
        to={path}
        onClick={onClose}
        className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
      >
        <Icon size={19} />
        <span>{label}</span>
      </NavLink>
    ));
  }

  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={22} />
          </div>
          TriageSync
        </div>

        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={22} />
        </button>
      </div>

      <nav className="sidebar-navigation">
        <div className="sidebar-section">
          <p className="sidebar-label">WORKSPACE</p>

          {renderLinks(workspaceLinks)}
        </div>

        {isAdmin && (
          <div className="sidebar-section">
            <p className="sidebar-label">ADMINISTRATION</p>

            {renderLinks(adminLinks)}
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">{initials}</div>

        <div className="sidebar-user">
          <strong>{user.name}</strong>

          <small>{isAdmin ? "Administrator" : "Agent"}</small>
        </div>

        <button
          className="logout-button"
          onClick={logout}
          aria-label="Logout"
          title="Logout"
        >
          <LogOut size={19} />
        </button>
      </div>
    </aside>
  );
}
