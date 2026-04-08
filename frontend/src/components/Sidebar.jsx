import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: "\u{1F4CA}" },
  { to: "/orders", label: "Orders", icon: "\u{1F4E6}" },
  { to: "/subscriptions", label: "Subscriptions", icon: "\u{1F4B3}" },
  { to: "/emails", label: "Emails", icon: "\u{2709}\u{FE0F}" },
  { to: "/users", label: "Users", icon: "\u{1F464}" },
  { to: "/audit-logs", label: "Audit Logs", icon: "\u{1F4CB}" },
  { to: "/games-library", label: "Games Library", icon: "\u{1F3AE}" },
  { to: "/game-requests", label: "Game Requests", icon: "\u{1F579}\u{FE0F}" },
  { to: "/campaign", label: "Eid Campaign", icon: "\u{1F319}" },
  { to: "/devices", label: "Devices", icon: "\u{1F4BB}" },
  { to: "/game-codes", label: "Game Codes", icon: "\u{1F511}" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? "\u2715" : "\u2630"}
      </button>

      <div
        className={`sidebar-overlay${mobileOpen ? " sidebar-open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`sidebar${mobileOpen ? " sidebar-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-brand">
          <h2>SaudiDeck</h2>
          <span>Admin Hub</span>
        </div>
        <nav>
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <span aria-hidden="true" style={{ fontSize: "15px", width: 20, textAlign: "center" }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-username">{user?.username}</div>
          <button
            className="btn"
            style={{ width: "100%", height: 36, fontSize: "var(--text-sm)" }}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
