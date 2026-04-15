import { useEffect, useMemo, useState } from "react";
import {
  listBankTransferPaymentsApi,
  confirmBankTransferPaymentApi,
} from "../../api/receptionApi";

function isDataUrl(value) {
  return typeof value === "string" && value.startsWith("data:");
}

function getSlipKind(payment) {
  const data = String(payment?.bank_slip_data || "").toLowerCase();
  const name = String(payment?.bank_slip_name || "").toLowerCase();

  if (data.startsWith("data:application/pdf") || name.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    data.startsWith("data:image/") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  ) {
    return "image";
  }

  return "unknown";
}

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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayment, setPreviewPayment] = useState(null);

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

  const handlePreviewSlip = (payment) => {
    if (!payment?.bank_slip_data) {
      setErr("No bank slip found.");
      return;
    }

    setErr("");
    setInfo("");
    setPreviewPayment(payment);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewPayment(null);
  };

  const handleDownloadSlip = () => {
    if (!previewPayment?.bank_slip_data) return;

    const source = String(previewPayment.bank_slip_data).trim();
    const link = document.createElement("a");
    link.href = source;
    link.download = previewPayment.bank_slip_name || `bank-slip-${previewPayment.id || "file"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewKind = getSlipKind(previewPayment);
  const previewSrc = previewPayment?.bank_slip_data || "";

  return (
    <div className="instructorPage receptionPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Approve Bank Transfers</h2>
      </div>

      <div className="instructorContentCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Pending Bank Transfer Payments</h3>
            <p className="instructorSectionText"></p>
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
                  <button
                    type="button"
                    className="receptionSecondaryButton"
                    onClick={() => handlePreviewSlip(payment)}
                  >
                    View Uploaded Bank Slip
                  </button>

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

      {previewOpen && previewPayment ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
          onClick={handleClosePreview}
        >
          <div
            style={{
              width: "min(1100px, 100%)",
              maxHeight: "90vh",
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.22)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "18px 22px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
                  Bank Slip Preview
                </div>
                <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
                  {previewPayment.bank_slip_name || `Payment #${previewPayment.id}`}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="receptionSecondaryButton"
                  onClick={handleDownloadSlip}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="receptionSecondaryButton"
                  onClick={handleClosePreview}
                >
                  Close
                </button>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                overflow: "auto",
                background: "#f8fafc",
                minHeight: 300,
              }}
            >
              {previewKind === "pdf" ? (
                <iframe
                  title="Bank Slip PDF Preview"
                  src={previewSrc}
                  style={{
                    width: "100%",
                    height: "72vh",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    background: "#fff",
                  }}
                />
              ) : previewKind === "image" ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "72vh",
                  }}
                >
                  <img
                    src={previewSrc}
                    alt="Uploaded bank slip"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "72vh",
                      borderRadius: 14,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                    }}
                  />
                </div>
              ) : isDataUrl(previewSrc) ? (
                <iframe
                  title="Bank Slip Preview"
                  src={previewSrc}
                  style={{
                    width: "100%",
                    height: "72vh",
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    background: "#fff",
                  }}
                />
              ) : (
                <div style={{ padding: 20 }}>
                  <p style={{ color: "#374151", marginBottom: 14 }}>
                    Preview is not available for this file type.
                  </p>
                  <button
                    type="button"
                    className="receptionSecondaryButton"
                    onClick={handleDownloadSlip}
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}