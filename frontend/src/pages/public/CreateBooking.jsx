import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createBookingApi, createPaymentApi } from "../../api/parentApi";

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

  const packageAmountLabel = useMemo(() => {
    const amount = Number(String(packagePriceFromUrl || "").replace(/,/g, ""));
    if (!amount || Number.isNaN(amount)) return "";
    return `LKR ${amount.toLocaleString()}`;
  }, [packagePriceFromUrl]);

  const [form, setForm] = useState({
    booking_type: bookingTypeFromUrl,
    booking_date: "",
    time_slot: "",
    notes: "",
  });

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [referenceNo, setReferenceNo] = useState("");
  const [bankSlipFile, setBankSlipFile] = useState(null);
  const [bankSlipData, setBankSlipData] = useState("");

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

  useEffect(() => {
    if (paymentMethod !== "BANK_TRANSFER") {
      setReferenceNo("");
      setBankSlipFile(null);
      setBankSlipData("");
    }
  }, [paymentMethod]);

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

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleSlipChange = async (e) => {
    const file = e.target.files?.[0] || null;

    setBankSlipFile(file);
    setBankSlipData("");
    setErr("");
    setInfo("");

    if (!file) return;

    const allowed = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ];

    if (!allowed.includes(file.type)) {
      setErr("Please upload JPG, PNG, or PDF bank slip.");
      e.target.value = "";
      setBankSlipFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErr("Bank slip must be 5MB or smaller.");
      e.target.value = "";
      setBankSlipFile(null);
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      setBankSlipData(base64);
    } catch {
      setErr("Failed to read bank slip file.");
      setBankSlipFile(null);
    }
  };

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

    if (isPartyBooking && paymentMethod === "BANK_TRANSFER") {
      if (!referenceNo.trim()) {
        return setErr("Reference number is required for bank transfer.");
      }

      if (!bankSlipFile || !bankSlipData) {
        return setErr("Please upload the bank slip.");
      }
    }

    setBusy(true);

    let createdBookingId = 0;

    try {
      const bookingRes = await createBookingApi(form);
      const bookingId = Number(bookingRes?.data?.bookingId || 0);
      createdBookingId = bookingId;

      if (!isPartyBooking) {
        setInfo("✅ Booking created! Our team will confirm soon.");
        setTimeout(() => navigate("/profile"), 700);
        return;
      }

      if (!bookingId) {
        setInfo("✅ Booking created successfully.");
        setTimeout(() => navigate("/profile"), 700);
        return;
      }

      if (paymentMethod === "CARD") {
        navigate(`/pay/card?bookingId=${bookingId}`);
        return;
      }

      const paymentRes = await createPaymentApi({
        booking_id: bookingId,
        payment_method: paymentMethod,
        reference_no: paymentMethod === "BANK_TRANSFER" ? referenceNo.trim() : null,
        notes: form.notes || null,
        bank_slip_name:
          paymentMethod === "BANK_TRANSFER" ? bankSlipFile?.name || null : null,
        bank_slip_data: paymentMethod === "BANK_TRANSFER" ? bankSlipData : null,
      });

      const paymentNo = paymentRes?.data?.payment?.payment_no || "";

      if (paymentMethod === "BANK_TRANSFER") {
        setInfo(
          `✅ Party booking created and bank transfer submitted successfully. Receipt: ${paymentNo}`
        );
      } else {
        setInfo(`✅ Party booking created successfully. Receipt: ${paymentNo}`);
      }

      setTimeout(() => navigate("/profile"), 1000);
    } catch (e2) {
      const message = e2?.response?.data?.message || "Failed to create booking";

      if (createdBookingId && isPartyBooking) {
        setErr(`Booking was created, but payment could not be completed. ${message}`);
      } else {
        setErr(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const isPartyBooking = form.booking_type === "PARTY";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="kidCard" style={{ padding: 16, maxWidth: 700 }}>
        <div className="badgeSoft">📅 Create Booking</div>

        <h1 style={{ margin: "10px 0 0", fontSize: 26 }}>
          {isPartyBooking ? "Book a Party Package" : "Create Booking"}
        </h1>

        <div style={{ opacity: 0.7, marginTop: 6 }}>
          {isPartyBooking
            ? "Choose your party date and time. Then select how you want to pay."
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
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

          <label style={{ fontWeight: 800 }}>Notes</label>
          <textarea
            className="kidInput"
            rows={3}
            placeholder="Any special requests?"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />

          {isPartyBooking ? (
            <>
              {packageAmountLabel ? (
                <>
                  <label style={{ fontWeight: 800 }}>Package Amount</label>
                  <input className="kidInput" value={packageAmountLabel} readOnly />
                </>
              ) : null}

              <label style={{ fontWeight: 800 }}>Payment Method</label>
              <select
                className="kidInput"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="CARD">Card Payment</option>
                <option value="CASH">Cash Payment</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>

              {paymentMethod === "BANK_TRANSFER" ? (
                <>
                  <label style={{ fontWeight: 800 }}>Reference Number</label>
                  <input
                    className="kidInput"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="Enter bank transfer reference number"
                  />

                  <label style={{ fontWeight: 800 }}>Upload Bank Slip</label>
                  <input
                    className="kidInput"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleSlipChange}
                  />
                </>
              ) : null}
            </>
          ) : null}

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
              {busy
                ? "Processing..."
                : isPartyBooking && paymentMethod === "CARD"
                ? "Continue to Card Payment"
                : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}