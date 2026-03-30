import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import {
  createPaymentApi,
  createStripePaymentIntentApi,
  finalizeStripePaymentApi,
} from "../../api/parentApi";

export default function PayNow() {
  const { enrollmentId, bookingId: bookingIdParam } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [method, setMethod] = useState("CARD");
  const [reference_no, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [bankSlipFile, setBankSlipFile] = useState(null);
  const [bankSlipData, setBankSlipData] = useState("");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const enrollment_id = useMemo(() => (enrollmentId ? Number(enrollmentId) : null), [enrollmentId]);
  const booking_id = useMemo(() => (bookingIdParam ? Number(bookingIdParam) : null), [bookingIdParam]);
  const paymentTargetLabel = booking_id ? "Booking" : "Enrollment";
  const paymentTargetId = booking_id || enrollment_id;

  useEffect(() => {
    const methodFromQuery = searchParams.get("method");
    if (["CARD", "CASH", "BANK_TRANSFER"].includes(methodFromQuery)) {
      setMethod(methodFromQuery);
    }
  }, [searchParams]);

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleSlipChange = async (e) => {
    const file = e.target.files?.[0] || null;
    setBankSlipFile(file);
    setBankSlipData("");
    setErr("");
    setInfo("");

    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

    if (!allowed.includes(file.type)) {
      setErr("Please upload JPG, PNG, or PDF bank slip.");
      e.target.value = "";
      setBankSlipFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErr("Bank slip must be 5MB or smaller.");
      e.target.value = "";
      setBankSlipFile(null);
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      setBankSlipData(base64);
    } catch {
      setErr("Failed to read bank slip file.");
      setBankSlipFile(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!paymentTargetId) {
      return setErr("Invalid payment target.");
    }

    if (method === "CARD") {
      try {
        setBusy(true);

        const payload = {
          enrollment_id: enrollment_id || null,
          booking_id: booking_id || null,
        };

        const res = await createStripePaymentIntentApi(payload);
        const clientSecret = res?.data?.clientSecret;

        if (!clientSecret) {
          throw new Error("Missing Stripe client secret");
        }

        const finalizeRes = await finalizeStripePaymentApi({
          enrollment_id: enrollment_id || null,
          booking_id: booking_id || null,
          payment_intent_id: res?.data?.paymentIntentId || null,
        });

        if (finalizeRes?.data) {
          setInfo("✅ Card payment completed successfully.");
          setTimeout(() => navigate("/profile"), 1000);
        }
      } catch (e2) {
        setErr(e2?.response?.data?.message || e2?.message || "Card payment failed");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (method === "BANK_TRANSFER") {
      if (!reference_no.trim()) {
        return setErr("Reference number is required for bank transfer.");
      }

      if (!bankSlipFile || !bankSlipData) {
        return setErr("Please upload the bank slip.");
      }
    }

    setBusy(true);
    try {
      const res = await createPaymentApi({
        enrollment_id: enrollment_id || null,
        booking_id: booking_id || null,
        amount: amount || null,
        payment_method: method,
        reference_no: method === "BANK_TRANSFER" ? reference_no.trim() : null,
        notes: notes || null,
        bank_slip_name: method === "BANK_TRANSFER" ? bankSlipFile?.name || null : null,
        bank_slip_data: method === "BANK_TRANSFER" ? bankSlipData : null,
      });

      const pay = res.data?.payment;

      if (method === "BANK_TRANSFER") {
        setInfo(
          `✅ Bank transfer submitted. Status is PENDING until receptionist approval. Receipt: ${
            pay?.payment_no || ""
          }`
        );
      } else {
        setInfo(`✅ Payment submitted successfully. Receipt: ${pay?.payment_no || ""}`);
      }

      setTimeout(() => navigate("/profile"), 1000);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="kidCard" style={{ padding: 16, maxWidth: 650 }}>
        <div
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
        >
          <div>
            <div className="badgeSoft">💳 Pay Now</div>
            <h1 style={{ margin: "10px 0 0", fontSize: 26 }}>Complete Payment</h1>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              {paymentTargetLabel} ID: <b>#{paymentTargetId}</b>
            </div>
          </div>
          <Link className="kidBtnGhost" to="/profile">
            Back
          </Link>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <label style={{ fontWeight: 900 }}>Payment Method</label>
          <select className="kidInput" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="CARD">Card</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>

          <label style={{ fontWeight: 900 }}>Amount</label>
          <input
            className="kidInput"
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          {method === "BANK_TRANSFER" && (
            <>
              <label style={{ fontWeight: 900 }}>Bank Reference No</label>
              <input
                className="kidInput"
                placeholder="e.g. BOC-TRX-12345"
                value={reference_no}
                onChange={(e) => setReference(e.target.value)}
              />

              <label style={{ fontWeight: 900 }}>Upload Bank Slip</label>
              <input
                className="kidInput"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleSlipChange}
              />

              {bankSlipFile ? (
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  Selected file: <b>{bankSlipFile.name}</b>
                </div>
              ) : null}
            </>
          )}

          <label style={{ fontWeight: 900 }}>Notes (optional)</label>
          <textarea
            className="kidInput"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any details to help our team"
          />

          {err ? <div style={{ color: "#b00020", fontWeight: 800 }}>{err}</div> : null}
          {info ? <div style={{ color: "#0a6b2b", fontWeight: 800 }}>{info}</div> : null}

          <button disabled={busy} className="kidBtn" type="submit">
            {busy ? "Processing..." : method === "CARD" ? "Continue to Card Payment" : "Pay Now"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}