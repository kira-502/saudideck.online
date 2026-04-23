import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

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
  { to: "/homepage-dash", label: "Pi Homepage", icon: "\u{1F3E0}" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);

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
          <img src="/favicon.png" alt="SaudiDeck" style={{ width: 36, height: 36, borderRadius: 6 }} />
          <div>
            <h2>SaudiDeck</h2>
            <span>Admin Hub</span>
          </div>
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
            style={{ width: "100%", height: 32, fontSize: "var(--text-sm)", marginBottom: 6 }}
            onClick={() => setShowPwModal(true)}
          >
            Change Password
          </button>
          <button
            className="btn"
            style={{ width: "100%", height: 36, fontSize: "var(--text-sm)" }}
            onClick={handleLogout}
          >
            Sign Out
          </button>
        </div>
      </aside>
      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
    </>
  );
}

function ChangePasswordModal({ onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (next !== confirm) { setError("Passwords don't match"); return; }
    setBusy(true);
    try {
      await api.changePassword(current, next);
      setOk(true);
      setTimeout(onClose, 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: 24, width: 360, maxWidth: "90vw",
          display: "flex", flexDirection: "column", gap: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>Change Password</h3>
        <input
          type="password" placeholder="Current password" autoComplete="current-password"
          value={current} onChange={(e) => setCurrent(e.target.value)} required
        />
        <input
          type="password" placeholder="New password (min 8 chars)" autoComplete="new-password"
          value={next} onChange={(e) => setNext(e.target.value)} required
        />
        <input
          type="password" placeholder="Confirm new password" autoComplete="new-password"
          value={confirm} onChange={(e) => setConfirm(e.target.value)} required
        />
        {error && <div className="text-error" style={{ fontSize: 12 }}>{error}</div>}
        {ok && <div style={{ color: "var(--green)", fontSize: 12 }}>✓ Password updated</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn" disabled={busy || ok}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
