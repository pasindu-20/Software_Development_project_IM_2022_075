import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import SimpleTable from "../../components/SimpleTable";
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

 const loadAll = async () => {
  try {
    setBusy(true);
    setErr("");

    const results = await Promise.allSettled([
      api.get("/api/parent/me"),
      api.get("/api/parent/bookings"),
      api.get("/api/parent/enrollments"),
      api.get("/api/parent/payments"),
    ]);

    const [meRes, bRes, eRes, pRes] = results;

    if (meRes.status === "fulfilled") {
      setMe(meRes.value.data || null);
    }

    if (bRes.status === "fulfilled") {
      setBookings(bRes.value.data || []);
    } else {
      console.error("Failed to load bookings:", bRes.reason);
    }

    if (eRes.status === "fulfilled") {
      setEnrollments(eRes.value.data || []);
    } else {
      console.error("Failed to load enrollments:", eRes.reason);
    }

    if (pRes.status === "fulfilled") {
      setPayments(pRes.value.data || []);
    } else {
      console.error("Failed to load payments:", pRes.reason);
    }

    const messages = [];
    if (bRes.status === "rejected") messages.push("Failed to load bookings");
    if (eRes.status === "rejected") messages.push("Failed to load enrollments");
    if (pRes.status === "rejected") messages.push("Failed to load payments");
    if (meRes.status === "rejected") messages.push("Failed to load profile");

    setErr(messages.join(" • "));
  } finally {
    setBusy(false);
  }
};

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardAnim = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  const bookingCols = [
    { key: "id", header: "ID" },
    { key: "booking_type", header: "Type" },
    { key: "booking_date", header: "Date" },
    { key: "time_slot", header: "Time" },
    { key: "status", header: "Status" },
  ];

  //  Pay Now action column
  const enrollCols = [
    { key: "id", header: "ID" },
    { key: "child_name", header: "Child" },
    { key: "class_title", header: "Class" },
    { key: "status", header: "Status" },
    {
      key: "pay",
      header: "Pay",
      render: (r) =>
        r.status === "PENDING" ? (
          <Link className="kidBtn" to={`/profile/pay/${r.id}`}>
            Pay Now
          </Link>
        ) : (
          <span style={{ fontWeight: 800, opacity: 0.7 }}>—</span>
        ),
    },
  ];

  //  show receipt + date
  const payCols = [
    { key: "payment_no", header: "Receipt" },
    { key: "class_title", header: "Class" },
    { key: "child_name", header: "Child" },
    {
      key: "amount",
      header: "Amount",
      render: (r) => `LKR ${Number(r.amount || 0).toFixed(2)}`,
    },
    { key: "payment_method", header: "Method" },
    { key: "payment_status", header: "Status" },
    {
      key: "created_at",
      header: "Date",
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "-"),
    },
  ];

  // Summary cards (UI only) 
  const pendingEnrollments = useMemo(
    () => enrollments.filter((e) => String(e.status || "").toUpperCase() === "PENDING").length,
    [enrollments]
  );

  const lastPayment = useMemo(() => {
    if (!payments || payments.length === 0) return null;
    // try most recent by created_at if available
    const sorted = [...payments].sort((a, b) => {
      const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });
    return sorted[0];
  }, [payments]);

  const StatCard = ({ icon, title, value, hint, accent = "soft" }) => (
    <div
      className="kidCard"
      style={{
        padding: 14,
        boxShadow: "none",
        border: "1px solid rgba(0,0,0,0.06)",
        background:
          accent === "warm"
            ? "linear-gradient(180deg, rgba(255, 245, 214, 0.65), rgba(255, 255, 255, 0.9))"
            : accent === "pink"
            ? "linear-gradient(180deg, rgba(255, 220, 220, 0.55), rgba(255, 255, 255, 0.9))"
            : "linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,0.06)",
            fontSize: 18,
          }}
        >
          {icon}
        </div>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: 18, fontWeight: 950 }}>{value}</div>
        </div>
      </div>
      {hint ? <div style={{ marginTop: 10, fontSize: 12.5, opacity: 0.78 }}>{hint}</div> : null}
    </div>
  );

  const SectionHeader = ({ icon, title, subtitle, right }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <h2 style={{ margin: 0 }}>{title}</h2>
        </div>
        {subtitle ? <div style={{ opacity: 0.75, fontWeight: 700 }}>{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* Top card */}
      <motion.div {...cardAnim} className="kidCard" style={{ padding: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="badgeSoft">👧🧒 Parent Profile</div>
            <h1 style={{ margin: "10px 0 0", fontSize: 28, letterSpacing: -0.4 }}>
              My Profile
            </h1>
            <div style={{ marginTop: 6, opacity: 0.75, fontWeight: 700 }}>
              Bookings • Enrollments • Payments in one place
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="kidBtnGhost" onClick={loadAll} disabled={busy}>
              {busy ? "Refreshing..." : "Refresh"}
            </button>
            <button className="kidBtn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* Info mini cards */}
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div className="kidCard" style={{ padding: 12, boxShadow: "none", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}>Name</div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{me?.full_name || "-"}</div>
          </div>
          <div className="kidCard" style={{ padding: 12, boxShadow: "none", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}>Email</div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{me?.email || "-"}</div>
          </div>
          <div className="kidCard" style={{ padding: 12, boxShadow: "none", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}>Phone</div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>{me?.phone || "-"}</div>
          </div>
        </div>

        {/* Summary row */}
        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <StatCard
            icon="📅"
            title="Bookings"
            value={bookings.length}
            hint="Create and track your play-area bookings."
            accent="warm"
          />
          <StatCard
            icon="🎓"
            title="Enrollments"
            value={enrollments.length}
            hint={pendingEnrollments > 0 ? `You have ${pendingEnrollments} pending payment(s).` : "Enroll a child into weekend classes."}
            accent="soft"
          />
          <StatCard
            icon="💳"
            title="Last Payment"
            value={lastPayment ? `LKR ${Number(lastPayment.amount || 0).toFixed(2)}` : "—"}
            hint={lastPayment?.created_at ? `Paid on ${new Date(lastPayment.created_at).toLocaleDateString()}` : "Your receipts will appear here."}
            accent="pink"
          />
        </div>

        {err ? (
          <div style={{ marginTop: 12, color: "#b00020", fontWeight: 900 }}>
            {err}
          </div>
        ) : null}
      </motion.div>

      {/* Bookings */}
      <motion.div {...cardAnim} transition={{ delay: 0.05 }} className="kidCard" style={{ padding: 18 }}>
        <SectionHeader
          icon="📅"
          title="My Bookings"
          subtitle="Reserve play time quickly and track status."
          right={
            <div style={{ display: "flex", gap: 10 }}>
              <Link className="kidBtn" to="/profile/book">
                + Create Booking
              </Link>
            </div>
          }
        />

        <div style={{ marginTop: 10 }}>
          {bookings.length === 0 ? (
            <div
              className="kidCard"
              style={{
                padding: 14,
                boxShadow: "none",
                border: "1px dashed rgba(0,0,0,0.18)",
                opacity: 0.95,
              }}
            >
              <div style={{ fontWeight: 900 }}>No bookings yet</div>
              <div style={{ opacity: 0.78, marginTop: 4 }}>
                Click <b>Create Booking</b> to make your first one.
              </div>
            </div>
          ) : (
            <SimpleTable columns={bookingCols} rows={bookings} />
          )}
        </div>
      </motion.div>

      {/* Enrollments */}
      <motion.div {...cardAnim} transition={{ delay: 0.10 }} className="kidCard" style={{ padding: 18 }}>
        <SectionHeader
          icon="🎓"
          title="My Enrollments"
          subtitle="Enroll children into classes. Pay for pending enrollments."
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="kidBtnGhost" to="/services">
                View Classes
              </Link>
              <Link className="kidBtn" to="/profile/enroll">
                + Enroll Class
              </Link>
            </div>
          }
        />

        <div style={{ marginTop: 10 }}>
          {enrollments.length === 0 ? (
            <div
              className="kidCard"
              style={{
                padding: 14,
                boxShadow: "none",
                border: "1px dashed rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ fontWeight: 900 }}>No enrollments yet</div>
              <div style={{ opacity: 0.78, marginTop: 4 }}>
                Click <b>Enroll Class</b> to start.
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <Link className="kidBtn" to="/profile/enroll">
                  Enroll Now
                </Link>
                <Link className="kidBtnGhost" to="/services">
                  See Available Classes
                </Link>
              </div>
            </div>
          ) : (
            <SimpleTable columns={enrollCols} rows={enrollments} />
          )}
        </div>
      </motion.div>

      {/* Payments */}
      <motion.div {...cardAnim} transition={{ delay: 0.15 }} className="kidCard" style={{ padding: 18 }}>
        <SectionHeader
          icon="💳"
          title="Payment History"
          subtitle="Receipts appear here after payments."
          right={
            pendingEnrollments > 0 ? (
              <span className="badgeSoft"> Pending: {pendingEnrollments}</span>
            ) : (
              <span className="badgeSoft"> All paid</span>
            )
          }
        />

        <div style={{ marginTop: 10 }}>
          {payments.length === 0 ? (
            <div
              className="kidCard"
              style={{
                padding: 14,
                boxShadow: "none",
                border: "1px dashed rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ fontWeight: 900 }}>No payments yet</div>
              <div style={{ opacity: 0.78, marginTop: 4 }}>
                After you pay for an enrollment, receipts will appear here.
              </div>
            </div>
          ) : (
            <SimpleTable columns={payCols} rows={payments} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
