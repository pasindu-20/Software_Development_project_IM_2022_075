import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams, Link } from "react-router-dom";
import { createPaymentApi } from "../../api/parentApi";

const METHOD_OPTIONS = [
  {
    key: "CARD",
    title: "Card Payment",
    desc: "Pay securely online using your card.",
  },
  {
    key: "CASH",
    title: "Cash Payment",
    desc: "Pay physically at the reception counter.",
  },
  {
    key: "BANK_TRANSFER",
    title: "Bank Transfer",
    desc: "Upload your bank slip for receptionist approval.",
  },
];

const BUSINESS_BANK_DETAILS = {
  accountName: "Poddo Playhouse",
  accountNumber: "0880456789",
  bankName: "Commercial Bank",
  branchName: "Nawala Branch",
};

export default function PayNow() {
  const { enrollmentId } = useParams();
  const navigate = useNavigate();

  const [method, setMethod] = useState("CARD");
  const [reference_no, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [bankSlipFile, setBankSlipFile] = useState(null);
  const [bankSlipData, setBankSlipData] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const enrollment_id = useMemo(() => Number(enrollmentId), [enrollmentId]);

  const selectedMethod = useMemo(
    () => METHOD_OPTIONS.find((item) => item.key === method),
    [method]
  );

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

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

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

    if (!enrollment_id) {
      setErr("Invalid enrollment id");
      return;
    }

    if (method === "CARD") {
      navigate(`/pay/card?enrollmentId=${enrollment_id}`);
      return;
    }

    if (method === "BANK_TRANSFER") {
      if (!reference_no.trim()) {
        setErr("Reference number is required for bank transfer.");
        return;
      }

      if (!bankSlipFile || !bankSlipData) {
        setErr("Please upload the bank slip.");
        return;
      }
    }

    setBusy(true);
    try {
      const res = await createPaymentApi({
        enrollment_id,
        payment_method: method,
        reference_no: method === "BANK_TRANSFER" ? reference_no.trim() : null,
        notes: notes || null,
        bank_slip_name:
          method === "BANK_TRANSFER" ? bankSlipFile?.name || null : null,
        bank_slip_data: method === "BANK_TRANSFER" ? bankSlipData : null,
      });

      const pay = res.data?.payment;

      if (method === "BANK_TRANSFER") {
        setInfo(
          `Bank transfer submitted. Status is PENDING until receptionist approval. Invoice: ${
            pay?.payment_no || ""
          }`
        );
      } else {
        setInfo(
          `Payment submitted as PENDING. Invoice: ${pay?.payment_no || ""}`
        );
      }

      setTimeout(() => navigate("/profile"), 1200);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="payNowModernPage"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="payNowModernHero">
        <div className="payNowModernHeroText">
          <div className="payNowModernBadge"> Pay Now</div>
          <h1 className="payNowModernTitle">Complete Payment</h1>
          <p className="payNowModernSubtitle">
            Choose your payment method and complete the enrollment payment in a
            simple and clear way.
          </p>

          <div className="payNowModernMetaRow">
            <div className="payNowModernMetaCard">
              <span className="payNowModernMetaLabel">Enrollment ID</span>
              <strong>#{enrollment_id}</strong>
            </div>

            <div className="payNowModernMetaCard">
              <span className="payNowModernMetaLabel">Selected Method</span>
              <strong>{selectedMethod?.title || "Payment"}</strong>
            </div>
          </div>
        </div>

        <Link className="payNowModernBackBtn" to="/profile">
          ← Back
        </Link>
      </div>

      {err ? <div className="payNowModernAlert error">{err}</div> : null}
      {info ? <div className="payNowModernAlert success">{info}</div> : null}

      <div className="payNowModernGrid">
        <section className="payNowModernCard">
          <h2 className="payNowModernCardTitle">Choose Payment Method</h2>
          <p className="payNowModernCardText">
            Select the payment option that works best for you.
          </p>

          <form onSubmit={submit} className="payNowModernForm">
            <div>
              <label className="payNowModernLabel">Payment Method</label>

              <div className="payNowMethodGrid">
                {METHOD_OPTIONS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMethod(item.key)}
                    className={`payNowMethodCard ${
                      method === item.key ? "active" : ""
                    }`}
                  >
                    <div className="payNowMethodIcon">{item.icon}</div>
                    <div className="payNowMethodContent">
                      <div className="payNowMethodTitle">{item.title}</div>
                      <div className="payNowMethodDesc">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {method === "BANK_TRANSFER" ? (
              <div className="payNowModernBankBox">
                <div
                  style={{
                    padding: "16px",
                    borderRadius: "16px",
                    background: "rgba(255,255,255,0.96)",
                    border: "1px solid rgba(31,41,55,0.08)",
                    display: "grid",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: "#1f2937",
                    }}
                  >
                    Bank Transfer Details
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gap: "4px",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: "rgba(248,250,252,0.95)",
                        border: "1px solid rgba(31,41,55,0.06)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                        }}
                      >
                        Account Name
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#1f2937",
                          lineHeight: 1.5,
                        }}
                      >
                        {BUSINESS_BANK_DETAILS.accountName}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "4px",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: "rgba(248,250,252,0.95)",
                        border: "1px solid rgba(31,41,55,0.06)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                        }}
                      >
                        Account Number
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#1f2937",
                          lineHeight: 1.5,
                        }}
                      >
                        {BUSINESS_BANK_DETAILS.accountNumber}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "4px",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: "rgba(248,250,252,0.95)",
                        border: "1px solid rgba(31,41,55,0.06)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                        }}
                      >
                        Bank
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#1f2937",
                          lineHeight: 1.5,
                        }}
                      >
                        {BUSINESS_BANK_DETAILS.bankName}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "4px",
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: "rgba(248,250,252,0.95)",
                        border: "1px solid rgba(31,41,55,0.06)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#6b7280",
                        }}
                      >
                        Branch
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#1f2937",
                          lineHeight: 1.5,
                        }}
                      >
                        {BUSINESS_BANK_DETAILS.branchName}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="payNowModernLabel">Bank Reference No</label>
                  <input
                    className="payNowModernInput"
                    placeholder="Enter bank transfer reference number"
                    value={reference_no}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>

                <div>
                  <label className="payNowModernLabel">Upload Bank Slip</label>

                  <label className="payNowUploadBox">
                    <input
                      className="payNowHiddenFileInput"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleSlipChange}
                    />
                    <span className="payNowUploadIcon">📎</span>
                    <span className="payNowUploadText">
                      {bankSlipFile
                        ? bankSlipFile.name
                        : "Click to upload JPG, PNG, or PDF"}
                    </span>
                  </label>

                  <div className="payNowUploadHint">
                    Maximum file size: 5MB
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <label className="payNowModernLabel">Notes (optional)</label>
              <textarea
                className="payNowModernTextarea"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any details to help our team"
              />
            </div>

            <button disabled={busy} className="payNowModernPrimaryBtn" type="submit">
              {method === "CARD"
                ? "Continue to Card Payment"
                : busy
                ? "Processing..."
                : "Pay Now"}
            </button>
          </form>
        </section>

        <aside className="payNowModernCard payNowModernSideCard">
          <h2 className="payNowModernCardTitle">Payment Guide</h2>
          <p className="payNowModernCardText">
            Here is what happens after you continue with your selected method.
          </p>

          <div className="payNowInfoList">
            <div className="payNowInfoItem">
              <div className="payNowInfoDot">1</div>
              <div>
                <strong>Card Payment</strong>
                <p>
                  You will be redirected to the Stripe payment flow. The payment
                  becomes <b>PAID</b> only after successful confirmation.
                </p>
              </div>
            </div>

            <div className="payNowInfoItem">
              <div className="payNowInfoDot">2</div>
              <div>
                <strong>Cash Payment</strong>
                <p>
                  The payment remains <b>PENDING</b> until it is confirmed by the
                  reception team.
                </p>
              </div>
            </div>

            <div className="payNowInfoItem">
              <div className="payNowInfoDot">3</div>
              <div>
                <strong>Bank Transfer</strong>
                <p>
                  Upload your bank slip and reference number. The payment remains{" "}
                  <b>PENDING</b> until receptionist approval.
                </p>
              </div>
            </div>
          </div>

          <div className="payNowSelectedBox">
            <span className="payNowSelectedLabel">Currently selected</span>
            <strong>{selectedMethod?.title || "Payment"}</strong>
            <p>{selectedMethod?.desc || ""}</p>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}