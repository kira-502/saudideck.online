import { useEffect, useState } from "react";
import { api } from "../api";

export default function GamesLibrary() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    api.gamesLibrary()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Games Library</h1>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {error && <div style={{ color: "var(--red)", marginBottom: 16 }}>{error}</div>}
      {!data && !error && <div style={{ color: "var(--muted)" }}>Loading…</div>}

      {data && (
        <>
          {/* Stats */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Total Games</div>
              <div className="stat-value">{data.stats.total_games.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Coming Soon</div>
              <div className="stat-value" style={{ color: "var(--amber)" }}>{data.stats.coming_soon}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Steam Deck Verified</div>
              <div className="stat-value" style={{ color: "var(--green)" }}>{data.stats.verified_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Recent Batch</div>
              <div className="stat-value" style={{ fontSize: 18, color: "var(--accent)" }}>
                {data.stats.recent_batch_date || "—"}
              </div>
              {data.stats.recent_batch_count > 0 && (
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                  {data.stats.recent_batch_count} game{data.stats.recent_batch_count !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>

          {/* Recent Additions */}
          <h2 style={{ fontSize: 16, marginBottom: 10, color: "var(--text)" }}>
            Recent Additions
            {data.stats.recent_batch_date && (
              <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>
                ({data.stats.recent_batch_date})
              </span>
            )}
          </h2>

          {data.recent_additions.length === 0 ? (
            <div style={{ color: "var(--muted)", marginBottom: 24 }}>No recent additions found.</div>
          ) : (
            <div className="table-wrap" style={{ marginBottom: 28 }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Genre</th>
                    <th>Year</th>
                    <th>Score</th>
                    <th>Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_additions.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <a
                          href={`https://store.steampowered.com/app/${g.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent)", textDecoration: "none" }}
                        >
                          {g.name}
                        </a>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{g.genre || "—"}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{g.year || "—"}</td>
                      <td>
                        {g.score != null ? (
                          <span
                            className="badge"
                            style={{
                              background:
                                g.score >= 75 ? "rgba(78,205,196,0.15)" :
                                g.score >= 50 ? "rgba(255,193,7,0.15)" :
                                "rgba(255,82,82,0.15)",
                              color:
                                g.score >= 75 ? "var(--green)" :
                                g.score >= 50 ? "var(--amber)" :
                                "var(--red)",
                            }}
                          >
                            {g.score}
                          </span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                      <td>
                        {g.verified ? (
                          <span className="badge badge-green">Verified</span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Coming Soon */}
          <h2 style={{ fontSize: 16, marginBottom: 10, color: "var(--text)" }}>
            Coming Soon
            <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 8 }}>
              ({data.coming_soon.length} title{data.coming_soon.length !== 1 ? "s" : ""})
            </span>
          </h2>

          {data.coming_soon.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No upcoming games listed.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Genre</th>
                    <th>Year</th>
                    <th>Release Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coming_soon.map((g) => (
                    <tr key={g.id}>
                      <td>
                        <a
                          href={`https://store.steampowered.com/app/${g.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent)", textDecoration: "none" }}
                        >
                          {g.name}
                        </a>
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{g.genre || "—"}</td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{g.year || "—"}</td>
                      <td style={{ color: "var(--amber)", fontSize: 12 }}>{g.release_info || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
