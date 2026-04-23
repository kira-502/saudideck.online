import { useState } from "react";
import { api } from "../api";

const STATUS_LABEL = { active: "فعّال", expiring: "ينتهي قريباً", expired: "منتهي" };
const STATUS_COLOR = {
  active: "var(--green)",
  expiring: "var(--amber)",
  expired: "var(--red)",
};

function formatExpiry(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("ar-SA", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function Campaign() {
  const [subs, setSubs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentMap, setSentMap] = useState({});
  const [sendingMap, setSendingMap] = useState({});
  const [sendingAll, setSendingAll] = useState(false);
  const [testStatus, setTestStatus] = useState("");
  const [testSending, setTestSending] = useState(false);

  const sendTest = async () => {
    const phone = window.prompt("Send test to which phone number? (include country code, no +)");
    if (!phone || !/^\d{8,15}$/.test(phone.trim())) {
      if (phone) setTestStatus("✗ Invalid phone");
      return;
    }
    setTestSending(true);
    setTestStatus("");
    try {
      await api.campaignSend({ phone: phone.trim(), name: "Test", expiry_date: "01/05/2026" });
      setTestStatus("✓ Sent successfully");
    } catch (e) {
      setTestStatus("✗ " + e.message);
    } finally {
      setTestSending(false);
    }
  };

  const load = () => {
    setLoading(true);
    setError("");
    api.campaignSubscribers()
      .then((data) => setSubs(Array.isArray(data) ? data : data.subscriptions || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  const sendOne = async (sub) => {
    const key = sub.phone || sub.id;
    setSendingMap((p) => ({ ...p, [key]: true }));
    try {
      await api.campaignSend({
        phone: sub.phone,
        name: sub.name || sub.customerName || "عزيزي العميل",
        expiry_date: formatExpiry(sub.expiryDate || sub.expiry_date || sub.expiry),
      });
      setSentMap((p) => ({ ...p, [key]: true }));
    } catch (e) {
      setSentMap((p) => ({ ...p, [key]: "error: " + e.message }));
    } finally {
      setSendingMap((p) => ({ ...p, [key]: false }));
    }
  };

  const sendAll = async () => {
    if (!subs) return;
    setSendingAll(true);
    const unsent = subs.filter((s) => !sentMap[s.phone || s.id]);
    for (const sub of unsent) {
      await sendOne(sub);
      await new Promise((r) => setTimeout(r, 500));
    }
    setSendingAll(false);
  };

  const sentCount = Object.values(sentMap).filter((v) => v === true).length;
  const failCount = Object.values(sentMap).filter((v) => typeof v === "string").length;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Eid Campaign
          {subs && <span className="text-muted" style={{ fontSize: 14, marginLeft: 10 }}>{subs.length} subscribers</span>}
        </h1>
        <div className="page-header-actions">
          {subs && sentCount > 0 && (
            <span className="text-success" style={{ fontSize: 13 }}>
              ✓ {sentCount} sent{failCount > 0 ? `, ${failCount} failed` : ""}
            </span>
          )}
          {subs && (
            <button
              className="btn"
              onClick={sendAll}
              disabled={sendingAll || sentCount === subs.length}
              style={{ background: "rgba(167,139,250,0.15)", borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              {sendingAll ? `Sending… (${sentCount}/${subs.length})` : "Send All"}
            </button>
          )}
          <button className="btn" onClick={load} disabled={loading}>
            {loading ? "Loading…" : subs ? "↻ Refresh" : "Load Subscribers"}
          </button>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <span className="text-muted" style={{ fontSize: 13 }}>Test send to +966503505084:</span>
        <button className="btn" onClick={sendTest} disabled={testSending} style={{ padding: "4px 14px", fontSize: 13 }}>
          {testSending ? "Sending…" : "Send Test"}
        </button>
        {testStatus && (
          <span style={{ fontSize: 13, color: testStatus.startsWith("✓") ? "var(--green)" : "var(--red)" }}>
            {testStatus}
          </span>
        )}
      </div>

      {error && <div className="text-error" style={{ marginBottom: 16 }}>{error}</div>}

      {!subs && !loading && (
        <div className="text-muted" style={{ marginTop: 40, textAlign: "center" }}>
          Click "Load Subscribers" to fetch the list.
        </div>
      )}

      {subs && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((sub) => {
                const key = sub.phone || sub.id;
                const sent = sentMap[key];
                const sending = sendingMap[key];
                const status = sub.status;
                return (
                  <tr key={key} style={{ opacity: sent === true ? 0.6 : 1 }}>
                    <td style={{ fontWeight: 500 }}>{sub.name || sub.customerName || "—"}</td>
                    <td className="text-muted" style={{ fontSize: 12, fontFamily: "monospace" }}>{sub.phone}</td>
                    <td>
                      <span className="badge" style={{ color: STATUS_COLOR[status] || "var(--text-muted)", background: "transparent" }}>
                        {STATUS_LABEL[status] || status || "—"}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: 12 }}>
                      {formatExpiry(sub.expiryDate || sub.expiry_date || sub.expiry)}
                    </td>
                    <td>
                      {sent === true ? (
                        <span className="text-success" style={{ fontSize: 13 }}>✓ Sent</span>
                      ) : typeof sent === "string" ? (
                        <span className="text-error" style={{ fontSize: 11 }} title={sent}>✗ Failed</span>
                      ) : (
                        <button
                          onClick={() => sendOne(sub)}
                          disabled={sending || sendingAll}
                          style={{
                            padding: "3px 10px",
                            fontSize: 12,
                            borderRadius: 4,
                            border: "1px solid var(--accent)",
                            background: "rgba(167,139,250,0.12)",
                            color: "var(--accent)",
                            cursor: sending ? "default" : "pointer",
                          }}
                        >
                          {sending ? "…" : "إرسال"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
