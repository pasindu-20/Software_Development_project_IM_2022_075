import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  CreditCard,
  GraduationCap,
  MessageCircleMore,
  Rows3,
} from "lucide-react";
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
    <div className="instructorPage receptionPage receptionDashboardPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Receptionist Dashboard</h2>
      </div>

      {err ? <div className="instructorError">{err}</div> : null}

      {loading ? (
        <div className="instructorContentCard receptionDashboardPanel">
          <div className="instructorMuted">Loading dashboard data…</div>
        </div>
      ) : (
        <>
          <div className="receptionStatsGrid receptionDashboardStatsGrid">
            <StatCard icon={Rows3} title="Total Bookings" value={stats.totalBookings} />
            <StatCard icon={CalendarClock} title="Pending Bookings" value={stats.pendingBookings} />
            <StatCard
              icon={CreditCard}
              title="Cash Payments Pending"
              value={stats.pendingCashPayments}
            />
            <StatCard
              icon={MessageCircleMore}
              title="Open Inquiries"
              value={stats.totalInquiries}
            />
            <StatCard
              icon={GraduationCap}
              title="Pending Enrollments"
              value={stats.pendingEnrollments}
            />
          </div>

          <div className="receptionQuickGrid receptionDashboardQuickGrid">
            <div className="instructorContentCard receptionDashboardPanel">
              <div className="instructorSectionHeader">
                <div>
                  <h3 className="instructorSectionTitle">Pending Actions</h3>
                  <p className="instructorSectionText">
                    
                  </p>
                </div>

                <button className="receptionSecondaryButton" onClick={load} type="button">
                  Refresh
                </button>
              </div>

              <div className="receptionActionList">
                {quickActions.map((item) => (
                  <div className="receptionActionCard" key={item.title}>
                    <div className="receptionActionCopy">
                      <h4>{item.title}</h4>
                      <p>{item.subtitle}</p>
                    </div>

                    <div className="receptionActionRight">
                      {item.count !== null ? (
                        <span
                          className={`receptionActionBadge${
                            item.count > 0 ? " receptionActionBadgeActive" : ""
                          }`}
                        >
                          {item.count}
                        </span>
                      ) : null}

                      <button className="instructorButton" onClick={item.onClick} type="button">
                        {item.btn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="instructorContentCard receptionDashboardPanel">
              <div className="instructorSectionHeader">
                <div>
                  <h3 className="instructorSectionTitle">Recent Bookings</h3>
                  <p className="instructorSectionText">Latest booking activity.</p>
                </div>
              </div>

              {recentBookings.length === 0 ? (
                <div className="instructorMuted">No recent bookings found.</div>
              ) : (
                <div className="instructorTableOuter">
                  <table className="instructorTable">
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
                      {recentBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>{formatBookingId(booking.id)}</td>
                          <td>{booking.customer_name || "-"}</td>
                          <td>{formatType(booking.booking_type)}</td>
                          <td>{formatDate(booking.booking_date)}</td>
                          <td>{booking.time_slot || "-"}</td>
                          <td>
                            <span
                              className={`receptionStatusPill ${String(
                                booking.status || ""
                              ).toLowerCase()}`}
                            >
                              {booking.status || "-"}
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
        </>
      )}
    </div>
  );
}

function StatCard({ icon, title, value }) {
  const LucideIcon = icon;

  return (
    <div className="instructorStatCard">
      <div className="instructorStatIcon">
        <LucideIcon size={20} strokeWidth={2} />
      </div>

      <div>
        <div className="instructorStatLabel">{title}</div>
        <div className="instructorStatValue">{value}</div>
      </div>
    </div>
  );
}