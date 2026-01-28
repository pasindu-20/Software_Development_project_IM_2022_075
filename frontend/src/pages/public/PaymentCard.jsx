import { Link } from "react-router-dom";

export default function PaymentCard() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 18 }}>
        <h2 style={{ margin: 0 }}>Card Payment</h2>
        <div style={{ color: "#666", marginTop: 8 }}>
          This screen is ready. We will connect it to the backend payment API next.
        </div>

        <div style={{ marginTop: 14 }}>
          <Link to="/contact"><button>Need help?</button></Link>
        </div>
      </div>
    </div>
  );
}
