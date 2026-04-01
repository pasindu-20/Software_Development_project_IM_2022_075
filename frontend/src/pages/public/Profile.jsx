import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../auth/useAuth";

export default function Profile() {
  const { logout } = useAuth();

  const [me, setMe] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [showAllBookings, setShowAllBookings] = useState(false);
  const [showAllEnrollments, setShowAllEnrollments] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setBusy(true);
      setErr("");

      const results = await Promise.allSettled([
        api.get("/api/parent/me"),
        api.get("/api/parent/bookings"),
        api.get("/api/parent/enrollments"),
        api.get("/api/parent/payments"),
      ]);

      const [meRes, bookingRes, enrollRes, paymentRes] = results;

      if (meRes.status === "fulfilled") {
        setMe(meRes.value.data || null);
      }

      if (bookingRes.status === "fulfilled") {
        setBookings(meResOrArray(bookingRes.value.data));
      }

      if (enrollRes.status === "fulfilled") {
        setEnrollments(meResOrArray(enrollRes.value.data));
      }

      if (paymentRes.status === "fulfilled") {
        setPayments(meResOrArray(paymentRes.value.data));
      }

      const messages = [];
      if (meRes.status === "rejected") messages.push("Failed to load profile");
      if (bookingRes.status === "rejected") messages.push("Failed to load bookings");
      if (enrollRes.status === "rejected") messages.push("Failed to load enrollments");
      if (paymentRes.status === "rejected") messages.push("Failed to load payments");

      setErr(messages.join(" • "));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function meResOrArray(data) {
    return Array.isArray(data) ? data : [];
  }

  const getSafeTime = (value) => {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const formatMoney = (value) => `LKR ${Number(value || 0).toFixed(2)}`;

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-LK");
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-LK");
  };

  const displayStatus = (status) => {
    const value = String(status || "").toUpperCase();

    if (value === "PAID" || value === "SUCCESS") return "CONFIRMED";
    return value || "-";
  };

  const statusClass = (status) => {
    const value = displayStatus(status);

    if (value === "CONFIRMED" || value === "ACTIVE") return "ok";
    if (value === "PENDING") return "warn";
    if (value === "CANCELLED" || value === "FAILED") return "bad";
    return "neutral";
  };

  const children = useMemo(() => {
    if (!me?.children || !Array.isArray(me.children)) return [];

    return me.children.map((child) => ({
      ...child,
      child_name: child.child_name || child.full_name || "-",
    }));
  }, [me]);

  const pendingEnrollments = useMemo(() => {
    return enrollments.filter(
      (item) => String(item.status || "").toUpperCase() === "PENDING"
    ).length;
  }, [enrollments]);

  const confirmedPayments = useMemo(() => {
    return payments.filter((item) => {
      const status = String(item.payment_status || "").toUpperCase();
      return status === "SUCCESS" || status === "PAID";
    }).length;
  }, [payments]);

  const latestPayment = useMemo(() => {
    if (!payments.length) return null;

    return [...payments].sort(
      (a, b) => getSafeTime(b?.created_at) - getSafeTime(a?.created_at)
    )[0];
  }, [payments]);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const aTime = getSafeTime(a?.created_at || a?.booking_date);
      const bTime = getSafeTime(b?.created_at || b?.booking_date);
      return bTime - aTime;
    });
  }, [bookings]);

  const sortedEnrollments = useMemo(() => {
    return [...enrollments].sort((a, b) => {
      const aTime = getSafeTime(a?.created_at);
      const bTime = getSafeTime(b?.created_at);
      return bTime - aTime;
    });
  }, [enrollments]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const aTime = getSafeTime(a?.created_at);
      const bTime = getSafeTime(b?.created_at);
      return bTime - aTime;
    });
  }, [payments]);

  const visibleBookings = showAllBookings ? sortedBookings : sortedBookings.slice(0, 5);
  const visibleEnrollments = showAllEnrollments
    ? sortedEnrollments
    : sortedEnrollments.slice(0, 5);
  const visiblePayments = showAllPayments ? sortedPayments : sortedPayments.slice(0, 5);

  const initials = (me?.full_name || "P").trim().charAt(0).toUpperCase();

  const pageAnim = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35 },
  };

  const ProfileButton = ({
    to,
    onClick,
    children,
    variant = "primary",
    disabled = false,
    type = "button",
  }) => {
    const className = `profileModernBtn ${variant === "ghost" ? "ghost" : "primary"}`;

    if (to) {
      return (
        <Link to={to} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <button type={type} className={className} onClick={onClick} disabled={disabled}>
        {children}
      </button>
    );
  };

  const StatCard = ({ icon, label, value, caption }) => (
    <div className="profileModernStatCard">
      <div className="profileModernStatIcon">{icon}</div>
      <div>
        <div className="profileModernStatLabel">{label}</div>
        <div className="profileModernStatValue">{value}</div>
        {caption ? <div className="profileModernStatCaption">{caption}</div> : null}
      </div>
    </div>
  );

  const Panel = ({ title, subtitle, action, children }) => (
    <motion.section {...pageAnim} className="profileModernPanel">
      <div className="profileModernPanelHead">
        <div>
          <h2 className="profileModernPanelTitle">{title}</h2>
          {subtitle ? <p className="profileModernPanelSub">{subtitle}</p> : null}
        </div>
        {action ? <div className="profileModernPanelAction">{action}</div> : null}
      </div>
      {children}
    </motion.section>
  );

  const EmptyState = ({ title, text, actions = null }) => (
    <div className="profileModernEmpty">
      <div className="profileModernEmptyIcon">✦</div>
      <div className="profileModernEmptyTitle">{title}</div>
      <div className="profileModernEmptyText">{text}</div>
      {actions ? <div className="profileModernEmptyActions">{actions}</div> : null}
    </div>
  );

  return (
    <div className="profileModernWrap">
      <motion.section {...pageAnim} className="profileModernHero">
        <div className="profileModernHeroTop">
          <div>
            <div className="profileModernBadge">Parent dashboard</div>
            <h1 className="profileModernHeroTitle">My Profile</h1>
          </div>

          <div className="profileModernHeroActions">
            <ProfileButton variant="ghost" onClick={loadAll} disabled={busy}>
              {busy ? "Refreshing..." : "Refresh"}
            </ProfileButton>

            <ProfileButton to="/auth/change-password" variant="ghost">
              Change Password
            </ProfileButton>

            <ProfileButton onClick={logout}>Logout</ProfileButton>
          </div>
        </div>

        <div className="profileModernStats">
          <StatCard
            icon="👨‍👩‍👧"
            label="Children"
            value={children.length}
            caption={
              children.length
                ? "Registered under your account"
                : "No children registered yet"
            }
          />

          <StatCard
            icon="📅"
            label="Bookings"
            value={bookings.length}
            caption="Track your play area reservations"
          />

          <StatCard
            icon="🎓"
            label="Pending enrollments"
            value={pendingEnrollments}
            caption={
              pendingEnrollments
                ? "Payments waiting to be completed"
                : "No pending class payments"
            }
          />

          <StatCard
            icon="💳"
            label="Confirmed payments"
            value={confirmedPayments}
            caption={
              latestPayment
                ? `Latest: ${formatMoney(latestPayment.amount)}`
                : "No receipts yet"
            }
          />
        </div>

        {err ? <div className="profileModernAlert">{err}</div> : null}
      </motion.section>

      <div className="profileModernTopGrid">
        <Panel
          title="Account details"
          subtitle="Your parent account information in one place."
        >
          <div className="profileModernIdentity">
            <div className="profileModernAvatar">{initials}</div>

            <div>
              <h3 className="profileModernName">{me?.full_name || "Parent User"}</h3>

              <div className="profileModernMeta">
                <span className={`profileModernPill ${statusClass(me?.status || "ACTIVE")}`}>
                  {displayStatus(me?.status || "ACTIVE")}
                </span>

                <span className="profileModernPill neutral">
                  Parent ID: {me?.id || "-"}
                </span>
              </div>
            </div>
          </div>

          <div className="profileModernInfoGrid">
            <div className="profileModernInfoCard">
              <div className="profileModernInfoLabel">Full name</div>
              <div className="profileModernInfoValue">{me?.full_name || "-"}</div>
            </div>

            <div className="profileModernInfoCard">
              <div className="profileModernInfoLabel">Phone number</div>
              <div className="profileModernInfoValue">{me?.phone || "-"}</div>
            </div>

            <div className="profileModernInfoCard profileModernFullWidth">
              <div className="profileModernInfoLabel">Email address</div>
              <div className="profileModernInfoValue">{me?.email || "-"}</div>
            </div>
          </div>
        </Panel>

        <Panel
          title="My children"
          subtitle="Children registered under this parent account."
        >
          {children.length === 0 ? (
            <EmptyState
              title="No children registered yet"
              text="Once a child is registered in the system, their details will appear here."
            />
          ) : (
            <div className="profileModernChildrenGrid">
              {children.map((child, index) => (
                <div key={child.id || index} className="profileModernChildCard">
                  <div className="profileModernChildTop">
                    <div className="profileModernChildAvatar">🧒</div>
                    <span className="profileModernPill neutral">
                      Child ID: {child.id}
                    </span>
                  </div>

                  <div className="profileModernChildName">{child.child_name || "-"}</div>
                  <div className="profileModernChildMeta">
                    Registered under your account
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="My bookings"
        subtitle="Reserve play time quickly and keep track of each booking status."
        action={<ProfileButton to="/profile/book">+ Create Booking</ProfileButton>}
      >
        {bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            text="Your play area bookings will appear here after you create one."
            actions={<ProfileButton to="/profile/book">Create Booking</ProfileButton>}
          />
        ) : (
          <>
            <div className="profileModernTableWrap">
              <table className="profileModernTable">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleBookings.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>
                        <div className="profileModernTableMain">#{item.id}</div>
                        <div className="profileModernTableSub">
                          {item.booking_type || "Booking"}
                        </div>
                      </td>
                      <td>{formatDate(item.booking_date)}</td>
                      <td>{item.time_slot || "-"}</td>
                      <td>
                        <span className={`profileModernPill ${statusClass(item.status)}`}>
                          {displayStatus(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedBookings.length > 5 && (
              <div className="profileModernTableFooter">
                <button
                  type="button"
                  className="profileModernTextBtn"
                  onClick={() => setShowAllBookings((prev) => !prev)}
                >
                  {showAllBookings
                    ? "Show Less"
                    : `See More (${sortedBookings.length - 5} more)`}
                </button>
              </div>
            )}
          </>
        )}
      </Panel>

      <Panel
        title="My enrollments"
        subtitle="See enrolled classes and complete payments for pending enrollments."
        action={
          <div className="profileModernActionRow">
            <ProfileButton to="/classes" variant="ghost">
              View Classes
            </ProfileButton>

            <ProfileButton to="/profile/enroll">+ Enroll Class</ProfileButton>
          </div>
        }
      >
        {enrollments.length === 0 ? (
          <EmptyState
            title="No enrollments yet"
            text="Enroll a child into a class and it will appear here."
            actions={
              <>
                <ProfileButton to="/profile/enroll">Enroll Now</ProfileButton>
                <ProfileButton to="/services" variant="ghost">
                  See Available Classes
                </ProfileButton>
              </>
            }
          />
        ) : (
          <>
            <div className="profileModernTableWrap">
              <table className="profileModernTable">
                <thead>
                  <tr>
                    <th>Enrollment</th>
                    <th>Child</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEnrollments.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>
                        <div className="profileModernTableMain">#{item.id}</div>
                        <div className="profileModernTableSub">
                          {item.class_title || "Class"}
                        </div>
                      </td>
                      <td>{item.child_name || "-"}</td>
                      <td>
                        <span className={`profileModernPill ${statusClass(item.status)}`}>
                          {displayStatus(item.status)}
                        </span>
                      </td>
                      <td>
                        {String(item.status || "").toUpperCase() === "PENDING" ? (
                          <ProfileButton to={`/profile/pay/${item.id}`}>Pay Now</ProfileButton>
                        ) : (
                          <span className="profileModernPill ok">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedEnrollments.length > 5 && (
              <div className="profileModernTableFooter">
                <button
                  type="button"
                  className="profileModernTextBtn"
                  onClick={() => setShowAllEnrollments((prev) => !prev)}
                >
                  {showAllEnrollments
                    ? "Show Less"
                    : `See More (${sortedEnrollments.length - 5} more)`}
                </button>
              </div>
            )}
          </>
        )}
      </Panel>

      <Panel
        title="Payment history"
        subtitle="Your receipts and payment records appear here after a payment is made."
        action={
          <span className={`profileModernPill ${pendingEnrollments > 0 ? "warn" : "ok"}`}>
            {pendingEnrollments > 0 ? `Pending: ${pendingEnrollments}` : "All paid"}
          </span>
        }
      >
        {payments.length === 0 ? (
          <EmptyState
            title="No payments yet"
            text="After you complete an enrollment payment, the receipt will appear here."
          />
        ) : (
          <>
            <div className="profileModernTableWrap">
              <table className="profileModernTable">
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Details</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {visiblePayments.map((item, index) => (
                    <tr key={item.id || item.payment_no || index}>
                      <td>
                        <div className="profileModernTableMain">
                          {item.payment_no || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="profileModernTableMain">
                          {item.class_title || "-"}
                        </div>
                        <div className="profileModernTableSub">
                          {item.child_name || "-"}
                        </div>
                      </td>
                      <td>{formatMoney(item.amount)}</td>
                      <td>{item.payment_method || "-"}</td>
                      <td>
                        <span
                          className={`profileModernPill ${statusClass(item.payment_status)}`}
                        >
                          {displayStatus(item.payment_status)}
                        </span>
                      </td>
                      <td>{formatDateTime(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sortedPayments.length > 5 && (
              <div className="profileModernTableFooter">
                <button
                  type="button"
                  className="profileModernTextBtn"
                  onClick={() => setShowAllPayments((prev) => !prev)}
                >
                  {showAllPayments
                    ? "Show Less"
                    : `See More (${sortedPayments.length - 5} more)`}
                </button>
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}