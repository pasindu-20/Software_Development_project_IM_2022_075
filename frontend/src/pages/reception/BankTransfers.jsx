import { useEffect, useMemo, useState } from "react";
import {
  listBankTransferPaymentsApi,
  confirmBankTransferPaymentApi,
} from "../../api/receptionApi";

export default function RecBankTransfers() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [bookingIdSearch, setBookingIdSearch] = useState("");
  const [enrollmentIdSearch, setEnrollmentIdSearch] = useState("");
  const [noteById, setNoteById] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const loadPayments = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await listBankTransferPaymentsApi();
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load bank transfer payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filtered = useMemo(() => {
    let rows = [...payments];

    const bookingQ = bookingIdSearch.trim();
    const enrollmentQ = enrollmentIdSearch.trim();
    const q = search.trim().toLowerCase();

    if (bookingQ) {
      rows = rows.filter((p) => String(p.booking_id || "") === bookingQ);
    }

    if (enrollmentQ) {
      rows = rows.filter((p) => String(p.enrollment_id || "") === enrollmentQ);
    }

    if (q) {
      rows = rows.filter((p) => {
        return (
          String(p.id || "").toLowerCase().includes(q) ||
          String(p.payment_no || "").toLowerCase().includes(q) ||
          String(p.booking_id || "").toLowerCase().includes(q) ||
          String(p.enrollment_id || "").toLowerCase().includes(q) ||
          String(p.customer_name || "").toLowerCase().includes(q) ||
          String(p.customer_phone || "").toLowerCase().includes(q) ||
          String(p.child_name || "").toLowerCase().includes(q) ||
          String(p.class_title || "").toLowerCase().includes(q) ||
          String(p.reference_no || "").toLowerCase().includes(q) ||
          String(p.payment_for || "").toLowerCase().includes(q)
        );
      });
    }

    return rows;
  }, [payments, bookingIdSearch, enrollmentIdSearch, search]);

  const handleApprove = async (paymentId) => {
    setConfirmingId(paymentId);
    setErr("");
    setInfo("");

    try {
      await confirmBankTransferPaymentApi(paymentId, {
        note: noteById[paymentId]?.trim() || null,
      });

      setInfo("Bank transfer approved successfully.");
      await loadPayments();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to approve bank transfer");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Approve Bank Transfers</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 14 }}>
        <div style={{ fontWeight: 600 }}>Pending Bank Transfer Payments</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "end" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label>Filter by Booking ID</label>
            <input
              type="text"
              placeholder="Booking ID"
              value={bookingIdSearch}
              onChange={(e) => setBookingIdSearch(e.target.value)}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label>Filter by Enrollment ID</label>
            <input
              type="text"
              placeholder="Enrollment ID"
              value={enrollmentIdSearch}
              onChange={(e) => setEnrollmentIdSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setBookingIdSearch("");
              setEnrollmentIdSearch("");
              setSearch("");
            }}
          >
            Clear
          </button>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>General Search</label>
          <input
            placeholder="Payment no, customer, child, class, phone, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <button type="button" onClick={loadPayments} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {info && <div style={{ color: "green" }}>{info}</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, background: "#fafafa" }}>
            No pending bank transfer payments found.
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((payment) => (
            <div
              key={payment.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                background: "#fafafa",
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 8 }}>
                <div><strong>Payment ID:</strong> {payment.id}</div>
                <div><strong>Payment No:</strong> {payment.payment_no || "—"}</div>
                <div><strong>For:</strong> {payment.payment_for || "—"}</div>
                <div><strong>Amount:</strong> LKR {Number(payment.amount || 0).toFixed(2)}</div>
                <div><strong>Method:</strong> {payment.payment_method || "—"}</div>
                <div><strong>Status:</strong> {payment.status || "—"}</div>
                <div><strong>Customer:</strong> {payment.customer_name || "—"}</div>
                <div><strong>Phone:</strong> {payment.customer_phone || "—"}</div>
                <div><strong>Booking ID:</strong> {payment.booking_id || "—"}</div>
                <div><strong>Enrollment ID:</strong> {payment.enrollment_id || "—"}</div>
                <div><strong>Child:</strong> {payment.child_name || "—"}</div>
                <div><strong>Class:</strong> {payment.class_title || "—"}</div>
                <div><strong>Reference No:</strong> {payment.reference_no || "—"}</div>
                <div><strong>Created At:</strong> {payment.created_at ? new Date(payment.created_at).toLocaleString() : "—"}</div>
              </div>

              {payment.bank_slip_data ? (
                <div>
                  <a
                    href={payment.bank_slip_data}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontWeight: 700 }}
                  >
                    View Uploaded Bank Slip
                  </a>
                  {payment.bank_slip_name ? (
                    <div style={{ marginTop: 4, fontSize: 13, opacity: 0.75 }}>
                      File: {payment.bank_slip_name}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={{ color: "crimson", fontWeight: 700 }}>
                  No bank slip found.
                </div>
              )}

              <div style={{ display: "grid", gap: 6 }}>
                <label>Approval Note (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Add a note"
                  value={noteById[payment.id] || ""}
                  onChange={(e) =>
                    setNoteById((prev) => ({ ...prev, [payment.id]: e.target.value }))
                  }
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleApprove(payment.id)}
                  disabled={confirmingId === payment.id}
                >
                  {confirmingId === payment.id ? "Approving..." : "Approve Bank Transfer"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}