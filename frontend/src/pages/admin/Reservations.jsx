import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

export default function AdminPayments() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      // expected later: GET /api/admin/payments
      const res = await api.get("/api/admin/payments");
      setRows(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load payments (Unauthorized?)");
    }
  };

  useEffect(() => { load(); }, []);

  const cols = [
    { key: "payment_no", header: "Receipt" },
    { key: "payer_name", header: "Customer" },
    { key: "amount", header: "Amount", render: (r) => `LKR ${Number(r.amount || 0).toFixed(2)}` },
    { key: "payment_method", header: "Method" },
    { key: "payment_status", header: "Status" },
    { key: "created_at", header: "Date", render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "-") },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <div className="badgeSoft">💳 Admin</div>
        <h1 style={{ margin: "8px 0 0" }}>Manage Payments</h1>
        <div style={{ opacity: 0.75, fontWeight: 600 }}>View all payments (cash / bank transfer / card).</div>
      </div>

      {err ? (
        <div className="kidCard" style={{ padding: 12, border: "1px solid #ffd6d6", background: "#fff0f0", color: "#b00020", fontWeight: 800 }}>
          {err}
        </div>
      ) : null}

      <div className="kidCard" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900 }}>Payments</div>
          <button className="kidBtnGhost" onClick={load}>Refresh</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <SimpleTable columns={cols} rows={rows} />
        </div>
      </div>
    </div>
  );
}
