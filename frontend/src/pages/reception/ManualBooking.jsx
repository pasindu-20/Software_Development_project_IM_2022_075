import { useState } from "react";
import { createManualBookingApi } from "../../api/receptionApi";

export default function RecManualBooking() {
  const [customer_name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [booking_type, setType] = useState("PLAY_AREA");
  const [booking_date, setDate] = useState("");
  const [note, setNote] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!customer_name || !phone || !booking_date) {
      return setErr("Customer name, phone, and booking date are required.");
    }

    setBusy(true);
    try {
      await createManualBookingApi({ customer_name, phone, booking_type, booking_date, note });
      setInfo("Manual booking created successfully.");
      setName("");
      setPhone("");
      setType("PLAY_AREA");
      setDate("");
      setNote("");
    } catch {
      setErr("API not ready: POST /api/reception/bookings/manual");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Add Manual Booking</h2>

      <form onSubmit={submit} style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 10, maxWidth: 620 }}>
        <input placeholder="Customer name" value={customer_name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <select value={booking_type} onChange={(e) => setType(e.target.value)}>
          <option value="PLAY_AREA">Play Area</option>
          <option value="PARTY">Party</option>
          <option value="EVENT">Event</option>
          <option value="CLASS">Class</option>
        </select>

        <input type="date" value={booking_date} onChange={(e) => setDate(e.target.value)} />

        <textarea rows={4} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {info && <div style={{ color: "green" }}>{info}</div>}

        <button disabled={busy} type="submit">
          {busy ? "Saving…" : "Create Booking"}
        </button>
      </form>
    </div>
  );
}
