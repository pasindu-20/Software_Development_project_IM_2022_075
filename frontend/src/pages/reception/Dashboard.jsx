import { useEffect, useState } from "react";
import { listBookingsApi, listCashPaymentsApi, listInquiriesApi } from "../../api/receptionApi";

export default function RecDashboard() {
  const [stats, setStats] = useState({
    bookings: "—",
    cashPending: "—",
    inquiries: "—",
  });

  const [err, setErr] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setErr("");
    try {
      const [b, p, q] = await Promise.allSettled([
        listBookingsApi(),
        listCashPaymentsApi(),
        listInquiriesApi(),
      ]);

      const bookings = b.status === "fulfilled" ? (b.value.data?.length ?? 0) : "—";
      const cashPending = p.status === "fulfilled" ? (p.value.data?.length ?? 0) : "—";
      const inquiries = q.status === "fulfilled" ? (q.value.data?.length ?? 0) : "—";

      setStats({ bookings, cashPending, inquiries });
    } catch {
      setErr("Dashboard APIs not ready or server error.");
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Receptionist Dashboard</h2>

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Card title="Bookings" value={String(stats.bookings)} />
        <Card title="Cash Payments Pending" value={String(stats.cashPending)} />
        <Card title="Customer Inquiries" value={String(stats.inquiries)} />
      </div>

      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Quick Notes</h3>
        <ul style={{ margin: 0 }}>
          <li>Record manual bookings made at the counter.</li>
          <li>Confirm cash payments received.</li>
          <li>Update inquiry status after customer follow-up.</li>
        </ul>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ background: "white", padding: 14, borderRadius: 12 }}>
      <div style={{ fontSize: 13, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
