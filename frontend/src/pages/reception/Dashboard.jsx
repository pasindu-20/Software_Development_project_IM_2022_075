import { useEffect, useState } from "react";
import { getReceptionDashboardApi } from "../../api/receptionApi";

export default function RecDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    pendingCashPayments: 0,
    totalInquiries: 0,
    pendingEnrollments: 0,
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await getReceptionDashboardApi();
      setStats({
        totalBookings: Number(res.data?.totalBookings || 0),
        pendingBookings: Number(res.data?.pendingBookings || 0),
        pendingCashPayments: Number(res.data?.pendingCashPayments || 0),
        totalInquiries: Number(res.data?.totalInquiries || 0),
        pendingEnrollments: Number(res.data?.pendingEnrollments || 0),
      });
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load receptionist dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Receptionist Dashboard</h2>

      {err && <div style={{ color: "crimson" }}>{err}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <Card title="Total Bookings" value={stats.totalBookings} />
            <Card title="Pending Bookings" value={stats.pendingBookings} />
            <Card title="Cash Payments Pending" value={stats.pendingCashPayments} />
            <Card title="Open Inquiries" value={stats.totalInquiries} />
            <Card title="Pending Enrollments" value={stats.pendingEnrollments} />
          </div>

          <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
            <h3 style={{ marginTop: 0 }}>Reception Work Area</h3>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              <li>View all bookings and counter bookings.</li>
              <li>Create manual bookings for walk-in customers.</li>
              <li>Confirm cash payments received at the counter.</li>
              <li>Manage class enrollments.</li>
              <li>Update inquiry status after customer follow-up.</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ background: "white", padding: 14, borderRadius: 12 }}>
      <div style={{ fontSize: 13, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div>
    </div>
  );
}