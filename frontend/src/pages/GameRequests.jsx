import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";

const STATUS_LABELS = {
  pending: "Pending",
  top: "Top",
  done: "Done",
};

const STATUS_STYLE = {
  pending: { background: "rgba(255,193,7,0.15)", color: "var(--amber)" },
  top: { background: "rgba(78,205,196,0.15)", color: "var(--green)" },
  done: { background: "rgba(150,150,150,0.15)", color: "var(--text-muted)" },
};

const TABS = [
  { key: "", label: "All" },
  { key: "top", label: "Top" },
  { key: "pending", label: "Pending" },
  { key: "done", label: "Done" },
  { key: "deleted", label: "Deleted" },
];

// Reusable hook for click-outside detection
function useClickOutside(ref, enabled, onClose) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, enabled, onClose]);
}

function SteamCell({ row, onLinked }) {
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [customQuery, setCustomQuery] = useState("");
  const wrapRef = useRef(null);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setResults(null);
    setSearchError("");
  }, []);

  useClickOutside(wrapRef, open, closeDropdown);

  const getSarPrice = (sarVal) => {
    if (sarVal === 0) return { text: "مجاني", color: "var(--green)" };
    if (sarVal != null) return { text: sarVal.toFixed(2) + " ر.س", color: "var(--accent)" };
    return { text: "غير متاح", color: "var(--text-muted)" };
  };

  if (row.steam_app_id && !editing) {
    const { text: priceText, color: priceColor } = getSarPrice(row.steam_price_sar);
    return (
      <div style={{ fontSize: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <a
            href={row.steam_url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--text)" }}
          >
            {row.steam_name || row.steam_app_id}
          </a>
          <button
            onClick={() => setEditing(true)}
            title="Re-search"
            aria-label="Re-search Steam"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11, padding: 0 }}
          >
            ✎
          </button>
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
      .then((data) => { setResults(data); setOpen(true); })
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

  const getPriceLabel = (r) => {
    if (r.is_free) return "مجاني";
    if (r.not_available) return "غير متاح";
    if (r.price_sar != null) return r.price_sar.toFixed(2) + " ر.س";
    return "—";
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => handleSearch()}
        disabled={searching}
        className="btn-steam"
      >
        {searching ? "…" : "Search Steam"}
      </button>
      {searchError && (
        <div className="text-error" style={{ fontSize: 11, marginTop: 4 }}>{searchError}</div>
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
              <div className="text-muted" style={{ fontSize: 12, marginBottom: 6 }}>No results — try a different name:</div>
              <div style={{ display: "flex", gap: 4 }}>
                <input
                  autoFocus
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && customQuery.trim()) handleSearch(customQuery.trim()); }}
                  placeholder="Search again…"
                  style={{ flex: 1, margin: 0 }}
                />
                <button
                  onClick={() => { if (customQuery.trim()) handleSearch(customQuery.trim()); }}
                  disabled={searching}
                  className="btn-steam"
                >
                  Go
                </button>
              </div>
            </div>
          ) : (
            results.map((r) => (
              <div
                key={r.app_id}
                onClick={() => handleSelect(r)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleSelect(r); }}
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(100,149,237,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span>{r.name}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                  {r.discount_percent > 0 && (
                    <span style={{ background: "rgba(78,205,196,0.2)", color: "var(--green)", borderRadius: 3, padding: "1px 5px", fontWeight: 700, fontSize: 10 }}>
                      -{r.discount_percent}%
                    </span>
                  )}
                  <span className={r.discount_percent > 0 ? "text-success" : "text-muted"}>
                    {getPriceLabel(r)}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatusDropdown({ row, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, open, close);

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
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {STATUS_LABELS[row.status] || row.status} ▾
      </button>
      {open && (
        <div
          role="listbox"
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
              role="option"
              aria-selected={s === row.status}
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
  const [notifyingId, setNotifyingId] = useState(null);
  const [notifyErrors, setNotifyErrors] = useState({});
  const [uploadMsg, setUploadMsg] = useState("");
  const uploadRef = useRef(null);

  const load = useCallback((tab, pg) => {
    setLoading(true);
    setError("");
    const params = { page: pg };
    if (tab) params.status = tab;
    api
      .gameRequests(params)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadCounts = useCallback(() => {
    const statuses = ["pending", "top", "done", "deleted"];
    Promise.all(
      statuses.map((s) =>
        api.gameRequests({ status: s, page: 1 }).then((d) => [s, d.total])
      )
    ).then((results) => {
      const c = {};
      results.forEach(([s, t]) => (c[s] = t));
      setCounts(c);
    });
  }, []);

  useEffect(() => {
    load("", 1);
    loadCounts();
  }, [load, loadCounts]);

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
      .then(() => { load(activeTab, page); loadCounts(); })
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
      return { ...prev, items: prev.items.map((r) => (r.id === updated.id ? updated : r)) };
    });
  };

  const removeFromList = (id) => {
    setData((prev) => prev ? { ...prev, total: prev.total - 1, items: prev.items.filter((r) => r.id !== id) } : prev);
    loadCounts();
  };

  const handleDelete = (id) => {
    api.deleteGameRequest(id)
      .then(() => removeFromList(id))
      .catch((e) => setError(e.message));
  };

  const handleRestore = (id) => {
    api.restoreGameRequest(id)
      .then(() => removeFromList(id))
      .catch((e) => setError(e.message));
  };

  const handlePermanentDelete = (id) => {
    if (!window.confirm("Permanently delete this record? This cannot be undone.")) return;
    api.permanentDeleteGameRequest(id)
      .then(() => removeFromList(id))
      .catch((e) => setError(e.message));
  };

  const handleNotify = (id) => {
    setNotifyingId(id);
    setNotifyErrors((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
    api.notifyInfo(id)
      .then(({ name, phone, game_name }) => {
        if (!phone) throw new Error("No phone number found");
        const msg = `أهلا ${name}\nوفّرنا لك ${game_name}\nللمزيد من الألعاب زور متجرنا\nsaudideck.games`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      })
      .catch((e) => setNotifyErrors((prev) => ({ ...prev, [id]: e.message })))
      .finally(() => setNotifyingId(null));
  };

  const totalAll = (counts.pending || 0) + (counts.top || 0);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Game Requests
          {data && <span className="text-muted" style={{ fontSize: 14, marginLeft: 10 }}>{data.total} total</span>}
        </h1>
        <div className="page-header-actions">
          {uploadMsg && <span style={{ fontSize: 12, color: uploadMsg.startsWith("Failed") ? "var(--red)" : "var(--green)" }}>{uploadMsg}</span>}
          <input
            ref={uploadRef}
            type="file"
            accept=".xls,.xlsx"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setUploadMsg("Uploading…");
              api.uploadContacts(file)
                .then((r) => setUploadMsg(`Imported ${r.upserted} contacts`))
                .catch((err) => setUploadMsg("Failed: " + err.message))
                .finally(() => { uploadRef.current.value = ""; });
            }}
          />
          <button className="btn" onClick={() => uploadRef.current.click()}>
            Upload Salla Orders
          </button>
          {priceMsg && <span style={{ fontSize: 12, color: priceMsg.startsWith("Failed") ? "var(--red)" : "var(--green)" }}>{priceMsg}</span>}
          {activeTab !== "deleted" && (
            <button
              className="btn"
              disabled={refreshingPrices}
              onClick={() => {
                setRefreshingPrices(true);
                setPriceMsg("");
                api.refreshAllPrices()
                  .then((r) => { setPriceMsg(`Updated ${r.updated} game${r.updated !== 1 ? "s" : ""}`); load(activeTab, page); })
                  .catch((e) => setPriceMsg("Failed: " + e.message))
                  .finally(() => setRefreshingPrices(false));
              }}
            >
              {refreshingPrices ? "Updating…" : "↻ Update Prices"}
            </button>
          )}
          <button className="btn" onClick={() => { load(activeTab, page); loadCounts(); }} disabled={loading}>
            {loading ? "…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      <div className="tab-bar" style={{ marginBottom: 20 }}>
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
                border: isActive ? "1px solid var(--accent)" : "1px solid var(--border)",
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

      {error && <div className="text-error" style={{ marginBottom: 16 }}>{error}</div>}
      {!data && !error && <div className="state-loading">Loading…</div>}

      {data && (
        <>
          {data.items.length === 0 ? (
            <div className="state-empty">No game requests found.</div>
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
                    const noteVal = editingNotes[r.id] !== undefined ? editingNotes[r.id] : r.notes || "";
                    const isEditingNote = editingNotes[r.id] !== undefined;

                    return (
                      <tr key={r.id}>
                        <td className="text-muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                          {r.created_at
                            ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                            : "—"}
                        </td>
                        <td style={{ fontWeight: 500 }}>{r.game_name}</td>
                        <td className="text-muted" style={{ fontSize: 12 }}>{r.order_number || "—"}</td>
                        <td>
                          <span className="badge" style={STATUS_STYLE[r.status] || {}}>
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
                              type="text"
                              value={noteVal}
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--accent)",
                                borderRadius: 4,
                                color: "var(--text)",
                                padding: "3px 6px",
                                fontSize: 12,
                                width: "100%",
                                margin: 0,
                              }}
                              onChange={(e) =>
                                setEditingNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
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
                              style={{ cursor: "pointer", color: r.notes ? "var(--text)" : "var(--muted)", fontSize: 12 }}
                              onClick={() => setEditingNotes((prev) => ({ ...prev, [r.id]: r.notes || "" }))}
                            >
                              {r.notes || <em>add note…</em>}
                            </span>
                          )}
                        </td>
                        <td>
                          {activeTab !== "deleted" && <StatusDropdown row={r} onUpdate={updateStatus} />}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {activeTab === "done" && r.order_number && (
                              <button
                                onClick={() => handleNotify(r.id)}
                                disabled={notifyingId === r.id}
                                className="btn-notify"
                                title="Send WhatsApp notification"
                                aria-label={`Notify customer for ${r.game_name}`}
                              >
                                {notifyingId === r.id ? "…" : "Notify"}
                              </button>
                            )}
                            {activeTab === "deleted" ? (
                              <>
                                <button
                                  onClick={() => handleRestore(r.id)}
                                  className="btn-restore"
                                  title="Restore request"
                                  aria-label={`Restore ${r.game_name}`}
                                >
                                  ↩ Restore
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(r.id)}
                                  className="btn-perm-delete"
                                  title="Permanently delete"
                                  aria-label={`Permanently delete ${r.game_name}`}
                                >
                                  ✕ Permanent
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleDelete(r.id)}
                                className="btn-delete"
                                title="Delete request"
                                aria-label={`Delete ${r.game_name}`}
                              >
                                🗑
                              </button>
                            )}
                          </div>
                          {notifyErrors[r.id] && (
                            <div className="text-error" style={{ fontSize: 11, marginTop: 3 }}>{notifyErrors[r.id]}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {data.pages > 1 && (
            <div className="pagination" style={{ justifyContent: "flex-start" }}>
              <button className="btn" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>← Prev</button>
              <span className="pagination-info">Page {page} of {data.pages}</span>
              <button className="btn" disabled={page >= data.pages} onClick={() => handlePageChange(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
