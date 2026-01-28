import { useEffect, useState } from "react";
import { confirmCashPaymentApi, listCashPaymentsApi } from "../../api/receptionApi";

export default function RecCashPayments() {
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setErr("");
    setInfo("");
    setLoading(true);
    try {
      const res = await listCashPaymentsApi();
      setRows(res.data || []);
    } catch {
      setRows([]);
      setErr("API not ready: GET /api/reception/payments/cash");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (payment_id) => {
    setErr("");
    setInfo("");
    setBusyId(payment_id);

    try {
      await confirmCashPaymentApi(payment_id, note);
      setInfo("Cash payment confirmed.");
      setNote("");
      await load();
    } catch {
      setErr("API not ready: POST /api/reception/payments/cash/:id/confirm");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Update Cash Payments</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 10 }}>
        <div style={{ color: "#666" }}>
          Confirm cash received at the counter. (Admin can audit later.)
        </div>

        <textarea rows={3} placeholder="Optional note (receipt no / remark)" value={note} onChange={(e) => setNote(e.target.value)} />

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {info && <div style={{ color: "green" }}>{info}</div>}

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#666" }}>No cash payments pending.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.customer_name || p.full_name || "—"}</td>
                  <td>{p.amount ?? "—"}</td>
                  <td>{p.status || "PENDING"}</td>
                  <td>
                    <button onClick={() => confirm(p.id)} disabled={busyId === p.id}>
                      {busyId === p.id ? "Confirming…" : "Confirm Cash"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
