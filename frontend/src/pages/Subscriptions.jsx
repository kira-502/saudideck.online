import { useEffect, useState } from "react";
import { api } from "../api";

const STATUS_BADGE = {
  active: "badge-green",
  expiring: "badge-amber",
  expired: "badge-muted",
  cancelled: "badge-muted",
};

export default function Subscriptions() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    api.subscriptions()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = data?.subscriptions?.filter((s) =>
    !search ||
    s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.orderId?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search) ||
    s.productName?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Subscriptions</h1>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {error && <div style={{ color: "var(--red)", marginBottom: 16 }}>{error}</div>}

      {data && (
        <>
          {/* Stat cards */}
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">Active</div>
              <div className="stat-value" style={{ color: "var(--green)" }}>{data.stats.active}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Expiring Soon</div>
              <div className="stat-value" style={{ color: "var(--amber)" }}>{data.stats.expiring}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Expired</div>
              <div className="stat-value" style={{ color: "var(--muted)" }}>{data.stats.expired}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Cancelled</div>
              <div className="stat-value" style={{ color: "var(--muted)" }}>{data.stats.cancelled}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Revenue</div>
              <div className="stat-value" style={{ color: "var(--accent)", fontSize: 20 }}>
                {data.stats.active_revenue.toLocaleString()} SAR
              </div>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name, order ID, phone, product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 12, width: 320 }}
          />

          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>
            {filtered.length} of {data.stats.total} subscribers
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Expiry</th>
                  <th>Days Left</th>
                  <th>Price</th>
                  <th>Device</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.orderId}>
                    <td>
                      <div>{s.customerName}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.phone}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{s.productName}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status] || "badge-muted"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{s.expiryDate}</td>
                    <td style={{ color: s.daysRemaining <= 7 ? "var(--red)" : s.daysRemaining <= 30 ? "var(--amber)" : "var(--text)" }}>
                      {s.daysRemaining}
                    </td>
                    <td style={{ color: "var(--muted)" }}>{s.price} SAR</td>
                    <td style={{ color: "var(--muted)", fontSize: 12 }}>{s.isDevice ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!data && !error && !loading && (
        <div style={{ color: "var(--muted)" }}>Loading…</div>
      )}
    </>
  );
}
