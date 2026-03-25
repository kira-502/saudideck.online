import { useState, useEffect } from "react";
import { api } from "../api";

const MODELS = ["512GB OLED", "1TB OLED"];
const SHIPPING = 100;
const CARD_FEE = 0.025;
const TABBY_PCT = 0.0699;
const TABBY_FIXED = 1.50;
const TABBY_VAT = 0.15;
const TABBY_REFUND_KEEP = 68;

function calcCash(costSar, saleCash) {
  return saleCash * (1 - CARD_FEE) - costSar - SHIPPING;
}

function calcInstallment(costSar, saleInstall) {
  const tabbyFee = saleInstall * TABBY_PCT + TABBY_FIXED;
  return saleInstall - tabbyFee * (1 + TABBY_VAT) - costSar - SHIPPING;
}

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
  marginBottom: 0,
};

export default function Devices() {
  const [rate, setRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [costAed, setCostAed] = useState({ "512GB OLED": "", "1TB OLED": "" });
  const [saleCash, setSaleCash] = useState({ "512GB OLED": "2799", "1TB OLED": "3199" });
  const [saleInstall, setSaleInstall] = useState({ "512GB OLED": "2999", "1TB OLED": "3399" });
  const [notes, setNotes] = useState({ "512GB OLED": "", "1TB OLED": "" });
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState("");

  const refreshRate = () => {
    setRateLoading(true);
    api.aedRate()
      .then(({ rate: r }) => setRate(r))
      .catch(() => setRate(1.0219))
      .finally(() => setRateLoading(false));
  };

  useEffect(() => {
    refreshRate();
    api.deviceRecords().then(setRecords).catch(() => {}).finally(() => setRecordsLoading(false));
  }, []);

  const getCalc = (model) => {
    const aed = parseFloat(costAed[model]);
    const cash = parseFloat(saleCash[model]);
    const install = parseFloat(saleInstall[model]);
    if (!aed || !rate || !cash || !install) return null;
    const costSar = aed * rate;
    return {
      costSar,
      profitCash: calcCash(costSar, cash),
      profitInstall: calcInstallment(costSar, install),
    };
  };

  const handleSave = async (model) => {
    const calc = getCalc(model);
    if (!calc) return;
    setSaving((s) => ({ ...s, [model]: true }));
    try {
      const rec = await api.saveDeviceRecord({
        model,
        cost_aed: parseFloat(costAed[model]),
        aed_to_sar_rate: rate,
        cost_sar: calc.costSar,
        shipping_sar: SHIPPING,
        sale_price_cash: parseFloat(saleCash[model]),
        sale_price_installment: parseFloat(saleInstall[model]),
        profit_cash: calc.profitCash,
        profit_installment: calc.profitInstall,
        notes: notes[model] || null,
      });
      setRecords((prev) => [rec, ...prev]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving((s) => ({ ...s, [model]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await api.deleteDeviceRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const fmt = (n) => (typeof n === "number" ? n.toFixed(2) : "—");
  const profitColor = (n) => (n > 0 ? "var(--green)" : "var(--red)");

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Steam Deck Pricing</h1>
        <span className="text-muted" style={{ fontSize: 13 }}>
          {rateLoading ? "Loading rate…" : `1 AED = ${rate?.toFixed(4)} SAR`}
        </span>
        <button
          className="btn"
          onClick={refreshRate}
          style={{ fontSize: 12, padding: "3px 10px" }}
        >
          ↻ Refresh Rate
        </button>
      </div>

      {error && <div className="text-error" style={{ marginBottom: 12, fontSize: 13 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        {MODELS.map((model) => {
          const calc = getCalc(model);
          return (
            <div key={model} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 20 }}>
              <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "var(--accent)" }}>{model}</h2>

              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Cost Price (AED)
                  <input
                    type="number"
                    value={costAed[model]}
                    onChange={(e) => setCostAed((p) => ({ ...p, [model]: e.target.value }))}
                    placeholder="e.g. 1400"
                    style={inputStyle}
                  />
                </label>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  Cost in SAR:{" "}
                  <span style={{ color: "var(--text)" }}>
                    {costAed[model] && rate ? `${(parseFloat(costAed[model]) * rate).toFixed(2)} SAR` : "—"}
                  </span>
                </div>
                <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Cash Sale Price (SAR)
                  <input
                    type="number"
                    value={saleCash[model]}
                    onChange={(e) => setSaleCash((p) => ({ ...p, [model]: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
                <label style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Installment Sale Price (SAR)
                  <input
                    type="number"
                    value={saleInstall[model]}
                    onChange={(e) => setSaleInstall((p) => ({ ...p, [model]: e.target.value }))}
                    style={inputStyle}
                  />
                </label>
              </div>

              {calc && (
                <div style={{ background: "var(--bg)", borderRadius: 6, padding: 12, marginBottom: 12, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="text-muted">Shipping</span>
                    <span>{SHIPPING} SAR</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="text-muted">Cash profit</span>
                    <span style={{ color: profitColor(calc.profitCash), fontWeight: 600 }}>{fmt(calc.profitCash)} SAR</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="text-muted">Installment profit</span>
                    <span style={{ color: profitColor(calc.profitInstall), fontWeight: 600 }}>{fmt(calc.profitInstall)} SAR</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 6, marginTop: 6 }}>
                    <span className="text-muted">Refund loss (Tabby keeps)</span>
                    <span style={{ color: "var(--red)" }}>-{TABBY_REFUND_KEEP} SAR</span>
                  </div>
                </div>
              )}

              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 8 }}>
                Notes (optional)
                <input
                  type="text"
                  value={notes[model]}
                  onChange={(e) => setNotes((p) => ({ ...p, [model]: e.target.value }))}
                  placeholder="e.g. price drop this week"
                  style={{ ...inputStyle, fontSize: 13 }}
                />
              </label>

              <button
                onClick={() => handleSave(model)}
                disabled={!calc || saving[model]}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: 4,
                  border: "none",
                  background: calc ? "var(--accent)" : "var(--border)",
                  color: calc ? "#000" : "var(--muted)",
                  cursor: calc ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  fontSize: 13,
                  transition: "opacity .15s",
                }}
              >
                {saving[model] ? "Saving…" : "Save Snapshot"}
              </button>
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Price History</h2>
      {recordsLoading ? (
        <div className="state-loading" style={{ fontSize: 13 }}>Loading…</div>
      ) : records.length === 0 ? (
        <div className="state-empty" style={{ fontSize: 13 }}>No records yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Model</th>
                <th>Cost (AED)</th>
                <th>Cost (SAR)</th>
                <th>Cash Profit</th>
                <th>Install Profit</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="text-muted">
                    {new Date(r.recorded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.model}</td>
                  <td>{r.cost_aed} AED</td>
                  <td>{r.cost_sar.toFixed(2)} SAR</td>
                  <td style={{ color: profitColor(r.profit_cash), fontWeight: 600 }}>{r.profit_cash.toFixed(2)} SAR</td>
                  <td style={{ color: profitColor(r.profit_installment), fontWeight: 600 }}>{r.profit_installment.toFixed(2)} SAR</td>
                  <td className="text-muted">{r.notes || "—"}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(r.id)}
                      aria-label={`Delete price record for ${r.model}`}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
