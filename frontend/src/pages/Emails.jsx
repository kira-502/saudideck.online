import { useEffect, useState } from "react";
import { api } from "../api";

export default function Emails() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    api.emailExtractions()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const download = (id) => {
    window.open(`/emails/${id}/download`, "_blank");
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Email Extractions</h1>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      <p className="text-muted" style={{ fontSize: 12, marginBottom: 16 }}>
        Every time a team member runs the email extractor, it appears here. You can download the full data as CSV.
      </p>

      {error && <div className="text-error" style={{ marginBottom: 12 }}>{error}</div>}
      {!rows && !error && <div className="state-loading">Loading…</div>}

      {rows && rows.length === 0 && (
        <div className="state-empty">No extractions yet. Team members need to run the email extractor first.</div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="records-count">
            {rows.length} extraction{rows.length !== 1 ? "s" : ""}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Run By</th>
                  <th>Emails Found</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="text-muted" style={{ whiteSpace: "nowrap" }}>
                      {r.run_at ? new Date(r.run_at).toLocaleString() : "—"}
                    </td>
                    <td style={{ fontSize: 12 }}>{r.triggered_by || "—"}</td>
                    <td>
                      <span className="badge badge-blue">{r.email_count ?? "—"}</span>
                    </td>
                    <td>
                      <button
                        className="btn"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => download(r.id)}
                        aria-label={`Download CSV for extraction ${r.id}`}
                      >
                        ↓ CSV
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
