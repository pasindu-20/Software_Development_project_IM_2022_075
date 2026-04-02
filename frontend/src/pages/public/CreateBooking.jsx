import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createBookingApi, createPaymentApi } from "../../api/parentApi";
import {
  getPlayAreaAvailabilityApi,
  listPublicPlayAreasApi,
} from "../../api/publicApi";

function formatTo12Hour(time24) {
  const [hourStr, minute] = String(time24 || "").split(":");
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

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

export default function CreateBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingTypeFromUrl = searchParams.get("booking_type") || "PLAY_AREA";
  const packageNameFromUrl = searchParams.get("package") || "";
  const packagePriceFromUrl = searchParams.get("price") || "";
  const playAreaIdFromUrl = searchParams.get("play_area_id") || "";

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
  });

  const [customerNotes, setCustomerNotes] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("CARD");
  const [referenceNo, setReferenceNo] = useState("");
  const [bankSlipFile, setBankSlipFile] = useState(null);
  const [bankSlipData, setBankSlipData] = useState("");

  const [playAreas, setPlayAreas] = useState([]);
  const [playAreasLoading, setPlayAreasLoading] = useState(false);
  const [selectedPlayAreaId, setSelectedPlayAreaId] = useState(playAreaIdFromUrl);
  const [childCount, setChildCount] = useState(1);

  const [availability, setAvailability] = useState({
    max_slots: 0,
    booked_slots: 0,
    remaining_slots: 0,
  });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const isPartyBooking = form.booking_type === "PARTY";
  const isPlayAreaBooking = form.booking_type === "PLAY_AREA";
  const isBookingWithPayment = isPartyBooking || isPlayAreaBooking;

  const packageAmount = useMemo(() => {
    const amount = Number(String(packagePriceFromUrl || "").replace(/,/g, ""));
    if (!amount || Number.isNaN(amount)) return 0;
    return amount;
  }, [packagePriceFromUrl]);

  useEffect(() => {
    if (!isPlayAreaBooking) return;

    const loadPlayAreas = async () => {
      setPlayAreasLoading(true);
      try {
        const res = await listPublicPlayAreasApi();
        const rows = Array.isArray(res.data) ? res.data : [];
        setPlayAreas(rows);

        if (!selectedPlayAreaId && rows.length > 0) {
          setSelectedPlayAreaId(String(playAreaIdFromUrl || rows[0].id));
        }
      } catch (e) {
        console.error("Failed to load play areas:", e);
        setPlayAreas([]);
      } finally {
        setPlayAreasLoading(false);
      }
    };

    loadPlayAreas();
  }, [isPlayAreaBooking, selectedPlayAreaId, playAreaIdFromUrl]);

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

  const selectedPlayArea = useMemo(() => {
    return (
      playAreas.find((item) => String(item.id) === String(selectedPlayAreaId)) || null
    );
  }, [playAreas, selectedPlayAreaId]);

  useEffect(() => {
    if (!isPlayAreaBooking) return;

    const maxSlots = Number(selectedPlayArea?.capacity || 0);

    if (!selectedPlayAreaId) {
      setAvailability({
        max_slots: 0,
        booked_slots: 0,
        remaining_slots: 0,
      });
      return;
    }

    if (!form.booking_date || !startTime || !endTime || !isEndAfterStart(startTime, endTime)) {
      setAvailability({
        max_slots: maxSlots,
        booked_slots: 0,
        remaining_slots: maxSlots,
      });
      return;
    }

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const res = await getPlayAreaAvailabilityApi({
          play_area_id: selectedPlayAreaId,
          booking_date: form.booking_date,
          start_time: startTime,
          end_time: endTime,
        });

        setAvailability({
          max_slots: Number(res?.data?.max_slots || 0),
          booked_slots: Number(res?.data?.booked_slots || 0),
          remaining_slots: Number(res?.data?.remaining_slots || 0),
        });
      } catch (e) {
        console.error("Failed to load availability:", e);
        setAvailability({
          max_slots: maxSlots,
          booked_slots: 0,
          remaining_slots: maxSlots,
        });
      } finally {
        setAvailabilityLoading(false);
      }
    };

    loadAvailability();
  }, [
    isPlayAreaBooking,
    selectedPlayAreaId,
    selectedPlayArea,
    form.booking_date,
    startTime,
    endTime,
  ]);

  const playAreaUnitPrice = Number(selectedPlayArea?.price || 0);
  const totalPlayAreaAmount = playAreaUnitPrice * Number(childCount || 0);

  const paymentAmountLabel = useMemo(() => {
    if (isPartyBooking && packageAmount > 0) {
      return `LKR ${formatMoney(packageAmount)}`;
    }

    if (isPlayAreaBooking && totalPlayAreaAmount > 0) {
      return `LKR ${formatMoney(totalPlayAreaAmount)}`;
    }

    return "";
  }, [isPartyBooking, isPlayAreaBooking, packageAmount, totalPlayAreaAmount]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

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

    if (isPlayAreaBooking) {
      if (!selectedPlayArea) {
        return setErr("Please select a play area.");
      }

      const childCountNum = Number(childCount);

      if (!Number.isInteger(childCountNum) || childCountNum < 1) {
        return setErr("Please enter a valid number of children.");
      }

      if (childCountNum > Number(availability.remaining_slots || 0)) {
        return setErr(
          `Only ${availability.remaining_slots} slots remaining for the selected time.`
        );
      }
    }

    if (isBookingWithPayment && paymentMethod === "BANK_TRANSFER") {
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
      const noteParts = [];

      if (isPartyBooking) {
        noteParts.push("Party package booking");
        if (packageNameFromUrl) noteParts.push(`Package: ${packageNameFromUrl}`);
        if (packageAmount > 0) noteParts.push(`Price: LKR ${packageAmount}`);
      }

      if (isPlayAreaBooking) {
        noteParts.push(`Play Area: ${selectedPlayArea?.name || "Play Area"}`);
        noteParts.push(`Children Count: ${Number(childCount)}`);
        noteParts.push(`Total Price: LKR ${totalPlayAreaAmount}`);
      }

      if (customerNotes.trim()) {
        noteParts.push(`Customer Note: ${customerNotes.trim()}`);
      }

      const bookingPayload = {
        ...form,
        notes: noteParts.join(" | "),
        play_area_id: isPlayAreaBooking ? Number(selectedPlayAreaId) : null,
        children_count: isPlayAreaBooking ? Number(childCount) : null,
      };

      const bookingRes = await createBookingApi(bookingPayload);
      const bookingId = Number(bookingRes?.data?.bookingId || 0);
      createdBookingId = bookingId;

      if (!isBookingWithPayment) {
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
        notes: customerNotes.trim() || null,
        bank_slip_name:
          paymentMethod === "BANK_TRANSFER" ? bankSlipFile?.name || null : null,
        bank_slip_data: paymentMethod === "BANK_TRANSFER" ? bankSlipData : null,
      });

      const paymentNo = paymentRes?.data?.payment?.payment_no || "";

      if (paymentMethod === "BANK_TRANSFER") {
        setInfo(
          ` Booking created and bank transfer submitted successfully. Invoice: ${paymentNo}`
        );
      } else {
        setInfo(` Booking created successfully. Invoice: ${paymentNo}`);
      }

      setTimeout(() => navigate("/profile"), 1000);
    } catch (e2) {
      const message = e2?.response?.data?.message || "Failed to create booking";

      if (createdBookingId && isBookingWithPayment) {
        setErr(`Booking was created, but payment could not be completed. ${message}`);
      } else {
        setErr(message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="kidCard" style={{ padding: 16, maxWidth: 700 }}>
        <div className="badgeSoft">📅 Create Booking</div>

        <h1 style={{ margin: "10px 0 0", fontSize: 26 }}>
          {isPartyBooking
            ? "Book a Party Package"
            : isPlayAreaBooking
              ? "Book a Play Area"
              : "Create Booking"}
        </h1>

        <div style={{ opacity: 0.7, marginTop: 6 }}>
          {isPartyBooking
            ? "Choose your party date and time. Then select how you want to pay."
            : isPlayAreaBooking
              ? "Choose your play area booking date, time, child count, and payment method."
              : "Choose your booking date and time. Our team will confirm availability."}
        </div>

        <form onSubmit={submit} style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <label style={{ fontWeight: 800 }}>Booking Type</label>
          <input className="kidInput" value={form.booking_type} readOnly />

          {isPlayAreaBooking ? (
            <>
              <label style={{ fontWeight: 800 }}>Play Area</label>
              <select
                className="kidInput"
                value={selectedPlayAreaId}
                onChange={(e) => setSelectedPlayAreaId(e.target.value)}
                disabled={playAreasLoading || playAreas.length === 0}
              >
                <option value="">
                  {playAreasLoading
                    ? "Loading play areas..."
                    : playAreas.length
                      ? "Select play area"
                      : "No active play areas"}
                </option>

                {playAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name} - LKR {formatMoney(area.price)}
                  </option>
                ))}
              </select>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <label
                    style={{ fontWeight: 800, display: "block", marginBottom: 6 }}
                  >
                    Maximum Slots
                  </label>
                  <input
                    className="kidInput"
                    value={availability.max_slots || 0}
                    readOnly
                  />
                </div>

                <div>
                  <label
                    style={{ fontWeight: 800, display: "block", marginBottom: 6 }}
                  >
                    Remaining Slots
                  </label>
                  <input
                    className="kidInput"
                    value={
                      availabilityLoading
                        ? "Loading..."
                        : Number(availability.remaining_slots || 0)
                    }
                    readOnly
                  />
                </div>
              </div>

              <div style={{ fontSize: 13, opacity: 0.75 }}>
                Already booked for this time: {Number(availability.booked_slots || 0)}
              </div>

              <label style={{ fontWeight: 800 }}>Number of Children</label>
              <input
                className="kidInput"
                type="number"
                min="1"
                max={Math.max(1, Number(availability.remaining_slots || 0))}
                value={childCount}
                onChange={(e) => setChildCount(e.target.value)}
              />
            </>
          ) : null}

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
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
          />

          {isBookingWithPayment ? (
            <>
              {paymentAmountLabel ? (
                <>
                  <label style={{ fontWeight: 800 }}>
                    {isPlayAreaBooking ? "Total Amount" : "Package Amount"}
                  </label>
                  <input className="kidInput" value={paymentAmountLabel} readOnly />
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

                  {bankSlipFile ? (
                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                      Selected file: <b>{bankSlipFile.name}</b>
                    </div>
                  ) : null}
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
                : isBookingWithPayment && paymentMethod === "CARD"
                  ? "Continue to Card Payment"
                  : "Create Booking"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}