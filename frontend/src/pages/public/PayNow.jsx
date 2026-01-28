import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Link } from "react-router-dom";
import { createPaymentApi } from "../../api/parentApi";

export default function PayNow() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();

  const [method, setMethod] = useState("CARD");
  const [reference_no, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const enrollment_id = useMemo(() => Number(enrollmentId), [enrollmentId]);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!enrollment_id) return setErr("Invalid enrollment id");

    if (method === "BANK_TRANSFER" && !reference_no.trim()) {
      return setErr("Reference number is required for bank transfer.");
    }

    setBusy(true);
    try {
      const res = await createPaymentApi({
        enrollment_id,
        payment_method: method,
        reference_no: method === "BANK_TRANSFER" ? reference_no.trim() : null,
        notes: notes || null,
      });

      const pay = res.data?.payment;

      if (method === "CARD") {
        setInfo(`✅ Card payment successful. Receipt: ${pay?.payment_no || ""}`);
      } else {
        setInfo(`✅ Payment submitted as PENDING. Receipt: ${pay?.payment_no || ""}`);
      }

      setTimeout(() => navigate("/profile"), 900);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="kidCard" style={{ padding: 16, maxWidth: 650 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div className="badgeSoft">💳 Pay Now</div>
            <h1 style={{ margin: "10px 0 0", fontSize: 26 }}>Complete Payment</h1>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              Enrollment ID: <b>#{enrollment_id}</b>
            </div>
          </div>
          <Link className="kidBtnGhost" to="/profile">Back</Link>
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <label style={{ fontWeight: 900 }}>Payment Method</label>
          <select className="kidInput" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="CARD">Card</option>
            <option value="CASH">Cash (pay at counter)</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>

          {method === "BANK_TRANSFER" ? (
            <>
              <label style={{ fontWeight: 900 }}>Bank Reference No</label>
              <input
                className="kidInput"
                placeholder="e.g. BOC-TRX-12345"
                value={reference_no}
                onChange={(e) => setReference(e.target.value)}
              />
            </>
          ) : null}

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
            {busy ? "Processing..." : "Pay Now"}
          </button>

          <div style={{ opacity: 0.7, fontSize: 13 }}>
            Card payments are marked <b>PAID</b> instantly. Cash/Bank Transfer are <b>PENDING</b> until confirmed by admin.
          </div>
        </form>
      </div>
    </motion.div>
  );
}
