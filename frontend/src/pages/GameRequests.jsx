import { useEffect, useRef, useState } from "react";
import { api } from "../api";

const STATUS_LABELS = {
  pending: "Pending",
  has_deal: "Has Deal",
  added: "Added",
  no_deal: "No Deal",
};

const STATUS_STYLE = {
  pending: { background: "rgba(255,193,7,0.15)", color: "var(--amber)" },
  has_deal: { background: "rgba(100,149,237,0.15)", color: "#6495ed" },
  added: { background: "rgba(78,205,196,0.15)", color: "var(--green)" },
  no_deal: { background: "rgba(255,82,82,0.15)", color: "var(--red)" },
};

const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "has_deal", label: "Has Deal" },
  { key: "added", label: "Added" },
  { key: "no_deal", label: "No Deal" },
];

function SteamCell({ row, onLinked }) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setResults(null);
        setSearchError("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (row.steam_app_id) {
    return (
      <div style={{ fontSize: 12 }}>
        <a
          href={row.steam_url}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--accent)", textDecoration: "none" }}
        >
          {row.steam_name || row.steam_app_id}
        </a>
        {row.steam_price_sar != null && (
          <div style={{ color: "var(--muted)", marginTop: 2 }}>
            {row.steam_price_sar === 0
              ? "مجاني"
              : row.steam_price_sar.toFixed(2) + " ر.س"}
          </div>
        )}
      </div>
    );
  }

  const handleSearch = () => {
    setSearching(true);
    setSearchError("");
    setResults(null);
    api
      .steamSearch(row.game_name)
      .then((data) => {
        setResults(data);
        setOpen(true);
      })
      .catch((e) => setSearchError(e.message))
      .finally(() => setSearching(false));
  };

  const handleSelect = (result) => {
    api
      .linkSteam(row.id, {
        app_id: result.app_id,
        name: result.name,
        url: result.url,
        price_uah: result.price_uah,
        price_sar: result.price_sar,
      })
      .then((updated) => {
        setOpen(false);
        setResults(null);
        onLinked(updated);
      })
      .catch((e) => setSearchError(e.message));
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={handleSearch}
        disabled={searching}
        style={{
          padding: "3px 8px",
          fontSize: 11,
          borderRadius: 4,
          border: "1px solid #7c3aed",
          background: "rgba(124,58,237,0.12)",
          color: "#a78bfa",
          cursor: searching ? "default" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {searching ? "…" : "Search Steam"}
      </button>
      {searchError && (
        <div style={{ color: "var(--red)", fontSize: 11, marginTop: 4 }}>
          {searchError}
        </div>
      )}
      {open && results && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 100,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            minWidth: 240,
            maxWidth: 320,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            marginTop: 4,
          }}
        >
          {results.length === 0 ? (
            <div
              style={{ padding: "8px 12px", fontSize: 12, color: "var(--muted)" }}
            >
              No results found
            </div>
          ) : (
            results.map((r) => {
              const priceLabel = r.is_free
                ? "مجاني"
                : r.not_available
                ? "غير متاح"
                : r.price_sar != null
                ? r.price_sar.toFixed(2) + " ر.س"
                : "—";
              return (
                <div
                  key={r.app_id}
                  onClick={() => handleSelect(r)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    borderBottom: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(100,149,237,0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span style={{ color: "var(--text)" }}>{r.name}</span>
                  <span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>
                    {priceLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function GameRequests() {
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("");
  const [page, setPage] = useState(1);
  const [editingNotes, setEditingNotes] = useState({});

  const load = (tab = activeTab, pg = page) => {
    setLoading(true);
    setError("");
    const params = { page: pg };
    if (tab) params.status = tab;
    api
      .gameRequests(params)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Load counts for badge display
  const loadCounts = () => {
    const statuses = ["pending", "has_deal", "added", "no_deal"];
    Promise.all(
      statuses.map((s) =>
        api.gameRequests({ status: s, page: 1 }).then((d) => [s, d.total])
      )
    ).then((results) => {
      const c = {};
      results.forEach(([s, t]) => (c[s] = t));
      setCounts(c);
    });
  };

  useEffect(() => {
    load("", 1);
    loadCounts();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    load(tab, 1);
  };

  const handlePageChange = (pg) => {
    setPage(pg);
    load(activeTab, pg);
  };

  const updateStatus = (id, status) => {
    api
      .updateGameRequest(id, { status })
      .then(() => {
        load(activeTab, page);
        loadCounts();
      })
      .catch((e) => setError(e.message));
  };

  const saveNotes = (id, notes) => {
    api
      .updateGameRequest(id, { notes })
      .then(() => {
        setEditingNotes((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        load(activeTab, page);
      })
      .catch((e) => setError(e.message));
  };

  const handleSteamLinked = (updated) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((r) => (r.id === updated.id ? updated : r)),
      };
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this request?")) return;
    api
      .deleteGameRequest(id)
      .then(() => {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            total: prev.total - 1,
            items: prev.items.filter((r) => r.id !== id),
          };
        });
        loadCounts();
      })
      .catch((e) => setError(e.message));
  };

  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 className="page-title" style={{ margin: 0 }}>
          Game Requests
          {data && (
            <span style={{ fontSize: 14, color: "var(--muted)", marginLeft: 10 }}>
              {data.total} total
            </span>
          )}
        </h1>
        <button className="btn" onClick={() => { load(); loadCounts(); }} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {TABS.map(({ key, label }) => {
          const count = key === "" ? totalAll : counts[key] ?? 0;
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: isActive
                  ? "1px solid var(--accent)"
                  : "1px solid var(--border)",
                background: isActive ? "rgba(100,149,237,0.15)" : "var(--surface)",
                color: isActive ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {label}
              <span
                style={{
                  background: "var(--border)",
                  borderRadius: 10,
                  padding: "1px 7px",
                  fontSize: 11,
                  color: "var(--text)",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ color: "var(--red)", marginBottom: 16 }}>{error}</div>
      )}
      {!data && !error && (
        <div style={{ color: "var(--muted)" }}>Loading…</div>
      )}

      {data && (
        <>
          {data.items.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No game requests found.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Game Name</th>
                    <th>Order #</th>
                    <th>Status</th>
                    <th>Steam</th>
                    <th>Notes</th>
                    <th>Actions</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => {
                    const noteVal =
                      editingNotes[r.id] !== undefined
                        ? editingNotes[r.id]
                        : r.notes || "";
                    const isEditingNote = editingNotes[r.id] !== undefined;

                    return (
                      <tr key={r.id}>
                        <td style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
                          {r.created_at
                            ? new Date(r.created_at).toLocaleString()
                            : "—"}
                        </td>
                        <td style={{ fontWeight: 500 }}>{r.game_name}</td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>
                          {r.order_number || "—"}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={STATUS_STYLE[r.status] || {}}
                          >
                            {STATUS_LABELS[r.status] || r.status}
                          </span>
                        </td>
                        <td style={{ minWidth: 130 }}>
                          <SteamCell row={r} onLinked={handleSteamLinked} />
                        </td>
                        <td style={{ minWidth: 160 }}>
                          {isEditingNote ? (
                            <input
                              autoFocus
                              value={noteVal}
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--accent)",
                                borderRadius: 4,
                                color: "var(--text)",
                                padding: "3px 6px",
                                fontSize: 12,
                                width: "100%",
                              }}
                              onChange={(e) =>
                                setEditingNotes((prev) => ({
                                  ...prev,
                                  [r.id]: e.target.value,
                                }))
                              }
                              onBlur={() => saveNotes(r.id, noteVal)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveNotes(r.id, noteVal);
                                if (e.key === "Escape")
                                  setEditingNotes((prev) => {
                                    const next = { ...prev };
                                    delete next[r.id];
                                    return next;
                                  });
                              }}
                            />
                          ) : (
                            <span
                              title="Click to edit notes"
                              style={{
                                cursor: "pointer",
                                color: r.notes ? "var(--text)" : "var(--muted)",
                                fontSize: 12,
                              }}
                              onClick={() =>
                                setEditingNotes((prev) => ({
                                  ...prev,
                                  [r.id]: r.notes || "",
                                }))
                              }
                            >
                              {r.notes || <em>add note…</em>}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {Object.entries(STATUS_LABELS).map(([s, label]) => (
                              <button
                                key={s}
                                disabled={r.status === s}
                                onClick={() => updateStatus(r.id, s)}
                                style={{
                                  padding: "3px 8px",
                                  fontSize: 11,
                                  borderRadius: 4,
                                  border: `1px solid var(--border)`,
                                  background:
                                    r.status === s
                                      ? (STATUS_STYLE[s]?.background || "var(--border)")
                                      : "var(--surface)",
                                  color:
                                    r.status === s
                                      ? (STATUS_STYLE[s]?.color || "var(--text)")
                                      : "var(--muted)",
                                  cursor: r.status === s ? "default" : "pointer",
                                  opacity: r.status === s ? 1 : 0.8,
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDelete(r.id)}
                            title="Delete request"
                            style={{
                              padding: "3px 7px",
                              fontSize: 13,
                              borderRadius: 4,
                              border: "1px solid var(--border)",
                              background: "rgba(255,82,82,0.1)",
                              color: "var(--red)",
                              cursor: "pointer",
                            }}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data.pages > 1 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 16,
                alignItems: "center",
              }}
            >
              <button
                className="btn"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                ← Prev
              </button>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>
                Page {page} of {data.pages}
              </span>
              <button
                className="btn"
                disabled={page >= data.pages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
