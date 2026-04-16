import { Link } from "react-router-dom";

export default function PaymentBankTransfer() {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div
        style={{
          background: "white",
          border: "1px solid #eee",
          borderRadius: 14,
          padding: 18,
        }}
      >
        <h2 style={{ margin: 0 }}>Bank Transfer</h2>

        <div style={{ color: "#666", marginTop: 8, lineHeight: 1.6 }}>
          Transfer to our account and share the reference number. Admin/Receptionist
          will verify and update payment status.
        </div>

        <div
          style={{
            marginTop: 16,
            background: "#fff8e2",
            border: "1px solid #f5df9a",
            borderRadius: 12,
            padding: 16,
            display: "grid",
            gap: 10,
          }}
        >
          <div>
            <strong>Account Name:</strong> Poddo Playhouse
          </div>
          <div>
            <strong>Account Number:</strong> 0880456789
          </div>
          <div>
            <strong>Bank:</strong> Commercial Bank
          </div>
          <div>
            <strong>Branch:</strong> Nawala Branch
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <Link to="/contact">
            <button>Send inquiry</button>
          </Link>
        </div>
      </div>
    </div>
  );
}