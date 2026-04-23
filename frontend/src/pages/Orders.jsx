import { useEffect, useState } from "react";
import { api } from "../api";

const TABS = [
  { key: "salla", label: "Salla" },
  { key: "g2g", label: "G2G" },
  { key: "plati", label: "Plati" },
  { key: "z2u", label: "Z2U" },
];

function fmtCell(val) {
  if (val == null) return "—";
  if (typeof val === "string" && val.includes("T")) {
    const d = new Date(val);
    if (!isNaN(d)) return d.toLocaleDateString();
  }
  return String(val);
}

export default function Orders() {
  const [tab, setTab] = useState("salla");
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    setError("");
    api.orders(tab, page).then(setData).catch((e) => setError(e.message));
  }, [tab, page]);

  const handleTab = (key) => { setTab(key); setPage(1); };

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 1;

  return (
    <>
      <h1 className="page-title">Orders</h1>
      <div className="tab-bar">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className="btn"
            style={tab === key ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
            onClick={() => handleTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="text-error" style={{ marginBottom: 12 }}>{error}</div>}
      {!data && !error && <div className="state-loading">Loading…</div>}

      {data && (
        <>
          <div className="records-count">{data.total.toLocaleString()} total records</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {data.items.length > 0 &&
                    Object.keys(data.items[0]).map((col) => (
                      <th key={col}>{col.replace(/_/g, " ")}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={`${tab}-${page}-${row.id ?? row.order_num ?? row.order_id ?? row.plati_num}`}>
                    {Object.entries(row).map(([col, val]) => (
                      <td key={col}>{fmtCell(val)}</td>
                    ))}
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
