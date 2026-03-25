import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  useElements,
  useStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import {
  createStripePaymentIntentApi,
  finalizeStripePaymentApi,
} from "../../api/parentApi";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const elementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#2b2b2b",
      fontFamily: "Arial, sans-serif",
      "::placeholder": {
        color: "#9ca3af",
      },
      iconColor: "#6b7280",
    },
    invalid: {
      color: "#dc2626",
      iconColor: "#dc2626",
    },
  },
};

function StripeField({ children }) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "48px",
        border: "1px solid #d1d5db",
        background: "#ffffff",
        borderRadius: "8px",
        padding: "14px 12px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div style={{ width: "100%" }}>{children}</div>
    </div>
  );
}

function CardPaymentForm({ clientSecret, amount, enrollmentId, bookingId }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [cardholderName, setCardholderName] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cardBrand, setCardBrand] = useState("");
  const [cardNumberPreview, setCardNumberPreview] = useState("•••• •••• •••• ••••");
  const [expiryPreview, setExpiryPreview] = useState("MM/YY");

  const paymentLabel = enrollmentId
    ? `Enrollment #${enrollmentId}`
    : bookingId
    ? `Booking #${bookingId}`
    : "Card Payment";

  const getBrandLabel = (brand) => {
    if (!brand || brand === "unknown") return "";
    if (brand === "visa") return "VISA";
    if (brand === "mastercard") return "MASTERCARD";
    if (brand === "amex") return "AMEX";
    if (brand === "discover") return "DISCOVER";
    return brand.toUpperCase();
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!stripe || !elements) {
      setErr("Stripe is not ready yet.");
      return;
    }

    const cardNumber = elements.getElement(CardNumberElement);

    if (!cardNumber) {
      setErr("Card field is not ready.");
      return;
    }

    setBusy(true);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: cardholderName || undefined,
          },
        },
      });

      if (result.error) {
        setErr(result.error.message || "Card payment failed");
        setBusy(false);
        return;
      }

      if (result.paymentIntent?.status !== "succeeded") {
        setErr(
          `Payment not completed. Current status: ${result.paymentIntent?.status || "unknown"}`
        );
        setBusy(false);
        return;
      }

      const res = await finalizeStripePaymentApi({
        payment_intent_id: result.paymentIntent.id,
        notes: notes || null,
      });

      const pay = res.data?.payment;
      setInfo(`Payment successful. Receipt: ${pay?.payment_no || ""}`);

      setTimeout(() => {
        navigate("/profile");
      }, 1200);
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.message || "Card payment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid #ececec",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              fontWeight: "800",
              color: "#365c55",
            }}
          >
            Poddo Playhouse
          </div>

          <Link
            to="/profile"
            style={{
              textDecoration: "none",
              color: "#365c55",
              fontWeight: "600",
            }}
          >
            Back
          </Link>
        </div>

        <div style={{ padding: "28px 32px" }}>
          <div
            style={{
              marginBottom: "24px",
              color: "#8a8f98",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Account / Payment Methods /{" "}
            <span style={{ color: "#2f3b36" }}>Card Payment</span>
          </div>

          <div
            className="payment-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 0.9fr",
              gap: "32px",
            }}
          >
            <form onSubmit={submit}>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "20px",
                  background: "#fff",
                }}
              >
                <h2
                  style={{
                    margin: "0 0 24px",
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  Your Payment Details
                </h2>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Card Number
                  </label>

                  <div
                    style={{
                      width: "100%",
                      minHeight: "48px",
                      border: "1px solid #d1d5db",
                      background: "#ffffff",
                      borderRadius: "8px",
                      padding: "0 12px",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, padding: "14px 0" }}>
                      <CardNumberElement
                        options={elementOptions}
                        onChange={(e) => {
                          setCardBrand(
                            e.brand && e.brand !== "unknown" ? e.brand : ""
                          );
                          setCardNumberPreview(
                            e.empty || !e.value
                              ? "•••• •••• •••• ••••"
                              : e.value
                          );
                        }}
                      />
                    </div>

                    <div
                      style={{
                        minWidth: "92px",
                        textAlign: "right",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getBrandLabel(cardBrand)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Expiry Date
                    </label>
                    <StripeField>
                      <CardExpiryElement
                        options={elementOptions}
                        onChange={(e) => {
                          setExpiryPreview(
                            e.empty || !e.value ? "MM/YY" : e.value
                          );
                        }}
                      />
                    </StripeField>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      CVV
                    </label>
                    <StripeField>
                      <CardCvcElement options={elementOptions} />
                    </StripeField>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Enter cardholder name"
                    style={{
                      width: "100%",
                      height: "48px",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "0 12px",
                      fontSize: "15px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginBottom: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Payment For
                    </label>
                    <input
                      value={paymentLabel}
                      readOnly
                      style={{
                        width: "100%",
                        height: "48px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "0 12px",
                        fontSize: "15px",
                        boxSizing: "border-box",
                        background: "#f9fafb",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#374151",
                      }}
                    >
                      Amount
                    </label>
                    <input
                      value={`LKR ${Number(amount || 0).toFixed(2)}`}
                      readOnly
                      style={{
                        width: "100%",
                        height: "48px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "0 12px",
                        fontSize: "15px",
                        boxSizing: "border-box",
                        background: "#f9fafb",
                        fontWeight: "700",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any note if needed"
                    rows={4}
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "12px",
                      fontSize: "15px",
                      boxSizing: "border-box",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>

                {err ? (
                  <div
                    style={{
                      marginBottom: "14px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontWeight: "600",
                    }}
                  >
                    {err}
                  </div>
                ) : null}

                {info ? (
                  <div
                    style={{
                      marginBottom: "14px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontWeight: "600",
                    }}
                  >
                    {info}
                  </div>
                ) : null}

                <button
                  disabled={busy || !stripe}
                  type="submit"
                  style={{
                    width: "100%",
                    height: "50px",
                    border: "none",
                    borderRadius: "10px",
                    background: "linear-gradient(90deg, #5b3df5, #7c3aed)",
                    color: "#fff",
                    fontSize: "16px",
                    fontWeight: "700",
                    cursor: busy || !stripe ? "not-allowed" : "pointer",
                    opacity: busy || !stripe ? 0.7 : 1,
                  }}
                >
                  {busy ? "Processing..." : "Submit"}
                </button>
              </div>
            </form>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "20px",
                background: "#fff",
                height: "fit-content",
              }}
            >
              <h2
                style={{
                  margin: "0 0 20px",
                  fontSize: "22px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Payment Summary
              </h2>

              <div
                style={{
                  background:
                    "linear-gradient(135deg, #111827, #7c3aed, #ec4899)",
                  color: "#fff",
                  borderRadius: "14px",
                  padding: "20px",
                  marginBottom: "20px",
                  minHeight: "170px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: "13px", opacity: 0.85 }}>
                    Poddo Playhouse
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "700" }}>
                    {getBrandLabel(cardBrand) || "CARD"}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "22px",
                    letterSpacing: "2px",
                    fontWeight: "700",
                  }}
                >
                  {cardNumberPreview}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "end",
                    gap: "16px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      Cardholder
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "600" }}>
                      {cardholderName || "Your Name"}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      Expires
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "700" }}>
                      {expiryPreview}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: "12px", opacity: 0.8 }}>
                      Amount
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: "700" }}>
                      LKR {Number(amount || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px", fontSize: "15px" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Payment Type</span>
                  <span style={{ fontWeight: "600" }}>Card / Stripe</span>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Card Brand</span>
                  <span style={{ fontWeight: "600" }}>
                    {getBrandLabel(cardBrand) || "-"}
                  </span>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Reference</span>
                  <span style={{ fontWeight: "600" }}>{paymentLabel}</span>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Subtotal</span>
                  <span>LKR {Number(amount || 0).toFixed(2)}</span>
                </div>

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#6b7280" }}>Service Fee</span>
                  <span>LKR 0.00</span>
                </div>

                <hr
                  style={{
                    border: "none",
                    borderTop: "1px solid #e5e7eb",
                    margin: "6px 0",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "#111827",
                  }}
                >
                  <span>Total</span>
                  <span>LKR {Number(amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .payment-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function PaymentCard() {
  const [searchParams] = useSearchParams();

  const enrollmentId = useMemo(() => {
    const v = searchParams.get("enrollmentId");
    return v ? Number(v) : null;
  }, [searchParams]);

  const bookingId = useMemo(() => {
    const v = searchParams.get("bookingId");
    return v ? Number(v) : null;
  }, [searchParams]);

  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setErr("");
      setLoading(true);

      try {
        if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
          throw new Error(
            "VITE_STRIPE_PUBLISHABLE_KEY is missing in frontend .env"
          );
        }

        if (!enrollmentId && !bookingId) {
          throw new Error("Missing enrollmentId or bookingId");
        }

        const res = await createStripePaymentIntentApi({
          enrollment_id: enrollmentId || null,
          booking_id: bookingId || null,
        });

        setClientSecret(res.data?.clientSecret || "");
        setAmount(Number(res.data?.amount || 0));
      } catch (e) {
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to start card payment"
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [enrollmentId, bookingId]);

  if (loading) {
    return (
      <div
        style={{ minHeight: "100vh", background: "#f5f5f5", padding: "40px 16px" }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            background: "#fff",
            borderRadius: "16px",
            padding: "28px 32px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
          }}
        >
          Loading card payment...
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div
        style={{ minHeight: "100vh", background: "#f5f5f5", padding: "40px 16px" }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            background: "#fff",
            borderRadius: "16px",
            padding: "28px 32px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Card Payment</h2>
          <div style={{ color: "#b91c1c", fontWeight: "700" }}>{err}</div>
          <div style={{ marginTop: "12px" }}>
            <Link to="/profile">Back</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <CardPaymentForm
        clientSecret={clientSecret}
        amount={amount}
        enrollmentId={enrollmentId}
        bookingId={bookingId}
      />
    </Elements>
  );
}