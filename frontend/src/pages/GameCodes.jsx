import { useState, useEffect } from "react";
import { api } from "../api";

const inputStyle = {
  display: "block",
  width: "100%",
  marginTop: 4,
  padding: "6px 10px",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  color: "var(--text)",
  fontSize: 14,
};

const TABS = [
  { key: "", label: "All" },
  { key: "available", label: "Available" },
  { key: "sent", label: "Sent" },
];

export default function GameCodes() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("available");

  // Add form
  const [gameName, setGameName] = useState("");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);

  // Send modal
  const [sendId, setSendId] = useState(null);
  const [sendName, setSendName] = useState("");
  const [sendPhone, setSendPhone] = useState("");
  const [sendOrder, setSendOrder] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    setLoading(true);
    api.gameCodes(tab)
      .then(setCodes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!gameName.trim() || !code.trim()) return;
    setAdding(true);
    setError("");
    try {
      const item = await api.addGameCode({
        game_name: gameName.trim(),
        code: code.trim(),
        notes: notes.trim() || null,
      });
      setCodes((prev) => [item, ...prev]);
      setGameName("");
      setCode("");
      setNotes("");
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleSend = async () => {
    if (!sendName.trim() || !sendPhone.trim() || !sendOrder.trim()) return;
    setSending(true);
    setError("");
    try {
      const updated = await api.markCodeSent(sendId, {
        sent_to_name: sendName.trim(),
        sent_to_phone: sendPhone.trim(),
        sent_to_order: sendOrder.trim(),
      });
      setCodes((prev) => prev.map((c) => (c.id === sendId ? updated : c)));
      setSendId(null);
      setSendName("");
      setSendPhone("");
      setSendOrder("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this code?")) return;
    setError("");
    try {
      await api.deleteGameCode(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
  };

  const available = codes.filter((c) => c.status === "available");
  const sent = codes.filter((c) => c.status === "sent");
  const displayed = tab === "" ? codes : tab === "available" ? available : sent;

  return (
    <>
      <h1 className="page-title">Game Codes</h1>

      {error && (
        <div style={{ color: "#f87171", marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr auto",
          gap: 10,
          alignItems: "end",
          marginBottom: 20,
          padding: 16,
          background: "var(--surface)",
          borderRadius: 8,
          border: "1px solid var(--border)",
        }}
      >
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Game Name</label>
          <input
            style={inputStyle}
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="e.g. Elden Ring"
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Code</label>
          <input
            style={inputStyle}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="XXXXX-XXXXX-XXXXX"
          />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Notes (optional)</label>
          <input
            style={inputStyle}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. region locked"
          />
        </div>
        <button
          className="btn"
          type="submit"
          disabled={adding || !gameName.trim() || !code.trim()}
          style={{ height: 36, whiteSpace: "nowrap" }}
        >
          {adding ? "Adding..." : "Add Code"}
        </button>
      </form>

      {/* Tabs + counts */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`btn${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span style={{ marginLeft: 6, opacity: 0.6 }}>
              {t.key === "" ? codes.length : t.key === "available" ? available.length : sent.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="state-loading">Loading...</div>
      ) : displayed.length === 0 ? (
        <div style={{ color: "var(--text-muted)", padding: 20 }}>No codes found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Game</th>
                <th>Code</th>
                <th>Status</th>
                <th>Added</th>
                {tab !== "available" && <th>Sent To</th>}
                {tab !== "available" && <th>Order #</th>}
                {tab !== "available" && <th>Sent Date</th>}
                <th>Notes</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((c) => (
                <tr key={c.id}>
                  <td>{c.game_name}</td>
                  <td>
                    <span style={{ fontFamily: "monospace", fontSize: 13 }}>{c.code}</span>
                    <button
                      onClick={() => copyCode(c.code)}
                      title="Copy"
                      style={{
                        marginLeft: 6,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--accent)",
                        fontSize: 13,
                      }}
                    >
                      copy
                    </button>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: c.status === "available" ? "rgba(74,222,128,.15)" : "rgba(168,85,247,.15)",
                        color: c.status === "available" ? "#4ade80" : "#a855f7",
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                    {new Date(c.added_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </td>
                  {tab !== "available" && (
                    <td>
                      {c.sent_to_name && (
                        <span>
                          {c.sent_to_name}
                          {c.sent_to_phone && (
                            <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 4 }}>
                              {c.sent_to_phone}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  )}
                  {tab !== "available" && <td>{c.sent_to_order}</td>}
                  {tab !== "available" && (
                    <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                      {c.sent_at
                        ? new Date(c.sent_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : ""}
                    </td>
                  )}
                  <td style={{ fontSize: 13, color: "var(--text-muted)" }}>{c.notes}</td>
                  <td>
                    {c.status === "available" && (
                      <button
                        className="btn"
                        onClick={() => {
                          setSendId(c.id);
                          setSendName("");
                          setSendPhone("");
                          setSendOrder("");
                        }}
                        style={{ fontSize: 12, height: 28, marginRight: 4 }}
                      >
                        Send
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#f87171",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Send modal */}
      {sendId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setSendId(null)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: 24,
              width: 360,
              maxWidth: "90vw",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>
              Mark as Sent
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Customer Name</label>
              <input style={inputStyle} value={sendName} onChange={(e) => setSendName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Phone Number</label>
              <input style={inputStyle} value={sendPhone} onChange={(e) => setSendPhone(e.target.value)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)" }}>Order Number</label>
              <input style={inputStyle} value={sendOrder} onChange={(e) => setSendOrder(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setSendId(null)} style={{ height: 34 }}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={handleSend}
                disabled={sending || !sendName.trim() || !sendPhone.trim() || !sendOrder.trim()}
                style={{
                  height: 34,
                  background: "var(--accent)",
                  color: "#fff",
                }}
              >
                {sending ? "Saving..." : "Confirm Sent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
