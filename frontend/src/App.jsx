import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";
import Subscriptions from "./pages/Subscriptions";
import Emails from "./pages/Emails";
import GamesLibrary from "./pages/GamesLibrary";
import GameRequests from "./pages/GameRequests";

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <div style={{ padding: 40, color: "var(--muted)" }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/emails" element={<Emails />} />
                  <Route path="/games-library" element={<GamesLibrary />} />
                  <Route path="/game-requests" element={<GameRequests />} />
                </Routes>
              </AppLayout>
            </RequireAuth>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
