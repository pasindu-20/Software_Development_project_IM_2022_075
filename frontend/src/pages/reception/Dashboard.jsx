import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getReceptionDashboardApi,
  listBookingsApi,
} from "../../api/receptionApi";

export default function RecDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    pendingCashPayments: 0,
    totalInquiries: 0,
    pendingEnrollments: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);

    try {
      const [summaryRes, bookingsRes] = await Promise.all([
        getReceptionDashboardApi(),
        listBookingsApi(),
      ]);

      setStats({
        totalBookings: Number(summaryRes.data?.totalBookings || 0),
        pendingBookings: Number(summaryRes.data?.pendingBookings || 0),
        pendingCashPayments: Number(summaryRes.data?.pendingCashPayments || 0),
        totalInquiries: Number(summaryRes.data?.totalInquiries || 0),
        pendingEnrollments: Number(summaryRes.data?.pendingEnrollments || 0),
      });

      const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      setRecentBookings(bookings.slice(0, 5));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load receptionist dashboard");
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Pending Bookings",
      subtitle: "Bookings waiting for review",
      count: stats.pendingBookings,
      btn: "View",
      onClick: () => navigate("/reception/bookings"),
    },
    {
      title: "Cash Payments Pending",
      subtitle: "Counter payments to confirm",
      count: stats.pendingCashPayments,
      btn: "Open",
      onClick: () => navigate("/reception/cash-payments"),
    },
    {
      title: "Open Inquiries",
      subtitle: "Customer follow-up needed",
      count: stats.totalInquiries,
      btn: "Open",
      onClick: () => navigate("/reception/inquiries"),
    },
    {
      title: "Pending Enrollments",
      subtitle: "Class enrollments to manage",
      count: stats.pendingEnrollments,
      btn: "Open",
      onClick: () => navigate("/reception/enrollment"),
    },
    {
      title: "Add Manual Booking",
      subtitle: "Create a booking for walk-in customers",
      count: null,
      btn: "Create",
      onClick: () => navigate("/reception/manual-booking"),
    },
  ];

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-LK");
  };

  const formatType = (value) => {
    if (!value) return "-";
    return String(value).replaceAll("_", " ");
  };

  const formatBookingId = (id) => {
    if (!id) return "-";
    return `BK-${String(id).padStart(4, "0")}`;
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

          <div className="rec-dashboard-bottom">
            <div className="rec-dashboard-panel">
              <div className="rec-dashboard-panel-header">
                <div>
                  <h3>Pending Actions</h3>
                  <p>Quick access to receptionist tasks</p>
                </div>
                <button className="rec-dashboard-refresh-btn" onClick={load}>
                  Refresh
                </button>
              </div>

              <div className="rec-actions-list">
                {quickActions.map((item, index) => (
                  <div className="rec-action-card" key={index}>
                    <div className="rec-action-left">
                      <h4>{item.title}</h4>
                      <p>{item.subtitle}</p>
                    </div>

                    <div className="rec-action-right">
                      {item.count !== null && (
                        <span
                          className={`rec-action-badge ${
                            item.count > 0 ? "active" : "zero"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}

                      <button className="rec-action-btn" onClick={item.onClick}>
                        {item.btn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rec-dashboard-panel">
              <div className="rec-dashboard-panel-header">
                <div>
                  <h3>Recent Bookings</h3>
                  <p>Latest booking activity</p>
                </div>
              </div>

              <div className="rec-bookings-table-wrap">
                <table className="rec-bookings-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.length > 0 ? (
                      recentBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>{formatBookingId(booking.id)}</td>
                          <td>{booking.customer_name || "-"}</td>
                          <td>{formatType(booking.booking_type)}</td>
                          <td>{formatDate(booking.booking_date)}</td>
                          <td>{booking.time_slot || "-"}</td>
                          <td>
                            <span
                              className={`rec-status-pill ${String(
                                booking.status || ""
                              ).toLowerCase()}`}
                            >
                              {booking.status || "-"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="rec-no-data">
                          No recent bookings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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