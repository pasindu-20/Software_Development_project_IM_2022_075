import { useEffect, useState } from "react";
import { listBookingsApi } from "../../api/receptionApi";

export default function RecBookings() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await listBookingsApi();
      setRows(res.data || []);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>View Bookings</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#666" }}>No bookings found.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.customer_name || "—"}</td>
                  <td>{b.customer_phone || "—"}</td>
                  <td>{b.booking_type || "—"}</td>
                  <td>{b.booking_date || "—"}</td>
                  <td>{b.time_slot || "—"}</td>
                  <td>{b.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}