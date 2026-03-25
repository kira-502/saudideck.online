import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/orders", label: "Orders", icon: "📦" },
  { to: "/subscriptions", label: "Subscriptions", icon: "💳" },
  { to: "/emails", label: "Emails", icon: "✉️" },
  { to: "/users", label: "Users", icon: "👤" },
  { to: "/audit-logs", label: "Audit Logs", icon: "📋" },
  { to: "/games-library", label: "Games Library", icon: "🎮" },
  { to: "/game-requests", label: "Game Requests", icon: "🕹️" },
  { to: "/campaign", label: "Eid Campaign", icon: "🌙" },
  { to: "/devices", label: "Devices", icon: "💻" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar" aria-label="Main navigation">
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
            <span aria-hidden="true">{icon}</span> {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-username">{user?.username}</div>
        <button className="btn" style={{ width: "100%" }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}
