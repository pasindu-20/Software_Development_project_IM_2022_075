import { useEffect, useMemo, useState } from "react";
import {
  listCashPaymentsApi,
  confirmCashPaymentApi,
  getBookingPaymentDetailsApi,
  saveBookingPaymentApi,
} from "../../api/receptionApi";

export default function RecCashPayments() {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [bookingIdSearch, setBookingIdSearch] = useState("");
  const [enrollmentIdSearch, setEnrollmentIdSearch] = useState("");

  const [bookingLookupId, setBookingLookupId] = useState("");
  const [bookingDetails, setBookingDetails] = useState(null);
  const [bookingPaymentStatus, setBookingPaymentStatus] = useState("PENDING");

  const [noteById, setNoteById] = useState({});
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await listCashPaymentsApi();
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load cash payments");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleLoadBooking = async () => {
    setErr("");
    setInfo("");
    setBookingDetails(null);

    const id = bookingLookupId.trim();
    if (!id) {
      setErr("Enter a booking ID");
      return;
    }

    setLookupLoading(true);
    try {
      const res = await getBookingPaymentDetailsApi(id);
      const data = res.data || {};
      setBookingDetails(data);
      setBookingPaymentStatus(data?.payment?.payment_status || "PENDING");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load booking");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleUpdateBookingPaymentStatus = async () => {
    setErr("");
    setInfo("");

    const id = bookingLookupId.trim();
    if (!id || !bookingDetails?.booking) {
      setErr("Load a booking first");
      return;
    }

    const existingPayment = bookingDetails.payment || null;

    const amount =
      Number(existingPayment?.amount || 0) > 0
        ? Number(existingPayment.amount)
        : 2500;

    const paymentMethod = existingPayment?.payment_method || "CASH";
    const transactionRef = existingPayment?.transaction_ref || null;

    setSaveLoading(true);
    try {
      await saveBookingPaymentApi(id, {
        amount,
        payment_method: paymentMethod,
        payment_status: bookingPaymentStatus,
        transaction_ref: transactionRef,
      });

      setInfo("Payment status updated successfully.");
      await handleLoadBooking();
      await loadPayments();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update payment status");
    } finally {
      setSaveLoading(false);
    }
  };

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
          String(p.booking_type || "").toLowerCase().includes(q) ||
          String(p.payment_for || "").toLowerCase().includes(q)
        );
      });
    }

    return rows;
  }, [payments, bookingIdSearch, enrollmentIdSearch, search]);

  const handleConfirm = async (paymentId) => {
    setConfirmingId(paymentId);
    setErr("");
    setInfo("");

    try {
      await confirmCashPaymentApi(paymentId, {
        note: noteById[paymentId]?.trim() || null,
      });

      setInfo("Cash payment confirmed successfully.");
      await loadPayments();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to confirm cash payment");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Update Cash Payments</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 12 }}>
        <div style={{ fontWeight: 600 }}>Search by Booking ID</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
          <input
            placeholder="Booking ID"
            value={bookingLookupId}
            onChange={(e) => setBookingLookupId(e.target.value)}
          />
          <button type="button" onClick={handleLoadBooking} disabled={lookupLoading}>
            {lookupLoading ? "Loading..." : "Load Booking"}
          </button>
        </div>

        {bookingDetails?.booking && (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 14,
              display: "grid",
              gap: 12,
              background: "#fafafa",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(220px, 1fr))",
                gap: 8,
              }}
            >
              <div><strong>Booking ID:</strong> {bookingDetails.booking.id}</div>
              <div><strong>Customer:</strong> {bookingDetails.booking.customer_name || "—"}</div>
              <div><strong>Phone:</strong> {bookingDetails.booking.customer_phone || "—"}</div>
              <div><strong>Booking Type:</strong> {bookingDetails.booking.booking_type || "—"}</div>
              <div><strong>Booking Date:</strong> {bookingDetails.booking.booking_date || "—"}</div>
              <div><strong>Time Slot:</strong> {bookingDetails.booking.time_slot || "—"}</div>
              <div><strong>Booking Status:</strong> {bookingDetails.booking.status || "—"}</div>
              <div><strong>Payment No:</strong> {bookingDetails.payment?.payment_no || "—"}</div>
              <div><strong>Amount:</strong> {bookingDetails.payment?.amount || "—"}</div>
              <div><strong>Payment Method:</strong> {bookingDetails.payment?.payment_method || "CASH"}</div>
              <div><strong>Reference No:</strong> {bookingDetails.payment?.transaction_ref || "—"}</div>
              <div><strong>Current Payment Status:</strong> {bookingDetails.payment?.payment_status || "PENDING"}</div>
            </div>

            <div style={{ display: "grid", gap: 6, maxWidth: 260 }}>
              <label>Update Payment Status</label>
              <select
                value={bookingPaymentStatus}
                onChange={(e) => setBookingPaymentStatus(e.target.value)}
              >
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={handleUpdateBookingPaymentStatus}
                disabled={saveLoading}
              >
                {saveLoading ? "Updating..." : "Update Payment Status"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 14 }}>
        <div style={{ fontWeight: 600 }}>Pending Cash Payments</div>

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
            placeholder="Payment no, customer, child, class, phone..."
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
            No pending cash payments found.
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

                {payment.booking_id ? (
                  <>
                    <div><strong>Booking ID:</strong> {payment.booking_id}</div>
                    <div><strong>Booking Type:</strong> {payment.booking_type || "—"}</div>
                    <div><strong>Date:</strong> {payment.booking_date || "—"}</div>
                    <div><strong>Time Slot:</strong> {payment.time_slot || "—"}</div>
                  </>
                ) : null}

                {payment.enrollment_id ? (
                  <>
                    <div><strong>Enrollment ID:</strong> {payment.enrollment_id}</div>
                    <div><strong>Child:</strong> {payment.child_name || "—"}</div>
                    <div><strong>Class:</strong> {payment.class_title || "—"}</div>
                    <div><strong>Enrollment Status:</strong> {payment.enrollment_status || "—"}</div>
                  </>
                ) : null}
              </div>

              <div><strong>Notes:</strong> {payment.notes || "—"}</div>

              <textarea
                placeholder="Confirmation note (optional)"
                value={noteById[payment.id] || ""}
                onChange={(e) =>
                  setNoteById((prev) => ({
                    ...prev,
                    [payment.id]: e.target.value,
                  }))
                }
                rows={3}
              />

              <div>
                <button
                  type="button"
                  onClick={() => handleConfirm(payment.id)}
                  disabled={confirmingId === payment.id}
                >
                  {confirmingId === payment.id ? "Confirming..." : "Confirm Cash Payment"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}