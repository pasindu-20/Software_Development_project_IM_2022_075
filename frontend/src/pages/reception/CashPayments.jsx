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

    const amount = Number(existingPayment?.amount || 0) > 0 ? Number(existingPayment.amount) : 2500;
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
    <div className="instructorPage receptionPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Update Cash Payments</h2>
      </div>

      <div className="instructorContentCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Search by Booking ID</h3>
            <p className="instructorSectionText">
            </p>
          </div>
        </div>

        <div className="receptionSearchRow">
          <input
            placeholder="Booking ID"
            value={bookingLookupId}
            onChange={(e) => setBookingLookupId(e.target.value)}
          />
          <button className="instructorButton" type="button" onClick={handleLoadBooking} disabled={lookupLoading}>
            {lookupLoading ? "Loading..." : "Load Booking"}
          </button>
        </div>

        {bookingDetails?.booking ? (
          <div className="receptionDetailBox">
            <div className="receptionDetailGrid">
              <div className="receptionDetailItem"><strong>Booking ID:</strong> {bookingDetails.booking.id}</div>
              <div className="receptionDetailItem"><strong>Customer:</strong> {bookingDetails.booking.customer_name || "—"}</div>
              <div className="receptionDetailItem"><strong>Phone:</strong> {bookingDetails.booking.customer_phone || "—"}</div>
              <div className="receptionDetailItem"><strong>Booking Type:</strong> {bookingDetails.booking.booking_type || "—"}</div>
              <div className="receptionDetailItem"><strong>Booking Date:</strong> {bookingDetails.booking.booking_date || "—"}</div>
              <div className="receptionDetailItem"><strong>Time Slot:</strong> {bookingDetails.booking.time_slot || "—"}</div>
              <div className="receptionDetailItem"><strong>Booking Status:</strong> {bookingDetails.booking.status || "—"}</div>
              <div className="receptionDetailItem"><strong>Payment No:</strong> {bookingDetails.payment?.payment_no || "—"}</div>
              <div className="receptionDetailItem"><strong>Amount:</strong> {bookingDetails.payment?.amount || "—"}</div>
              <div className="receptionDetailItem"><strong>Payment Method:</strong> {bookingDetails.payment?.payment_method || "CASH"}</div>
              <div className="receptionDetailItem"><strong>Reference No:</strong> {bookingDetails.payment?.transaction_ref || "—"}</div>
              <div className="receptionDetailItem"><strong>Current Payment Status:</strong> {bookingDetails.payment?.payment_status || "PENDING"}</div>
            </div>

            <label className="instructorField receptionFieldNarrow">
              <span className="instructorFieldLabel">Update Payment Status</span>
              <select value={bookingPaymentStatus} onChange={(e) => setBookingPaymentStatus(e.target.value)}>
                <option value="PENDING">Pending</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
              </select>
            </label>

            <div className="receptionButtonRow">
              <button
                className="instructorButton"
                type="button"
                onClick={handleUpdateBookingPaymentStatus}
                disabled={saveLoading}
              >
                {saveLoading ? "Updating..." : "Update Payment Status"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="instructorContentCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Pending Cash Payments</h3>
            <p className="instructorSectionText">Filter, search, and confirm pending cash records.</p>
          </div>
        </div>

        <div className="receptionFormGrid3">
          <label className="instructorField">
            <span className="instructorFieldLabel">Filter by Booking ID</span>
            <input
              type="text"
              placeholder="Booking ID"
              value={bookingIdSearch}
              onChange={(e) => setBookingIdSearch(e.target.value)}
            />
          </label>

          <label className="instructorField">
            <span className="instructorFieldLabel">Filter by Enrollment ID</span>
            <input
              type="text"
              placeholder="Enrollment ID"
              value={enrollmentIdSearch}
              onChange={(e) => setEnrollmentIdSearch(e.target.value)}
            />
          </label>

          <div className="receptionButtonRow receptionButtonRowEnd">
            <button
              className="receptionSecondaryButton"
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
        </div>

        <label className="instructorField">
          <span className="instructorFieldLabel">General Search</span>
          <input
            placeholder="Payment no, customer, child, class, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="receptionButtonRow">
          <button className="receptionSecondaryButton" type="button" onClick={loadPayments} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}
        {info ? <div className="instructorSuccess">{info}</div> : null}

        {!loading && filtered.length === 0 ? (
          <div className="receptionEmptyState">No pending cash payments found.</div>
        ) : null}

        <div className="receptionCardStack">
          {filtered.map((payment) => (
            <div key={payment.id} className="receptionDetailBox">
              <div className="receptionDetailGrid">
                <div className="receptionDetailItem"><strong>Payment ID:</strong> {payment.id}</div>
                <div className="receptionDetailItem"><strong>Payment No:</strong> {payment.payment_no || "—"}</div>
                <div className="receptionDetailItem"><strong>For:</strong> {payment.payment_for || "—"}</div>
                <div className="receptionDetailItem"><strong>Amount:</strong> LKR {Number(payment.amount || 0).toFixed(2)}</div>
                <div className="receptionDetailItem"><strong>Method:</strong> {payment.payment_method || "—"}</div>
                <div className="receptionDetailItem"><strong>Status:</strong> {payment.status || "—"}</div>
                <div className="receptionDetailItem"><strong>Customer:</strong> {payment.customer_name || "—"}</div>
                <div className="receptionDetailItem"><strong>Phone:</strong> {payment.customer_phone || "—"}</div>
                {payment.booking_id ? (
                  <>
                    <div className="receptionDetailItem"><strong>Booking ID:</strong> {payment.booking_id}</div>
                    <div className="receptionDetailItem"><strong>Booking Type:</strong> {payment.booking_type || "—"}</div>
                    <div className="receptionDetailItem"><strong>Date:</strong> {payment.booking_date || "—"}</div>
                    <div className="receptionDetailItem"><strong>Time Slot:</strong> {payment.time_slot || "—"}</div>
                  </>
                ) : null}
                {payment.enrollment_id ? (
                  <>
                    <div className="receptionDetailItem"><strong>Enrollment ID:</strong> {payment.enrollment_id}</div>
                    <div className="receptionDetailItem"><strong>Child:</strong> {payment.child_name || "—"}</div>
                    <div className="receptionDetailItem"><strong>Class:</strong> {payment.class_title || "—"}</div>
                    <div className="receptionDetailItem"><strong>Enrollment Status:</strong> {payment.enrollment_status || "—"}</div>
                  </>
                ) : null}
              </div>

              <div className="receptionDetailItem"><strong>Notes:</strong> {payment.notes || "—"}</div>

              <label className="instructorField">
                <span className="instructorFieldLabel">Confirmation Note</span>
                <textarea
                  className="receptionTextarea"
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
              </label>

              <div className="receptionButtonRow">
                <button
                  className="instructorButton"
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