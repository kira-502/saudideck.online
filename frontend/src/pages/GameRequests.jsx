import { useEffect, useRef, useState } from "react";
import { api } from "../api";

const STATUS_LABELS = {
  pending: "Pending",
  top: "Top",
  done: "Done",
};

const STATUS_STYLE = {
  pending: { background: "rgba(255,193,7,0.15)", color: "var(--amber)" },
  top: { background: "rgba(78,205,196,0.15)", color: "var(--green)" },
  done: { background: "rgba(150,150,150,0.15)", color: "var(--muted)" },
};

const TABS = [
  { key: "", label: "All" },
  { key: "top", label: "Top" },
  { key: "pending", label: "Pending" },
  { key: "done", label: "Done" },
];

function SteamCell({ row, onLinked }) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
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

  if (row.steam_app_id && !editing) {
    const priceText =
      row.steam_price_sar === 0
        ? "مجاني"
        : row.steam_price_sar != null
        ? row.steam_price_sar.toFixed(2) + " ر.س"
        : "غير متاح";
    const priceColor =
      row.steam_price_sar === 0
        ? "var(--green)"
        : row.steam_price_sar != null
        ? "var(--accent)"
        : "var(--muted)";
    return (
      <div style={{ fontSize: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <a
            href={row.steam_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--text)", textDecoration: "none" }}
          >
            {row.steam_name || row.steam_app_id}
          </a>
          <button
            onClick={() => setEditing(true)}
            title="Re-search"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 11, padding: 0 }}
          >✎</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ color: priceColor, fontWeight: 600 }}>{priceText}</span>
          {row.steam_discount > 0 && (
            <span style={{ background: "rgba(78,205,196,0.2)", color: "var(--green)", borderRadius: 3, padding: "1px 5px", fontWeight: 700, fontSize: 11 }}>
              -{row.steam_discount}%
            </span>
          )}
        </div>
      </div>
    );
  }

  const handleSearch = (query) => {
    const q = query || row.game_name;
    setSearching(true);
    setSearchError("");
    setResults(null);
    api
      .steamSearch(q)
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
        discount: result.discount_percent || 0,
      })
      .then((updated) => {
        setOpen(false);
        setResults(null);
        setEditing(false);
        onLinked(updated);
      })
      .catch((e) => setSearchError(e.message));
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => handleSearch()}
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
            <div style={{ padding: "8px 12px" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>No results — try a different name:</div>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  autoFocus
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && customQuery.trim()) handleSearch(customQuery.trim()); }}
                  placeholder="Search again…"
                  style={{
                    flex: 1,
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    color: "var(--text)",
                    padding: "4px 7px",
                    fontSize: 12,
                  }}
                />
                <button
                  onClick={() => { if (customQuery.trim()) handleSearch(customQuery.trim()); }}
                  disabled={searching}
                  style={{ padding: "4px 8px", fontSize: 11, borderRadius: 4, border: "1px solid #7c3aed", background: "rgba(124,58,237,0.12)", color: "#a78bfa", cursor: "pointer" }}
                >
                  Go
                </button>
              </div>
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
                  <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                    {r.discount_percent > 0 && (
                      <span style={{ background: "rgba(78,205,196,0.2)", color: "var(--green)", borderRadius: 3, padding: "1px 5px", fontWeight: 700, fontSize: 10 }}>
                        -{r.discount_percent}%
                      </span>
                    )}
                    <span style={{ color: r.discount_percent > 0 ? "var(--green)" : "var(--muted)" }}>
                      {priceLabel}
                    </span>
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

function StatusDropdown({ row, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "4px 10px",
          fontSize: 12,
          borderRadius: 4,
          border: `1px solid ${STATUS_STYLE[row.status]?.color || "var(--border)"}`,
          background: STATUS_STYLE[row.status]?.background || "var(--surface)",
          color: STATUS_STYLE[row.status]?.color || "var(--text)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {STATUS_LABELS[row.status] || row.status} ▾
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 100,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            minWidth: 120,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            marginTop: 4,
          }}
        >
          {Object.entries(STATUS_LABELS).map(([s, label]) => (
            <div
              key={s}
              onClick={() => { onUpdate(row.id, s); setOpen(false); }}
              style={{
                padding: "7px 12px",
                fontSize: 12,
                cursor: s === row.status ? "default" : "pointer",
                color: s === row.status ? STATUS_STYLE[s]?.color : "var(--text)",
                background: s === row.status ? STATUS_STYLE[s]?.background : "transparent",
                fontWeight: s === row.status ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (s !== row.status) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { if (s !== row.status) e.currentTarget.style.background = "transparent"; }}
            >
              {label}
            </div>
          ))}
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
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [priceMsg, setPriceMsg] = useState("");

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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {priceMsg && <span style={{ fontSize: 12, color: "var(--green)" }}>{priceMsg}</span>}
          <button
            className="btn"
            disabled={refreshingPrices}
            onClick={() => {
              setRefreshingPrices(true);
              setPriceMsg("");
              api.refreshAllPrices()
                .then((r) => {
                  setPriceMsg(`Updated ${r.updated} game${r.updated !== 1 ? "s" : ""}`);
                  load();
                })
                .catch((e) => setPriceMsg("Failed: " + e.message))
                .finally(() => setRefreshingPrices(false));
            }}
          >
            {refreshingPrices ? "Updating…" : "↻ Update Prices"}
          </button>
          <button className="btn" onClick={() => { load(); loadCounts(); }} disabled={loading}>
            {loading ? "…" : "↻ Refresh"}
          </button>
        </div>
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
                            ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
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
                          <StatusDropdown row={r} onUpdate={updateStatus} />
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
