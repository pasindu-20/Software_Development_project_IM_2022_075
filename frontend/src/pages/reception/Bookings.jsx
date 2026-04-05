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
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const formatType = (value) => {
    if (!value) return "—";
    return String(value).replaceAll("_", " ");
  };

  return (
    <div className="instructorPage receptionPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">View Bookings</h2>
      </div>

      <div className="instructorContentCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Bookings List</h3>
            <p className="instructorSectionText">
              
            </p>
          </div>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}

        {loading ? (
          <div className="instructorMuted">Loading bookings…</div>
        ) : rows.length === 0 ? (
          <div className="instructorMuted">No bookings found.</div>
        ) : (
          <div className="instructorTableOuter">
            <table className="instructorTable">
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
                    <td>{formatType(b.booking_type)}</td>
                    <td>{b.booking_date || "—"}</td>
                    <td>{b.time_slot || "—"}</td>
                    <td>
                      <span
                        className={`receptionStatusPill ${String(
                          b.status || ""
                        ).toLowerCase()}`}
                      >
                        {b.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}