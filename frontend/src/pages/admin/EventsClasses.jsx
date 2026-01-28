import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

export default function AdminReservations() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      // expected later: GET /api/admin/reservations
      const res = await api.get("/api/admin/reservations");
      setRows(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load reservations (Unauthorized?)");
    }
  };

  useEffect(() => { load(); }, []);

  const cols = [
    { key: "id", header: "ID" },
    { key: "booking_type", header: "Type" },
    { key: "booking_date", header: "Date" },
    { key: "time_slot", header: "Time" },
    { key: "customer_name", header: "Customer" },
    { key: "status", header: "Status" },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <div className="badgeSoft">📅 Admin</div>
        <h1 style={{ margin: "8px 0 0" }}>Manage Reservation</h1>
        <div style={{ opacity: 0.75, fontWeight: 600 }}>View and manage all customer bookings.</div>
      </div>

      {err ? (
        <div className="kidCard" style={{ padding: 12, border: "1px solid #ffd6d6", background: "#fff0f0", color: "#b00020", fontWeight: 800 }}>
          {err}
        </div>
      ) : null}

      <div className="kidCard" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 900 }}>Reservations</div>
          <button className="kidBtnGhost" onClick={load}>Refresh</button>
        </div>

        <div style={{ marginTop: 12 }}>
          <SimpleTable columns={cols} rows={rows} />
        </div>
      </div>
    </div>
  );
}
