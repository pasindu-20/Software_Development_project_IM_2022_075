import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createBookingApi } from "../../api/parentApi";

export default function CreateBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingTypeFromUrl = searchParams.get("booking_type") || "PLAY_AREA";
  const packageNameFromUrl = searchParams.get("package") || "";
  const packagePriceFromUrl = searchParams.get("price") || "";

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [form, setForm] = useState({
    booking_type: bookingTypeFromUrl,
    booking_date: "",
    time_slot: "",
    notes: "",
  });

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARD");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (bookingTypeFromUrl === "PARTY") {
      let notes = "Party package booking";
      if (packageNameFromUrl) notes += ` - ${packageNameFromUrl}`;
      if (packagePriceFromUrl) notes += ` (LKR ${packagePriceFromUrl})`;

      setForm((prev) => ({
        ...prev,
        booking_type: "PARTY",
        notes,
      }));
    }
  }, [bookingTypeFromUrl, packageNameFromUrl, packagePriceFromUrl]);

  useEffect(() => {
    if (startTime && endTime) {
      setForm((prev) => ({
        ...prev,
        time_slot: `${formatTo12Hour(startTime)} - ${formatTo12Hour(endTime)}`,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        time_slot: "",
      }));
    }
  }, [startTime, endTime]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  function formatTo12Hour(time24) {
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    if (hour === 0) hour = 12;

    return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
  }

  function isEndAfterStart(start, end) {
    if (!start || !end) return false;
    return end > start;
  }

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!form.booking_date) {
      return setErr("Please select a booking date.");
    }

    if (form.booking_date < todayStr) {
      return setErr("Past dates cannot be selected.");
    }

    if (!startTime || !endTime) {
      return setErr("Please select both start time and end time.");
    }

    if (!isEndAfterStart(startTime, endTime)) {
      return setErr("End time must be later than start time.");
    }

    setBusy(true);
    try {
      const res = await createBookingApi(form);
      const bookingId = res?.data?.bookingId || res?.data?.id || res?.data?.booking?.id;

      if (form.booking_type === "PLAY_AREA" && bookingId) {
        if (paymentMethod === "CARD") {
          navigate(`/pay/card?bookingId=${bookingId}`);
          return;
        }

        navigate(`/profile/pay-booking/${bookingId}?method=${paymentMethod}`);
        return;
      }

      setInfo("✅ Booking created! Our team will confirm soon.");
      setTimeout(() => navigate("/profile"), 700);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create booking");
    } finally {
      setBusy(false);
    }
  };

  const isPartyBooking = form.booking_type === "PARTY";
  const isPlayAreaBooking = form.booking_type === "PLAY_AREA";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="kidCard" style={{ padding: 16, maxWidth: 700 }}>
        <div className="badgeSoft">📅 Create Booking</div>

        <h1 style={{ margin: "10px 0 0", fontSize: 26 }}>
          {isPartyBooking ? "Book a Party Package" : "Create Booking"}
        </h1>

        <div style={{ opacity: 0.7, marginTop: 6 }}>
          {isPartyBooking
            ? "Choose your party date and time. Our team will confirm availability."
            : "Choose your booking date and time. Our team will confirm availability."}
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <label style={{ fontWeight: 800 }}>Booking Type</label>
          <input className="kidInput" value={form.booking_type} readOnly />

          <label style={{ fontWeight: 800 }}>Booking Date</label>
          <input
            className="kidInput"
            type="date"
            min={todayStr}
            value={form.booking_date}
            onChange={(e) => set("booking_date", e.target.value)}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 800, display: "block", marginBottom: 6 }}>
                Start Time
              </label>
              <input
                className="kidInput"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontWeight: 800, display: "block", marginBottom: 6 }}>
                End Time
              </label>
              <input
                className="kidInput"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <label style={{ fontWeight: 800 }}>Selected Time Slot</label>
          <input
            className="kidInput"
            value={form.time_slot}
            readOnly
            placeholder="Time slot will be generated automatically"
          />

          {isPlayAreaBooking && (
            <>
              <label style={{ fontWeight: 800 }}>Payment Method</label>
              <select
                className="kidInput"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </>
          )}

          <label style={{ fontWeight: 800 }}>Notes</label>
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
            <button
              type="button"
              className="kidBtnGhost"
              onClick={() => navigate("/profile")}
            >
              Back
            </button>

            <button disabled={busy} className="kidBtn" type="submit">
              {isPlayAreaBooking
                ? busy
                  ? "Please wait..."
                  : "Continue"
                : busy
                ? "Creating..."
                : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}