import { useEffect, useState } from "react";
import { api } from "../api";

const ACTION_COLOR = {
  login: "badge-green",
  logout: "badge-amber",
  view_dashboard: "badge-blue",
  view_orders: "badge-blue",
  view_users: "badge-blue",
  view_subscriptions: "badge-blue",
  view_emails: "badge-blue",
  download_extraction: "badge-green",
};

export default function AuditLogs() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    api.auditLogs(page).then(setData).catch((e) => setError(e.message));
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  if (error) return <div className="text-error">{error}</div>;

  return (
    <>
      <h1 className="page-title">Audit Logs</h1>
      <p className="text-muted" style={{ fontSize: 12, marginBottom: 16 }}>
        Every action you take in this hub is recorded here.
      </p>

      {!data && <div className="state-loading">Loading…</div>}

      {data && (
        <>
          <div className="records-count">{data.total.toLocaleString()} total entries</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th><th>User</th><th>Action</th>
                  <th>Resource</th><th>Detail</th><th>IP</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id}>
                    <td className="text-muted" style={{ whiteSpace: "nowrap" }}>
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td>{row.username || "—"}</td>
                    <td>
                      <span className={`badge ${ACTION_COLOR[row.action] || "badge-muted"}`}>
                        {row.action}
                      </span>
                    </td>
                    <td className="text-muted">{row.resource || "—"}</td>
                    <td className="text-muted" style={{ fontSize: 12 }}>{row.detail || "—"}</td>
                    <td className="text-muted" style={{ fontSize: 11 }}>{row.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button className="btn" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
            <span className="pagination-info">Page {page} of {totalPages}</span>
            <button className="btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        </>
      )}
    </>
  );
}
