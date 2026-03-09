import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

export default function AdminInquiries() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const res = await api.get("/api/inquiry");
      const data = Array.isArray(res.data?.inquiries)
        ? res.data.inquiries
        : Array.isArray(res.data)
        ? res.data
        : [];
      setRows(data);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load inquiries (Unauthorized?)");
    }
  };

  useEffect(() => { load(); }, []);

  const cols = [
    { key: "id", header: "ID" },
    { key: "customer_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "inquiry_type", header: "Type" },
    { key: "message", header: "Message" },
    { key: "status", header: "Status" },
    { key: "created_at", header: "Created", render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "-") },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <div className="badgeSoft">📩 Admin</div>
        <h1 style={{ margin: "8px 0 0" }}>Customer Inquiry</h1>
        <div style={{ opacity: 0.75, fontWeight: 600 }}>View all customer inquiries from the website.</div>
      </div>

      {err ? (
        <div className="kidCard" style={{ padding: 12, border: "1px solid #ffd6d6", background: "#fff0f0", color: "#b00020", fontWeight: 800 }}>
          {err}
        </div>
      ) : null}

      <div className="kidCard" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900 }}>Inquiries</div>
          <button className="kidBtnGhost" onClick={load}>Refresh</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <SimpleTable columns={cols} rows={rows} />
        </div>
      </div>
    </div>
  );
}