import { Link } from "react-router-dom";

export default function PaymentBankTransfer() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ background: "white", border: "1px solid #eee", borderRadius: 14, padding: 18 }}>
        <h2 style={{ margin: 0 }}>Bank Transfer</h2>
        <div style={{ color: "#666", marginTop: 8 }}>
          Transfer to our account and share the reference number. Admin/Receptionist will verify and update payment status.
        </div>

        <div style={{ marginTop: 14 }}>
          <Link to="/contact"><button>Send inquiry</button></Link>
        </div>
      </div>
    </div>
  );
}
