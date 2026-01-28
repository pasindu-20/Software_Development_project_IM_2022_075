import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createBookingApi } from "../../api/parentApi";

export default function CreateBooking() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    booking_type: "PLAY_AREA",
    booking_date: "",
    time_slot: "",
    notes: "",
  });

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!form.booking_date || !form.time_slot) {
      return setErr("Please select date and time slot.");
    }

    setBusy(true);
    try {
      await createBookingApi(form);
      setInfo("✅ Booking created! Our team will confirm soon.");
      setTimeout(() => navigate("/profile"), 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create booking");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="kidCard" style={{ padding: 16, maxWidth: 640 }}>
        <div className="badgeSoft">📅 Create Booking</div>
        <h1 style={{ margin: "10px 0 0", fontSize: 26 }}>Book a Visit</h1>
        <div style={{ opacity: 0.7, marginTop: 6 }}>
          Choose a date and time. We’ll confirm availability.
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <label style={{ fontWeight: 800 }}>Booking Type</label>
          <select
            className="kidInput"
            value={form.booking_type}
            onChange={(e) => set("booking_type", e.target.value)}
          >
            <option value="PLAY_AREA">Play Area</option>
            <option value="PARTY">Party</option>
            <option value="CLASS_TRIAL">Class Trial</option>
            <option value="OTHER">Other</option>
          </select>

          <label style={{ fontWeight: 800 }}>Date</label>
          <input
            className="kidInput"
            type="date"
            value={form.booking_date}
            onChange={(e) => set("booking_date", e.target.value)}
          />

          <label style={{ fontWeight: 800 }}>Time Slot</label>
          <input
            className="kidInput"
            placeholder="e.g. 10:00 AM - 12:00 PM"
            value={form.time_slot}
            onChange={(e) => set("time_slot", e.target.value)}
          />

          <label style={{ fontWeight: 800 }}>Notes (optional)</label>
          <textarea
            className="kidInput"
            rows={3}
            placeholder="Any special requests?"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />

          {err ? <div style={{ color: "#b00020", fontWeight: 800 }}>{err}</div> : null}
          {info ? <div style={{ color: "#0a6b2b", fontWeight: 800 }}>{info}</div> : null}

          <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
            <button type="button" className="kidBtnGhost" onClick={() => navigate("/profile")}>
              Back
            </button>
            <button disabled={busy} className="kidBtn" type="submit">
              {busy ? "Creating..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
