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
    <div className="instructorPage receptionPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Approve Bank Transfers</h2>
      </div>

      <div className="instructorContentCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Pending Bank Transfer Payments</h3>
            <p className="instructorSectionText">
             
            </p>
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
            placeholder="Payment no, customer, child, class, phone, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="receptionButtonRow">
          <button className="receptionSecondaryButton" type="button" onClick={loadPayments}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}
        {info ? <div className="instructorSuccess">{info}</div> : null}

        {!loading && filtered.length === 0 ? (
          <div className="receptionEmptyState">No pending bank transfer payments found.</div>
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
                <div className="receptionDetailItem"><strong>Booking ID:</strong> {payment.booking_id || "—"}</div>
                <div className="receptionDetailItem"><strong>Enrollment ID:</strong> {payment.enrollment_id || "—"}</div>
                <div className="receptionDetailItem"><strong>Child:</strong> {payment.child_name || "—"}</div>
                <div className="receptionDetailItem"><strong>Class:</strong> {payment.class_title || "—"}</div>
                <div className="receptionDetailItem"><strong>Reference No:</strong> {payment.reference_no || "—"}</div>
                <div className="receptionDetailItem"><strong>Created At:</strong> {payment.created_at ? new Date(payment.created_at).toLocaleString() : "—"}</div>
              </div>

              {payment.bank_slip_data ? (
                <div className="receptionLinkRow">
                  <a href={payment.bank_slip_data} target="_blank" rel="noreferrer">
                    View Uploaded Bank Slip
                  </a>
                  {payment.bank_slip_name ? (
                    <span className="instructorMuted">File: {payment.bank_slip_name}</span>
                  ) : null}
                </div>
              ) : (
                <div className="instructorError">No bank slip found.</div>
              )}

              <label className="instructorField">
                <span className="instructorFieldLabel">Approval Note</span>
                <textarea
                  className="receptionTextarea"
                  rows={3}
                  placeholder="Add a note"
                  value={noteById[payment.id] || ""}
                  onChange={(e) =>
                    setNoteById((prev) => ({ ...prev, [payment.id]: e.target.value }))
                  }
                />
              </label>

              <div className="receptionButtonRow">
                <button
                  className="instructorButton"
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