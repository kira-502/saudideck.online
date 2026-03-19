import { useEffect, useState } from "react";
import { api } from "../api";

const CARDS = [
  { key: "salla_orders", label: "Salla Orders", color: "var(--accent)" },
  { key: "g2g_orders", label: "G2G Orders", color: "var(--blue)" },
  { key: "plati_orders", label: "Plati Orders", color: "var(--blue)" },
  { key: "z2u_orders", label: "Z2U Orders", color: "var(--blue)" },
  { key: "matches", label: "Matches", color: "var(--green)" },
  { key: "users", label: "Staff Users", color: "var(--amber)" },
  { key: "imports_today", label: "Imports Today", color: "var(--muted)" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.stats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div style={{ color: "var(--red)" }}>{error}</div>;
  if (!stats) return <div style={{ color: "var(--muted)" }}>Loading…</div>;

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <div className="stat-grid">
        {CARDS.map(({ key, label, color }) => (
          <div className="stat-card" key={key}>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{stats[key] ?? "—"}</div>
          </div>
        ))}
      </div>
    </>
  );
}
