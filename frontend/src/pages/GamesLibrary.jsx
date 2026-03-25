import { useEffect, useState } from "react";
import { api } from "../api";

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-muted" style={{ fontSize: 12 }}>—</span>;
  const cls = score >= 75 ? "badge-green" : score >= 50 ? "badge-amber" : "badge-red";
  return <span className={`badge ${cls}`}>{score}</span>;
}

function SteamLink({ game }) {
  return (
    <a
      href={`https://store.steampowered.com/app/${game.id}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "var(--accent)" }}
      aria-label={`Open ${game.name} on Steam`}
    >
      {game.name}
    </a>
  );
}

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
      <div className="page-header">
        <h1 className="page-title">Games Library</h1>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {error && <div className="text-error" style={{ marginBottom: 16 }}>{error}</div>}
      {!data && !error && <div className="state-loading">Loading…</div>}

      {data && (
        <>
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
                <div className="text-muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {data.stats.recent_batch_count} game{data.stats.recent_batch_count !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>

          <h2 style={{ fontSize: 16, marginBottom: 10 }}>
            Recent Additions
            {data.stats.recent_batch_date && (
              <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>
                ({data.stats.recent_batch_date})
              </span>
            )}
          </h2>

          {data.recent_additions.length === 0 ? (
            <div className="state-empty" style={{ marginBottom: 24 }}>No recent additions found.</div>
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
                      <td><SteamLink game={g} /></td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{g.genre || "—"}</td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{g.year || "—"}</td>
                      <td><ScoreBadge score={g.score} /></td>
                      <td>
                        {g.verified
                          ? <span className="badge badge-green">Verified</span>
                          : <span className="text-muted" style={{ fontSize: 12 }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 style={{ fontSize: 16, marginBottom: 10 }}>
            Coming Soon
            <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>
              ({data.coming_soon.length} title{data.coming_soon.length !== 1 ? "s" : ""})
            </span>
          </h2>

          {data.coming_soon.length === 0 ? (
            <div className="state-empty">No upcoming games listed.</div>
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
                      <td><SteamLink game={g} /></td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{g.genre || "—"}</td>
                      <td className="text-muted" style={{ fontSize: 12 }}>{g.year || "—"}</td>
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
