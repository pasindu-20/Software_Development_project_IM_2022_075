import { useState } from "react";
import {
  getBookingPaymentDetailsApi,
  saveBookingPaymentApi,
} from "../../api/receptionApi";

function extractAmountFromNotes(notes) {
  if (!notes) return "";

  const match = String(notes).match(/Price:\s*LKR\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!match) return "";

  return match[1].replace(/,/g, "");
}

export default function RecCashPayments() {
  const [bookingId, setBookingId] = useState("");
  const [booking, setBooking] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentStatus, setPaymentStatus] = useState("SUCCESS");
  const [transactionRef, setTransactionRef] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPlayArea = booking?.booking_type === "PLAY_AREA";

  const loadBooking = async () => {
    setErr("");
    setInfo("");
    setBooking(null);
    setExistingPayment(null);

    if (!bookingId || Number(bookingId) <= 0) {
      return setErr("Please enter a valid booking ID.");
    }

    setLoading(true);
    try {
      const res = await getBookingPaymentDetailsApi(bookingId);
      const bookingData = res.data?.booking || null;
      const paymentData = res.data?.payment || null;

      setBooking(bookingData);
      setExistingPayment(paymentData);

      if (paymentData) {
        setAmount(paymentData.amount ?? "");
        setPaymentMethod(paymentData.payment_method || "CASH");
        setPaymentStatus(paymentData.payment_status || "SUCCESS");
        setTransactionRef(paymentData.transaction_ref || "");
      } else {
        const autoAmount =
          bookingData?.booking_type !== "PLAY_AREA"
            ? extractAmountFromNotes(bookingData?.notes)
            : "";

        setAmount(autoAmount);
        setPaymentMethod("CASH");
        setPaymentStatus("SUCCESS");
        setTransactionRef("");
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const savePayment = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!booking) {
      return setErr("Load a booking first.");
    }

    if (!amount || Number(amount) <= 0) {
      return setErr("Please enter a valid amount.");
    }

    setSaving(true);
    try {
      await saveBookingPaymentApi(booking.id, {
        amount: Number(amount),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        transaction_ref: transactionRef || null,
      });

      setInfo("Payment updated successfully.");
      await loadBooking();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Update Cash Payments</h2>

      <div
        style={{
          background: "white",
          padding: 16,
          borderRadius: 12,
          display: "grid",
          gap: 12,
          maxWidth: 800,
        }}
      >
        <div style={{ fontWeight: 600 }}>Enter Booking ID</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
          <input
            placeholder="Booking ID"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value.replace(/\D/g, ""))}
          />
          <button type="button" onClick={loadBooking} disabled={loading}>
            {loading ? "Loading..." : "Load Booking"}
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {info && <div style={{ color: "green" }}>{info}</div>}

        {booking && (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 14,
              background: "#fafafa",
              display: "grid",
              gap: 6,
            }}
          >
            <div><strong>Booking ID:</strong> {booking.id}</div>
            <div><strong>Customer:</strong> {booking.customer_name || "—"}</div>
            <div><strong>Phone:</strong> {booking.customer_phone || "—"}</div>
            <div><strong>Type:</strong> {booking.booking_type || "—"}</div>
            <div><strong>Date:</strong> {booking.booking_date || "—"}</div>
            <div><strong>Time Slot:</strong> {booking.time_slot || "—"}</div>
            <div><strong>Status:</strong> {booking.status || "—"}</div>
            <div><strong>Notes:</strong> {booking.notes || "—"}</div>
          </div>
        )}

        {booking && (
          <form
            onSubmit={savePayment}
            style={{
              display: "grid",
              gap: 10,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 14,
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {existingPayment ? "Update Payment" : "Create Payment"}
            </div>

            {existingPayment && (
              <div style={{ color: "#555" }}>
                Existing Payment No: {existingPayment.payment_no || "—"}
              </div>
            )}

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Amount"
              value={amount}
              readOnly={!isPlayArea}
              onChange={(e) => setAmount(e.target.value)}
            />

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="ONLINE">Online</option>
            </select>

            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <input
              placeholder="Transaction Reference (optional)"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
            />

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : existingPayment ? "Update Payment" : "Save Payment"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}