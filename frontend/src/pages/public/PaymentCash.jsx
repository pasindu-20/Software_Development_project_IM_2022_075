import { Link } from "react-router-dom";

export default function PaymentCash() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 18 }}>
        <h2 style={{ margin: 0 }}>Cash Payment</h2>
        <div style={{ color: "#666", marginTop: 8 }}>
          Pay cash at the counter. Receptionist will record your payment in the system.
        </div>

        <div style={{ marginTop: 14 }}>
          <Link to="/contact"><button>Contact Reception</button></Link>
        </div>
      </div>
    </div>
  );
}
