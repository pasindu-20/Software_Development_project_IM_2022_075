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

const PLAY_AREA_OPEN_TIME = "09:00";
const PLAY_AREA_CLOSE_TIME = "18:00";
const PLAY_AREA_LAST_START_TIME = "17:59";

function addHoursToTime(time, hoursToAdd) {
  if (!time) return "";

  const [hourStr, minuteStr] = String(time).split(":");
  const date = new Date();
  date.setHours(Number(hourStr || 0), Number(minuteStr || 0), 0, 0);
  date.setHours(date.getHours() + hoursToAdd);

  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function getPlayAreaEndTime(start) {
  if (!start) return "";
  const calculatedEnd = addHoursToTime(start, 3);
  return calculatedEnd > PLAY_AREA_CLOSE_TIME ? PLAY_AREA_CLOSE_TIME : calculatedEnd;
}

function getPlayAreaStartMin(bookingDate, today, currentTime) {
  if (bookingDate !== today) return PLAY_AREA_OPEN_TIME;
  if (!currentTime || currentTime <= PLAY_AREA_OPEN_TIME) return PLAY_AREA_OPEN_TIME;
  return currentTime;
}

const PAYMENT_OPTIONS = [
  {
    key: "CARD",

    title: "Card Payment",
    desc: "Pay securely online using your card.",
  },
  {
    key: "CASH",

    title: "Cash Payment",
    desc: "Pay physically at the reception counter.",
  },
  {
    key: "BANK_TRANSFER",

    title: "Bank Transfer",
    desc: "Upload your bank slip for receptionist approval.",
  },
];

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

  const currentTimeStr = useMemo(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
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
    if (isPlayAreaBooking && startTime) {
      const generatedEndTime = getPlayAreaEndTime(startTime);
      if (generatedEndTime !== endTime) {
        setEndTime(generatedEndTime);
        return;
      }
    }

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
  }, [startTime, endTime, isPlayAreaBooking]);

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

    if (!form.booking_date) {
      setStartTime("");
      setEndTime("");
      return;
    }

    const minStartTime = getPlayAreaStartMin(form.booking_date, todayStr, currentTimeStr);

    if (
      startTime &&
      (
        startTime < minStartTime ||
        startTime < PLAY_AREA_OPEN_TIME ||
        startTime > PLAY_AREA_LAST_START_TIME
      )
    ) {
      setStartTime("");
      setEndTime("");
    }
  }, [isPlayAreaBooking, form.booking_date, startTime, todayStr, currentTimeStr]);

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

  const selectedPayment = useMemo(
    () => PAYMENT_OPTIONS.find((item) => item.key === paymentMethod),
    [paymentMethod]
  );

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

    if (isPlayAreaBooking) {
      if (!startTime) {
        return setErr("Please select a start time.");
      }

      if (form.booking_date === todayStr && currentTimeStr >= PLAY_AREA_CLOSE_TIME) {
        return setErr("Today's play area booking time is over. Please choose another date.");
      }

      if (startTime < PLAY_AREA_OPEN_TIME || startTime > PLAY_AREA_LAST_START_TIME) {
        return setErr("Play area start time must be between 09:00 AM and 06:00 PM.");
      }

      const generatedEndTime = getPlayAreaEndTime(startTime);

      if (!generatedEndTime || !isEndAfterStart(startTime, generatedEndTime)) {
        return setErr("Please select a valid play area start time before 06:00 PM.");
      }

      if (form.booking_date === todayStr && startTime < currentTimeStr) {
        return setErr("For today's booking, start time cannot be earlier than the current time.");
      }

      if (generatedEndTime !== endTime) {
        setEndTime(generatedEndTime);
      }
    } else {
      if (!startTime || !endTime) {
        return setErr("Please select both start time and end time.");
      }

      if (!isEndAfterStart(startTime, endTime)) {
        return setErr("End time must be later than start time.");
      }
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
        setInfo(" Booking created! Our team will confirm soon.");
        setTimeout(() => navigate("/profile"), 700);
        return;
      }

      if (!bookingId) {
        setInfo(" Booking created successfully.");
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
          `Booking created and bank transfer submitted successfully. Invoice: ${paymentNo}`
        );
      } else {
        setInfo(`Booking created successfully. Invoice: ${paymentNo}`);
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
    <motion.div
      className="bookingModernPage"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bookingModernHero">
        <div className="bookingModernHeroText">
          <div className="bookingModernBadge"> Create Booking</div>

          <h1 className="bookingModernTitle">
            {isPartyBooking
              ? "Book a Party Package"
              : isPlayAreaBooking
                ? "Book a Play Area"
                : "Create Booking"}
          </h1>

          <p className="bookingModernSubtitle">
            {isPartyBooking
              ? "Choose your party date, time, and payment method."
              : isPlayAreaBooking
                ? "Choose your play area booking date, time, child count, and payment method."
                : "Choose your booking date and time. Our team will confirm availability."}
          </p>

          <div className="bookingModernMetaRow">
            <div className="bookingModernMetaCard">
              <span className="bookingModernMetaLabel">Booking Type</span>
              <strong>{form.booking_type === "PLAY_AREA" ? "Play Area" : form.booking_type}</strong>
            </div>

            {isPlayAreaBooking && selectedPlayArea ? (
              <div className="bookingModernMetaCard">
                <span className="bookingModernMetaLabel">Selected Area</span>
                <strong>{selectedPlayArea.name}</strong>
              </div>
            ) : null}

            {isBookingWithPayment && paymentAmountLabel ? (
              <div className="bookingModernMetaCard">
                <span className="bookingModernMetaLabel">Amount</span>
                <strong>{paymentAmountLabel}</strong>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="bookingModernBackBtn"
          onClick={() => navigate("/profile")}
        >
          ← Back
        </button>
      </div>

      {err ? <div className="bookingModernAlert error">{err}</div> : null}
      {info ? <div className="bookingModernAlert success">{info}</div> : null}

      <div className="bookingModernGrid">
        <section className="bookingModernCard">

          <h2 className="bookingModernCardTitle">Booking Details</h2>
          <p className="bookingModernCardText">
            Fill in the booking information below and continue with payment.
          </p>

          <form onSubmit={submit} className="bookingModernForm">
            <div>
              <label className="bookingModernLabel">Booking Type</label>
              <div className="bookingModernReadonly">{form.booking_type}</div>
            </div>

            {isPlayAreaBooking ? (
              <>
                <div>
                  <label className="bookingModernLabel">Play Area</label>
                  <select
                    className="bookingModernInput"
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
                </div>

                <div className="bookingModernStatsGrid">
                  <div className="bookingModernStatBox">
                    <span>Maximum Slots</span>
                    <strong>{availability.max_slots || 0}</strong>
                  </div>

                  <div className="bookingModernStatBox">
                    <span>Remaining Slots</span>
                    <strong>
                      {availabilityLoading
                        ? "Loading..."
                        : Number(availability.remaining_slots || 0)}
                    </strong>
                  </div>

                  <div className="bookingModernStatBox">
                    <span>Already Booked</span>
                    <strong>{Number(availability.booked_slots || 0)}</strong>
                  </div>
                </div>

                <div>
                  <label className="bookingModernLabel">Number of Children</label>
                  <input
                    className="bookingModernInput"
                    type="number"
                    min="1"
                    max={Math.max(1, Number(availability.remaining_slots || 0))}
                    value={childCount}
                    onChange={(e) => setChildCount(e.target.value)}
                  />
                </div>
              </>
            ) : null}

            <div>
              <label className="bookingModernLabel">Booking Date</label>
              <input
                className="bookingModernInput"
                type="date"
                min={todayStr}
                value={form.booking_date}
                onChange={(e) => set("booking_date", e.target.value)}
              />
            </div>

            <div className="bookingModernTwoCol">
              <div>
                <label className="bookingModernLabel">Start Time</label>
                <input
                  className="bookingModernInput"
                  type="time"
                  value={startTime}
                  min={
                    isPlayAreaBooking
                      ? getPlayAreaStartMin(form.booking_date, todayStr, currentTimeStr)
                      : undefined
                  }
                  max={isPlayAreaBooking ? PLAY_AREA_LAST_START_TIME : undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStartTime(value);

                    if (isPlayAreaBooking) {
                      setEndTime(getPlayAreaEndTime(value));
                    }
                  }}
                />
              </div>

              <div>
                <label className="bookingModernLabel">End Time</label>
                <input
                  className="bookingModernInput"
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    if (!isPlayAreaBooking) {
                      setEndTime(e.target.value);
                    }
                  }}
                  readOnly={isPlayAreaBooking}
                  disabled={isPlayAreaBooking}
                />
              </div>
            </div>

            <div>
              <label className="bookingModernLabel">Selected Time Slot</label>
              <div className="bookingModernReadonly">
                {form.time_slot || "Time slot will be generated automatically"}
              </div>
            </div>

            <div>
              <label className="bookingModernLabel">Notes</label>
              <textarea
                className="bookingModernTextarea"
                rows={4}
                placeholder="Any special requests?"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
              />
            </div>

            {isBookingWithPayment ? (
              <>
                {paymentAmountLabel ? (
                  <div>
                    <label className="bookingModernLabel">
                      {isPlayAreaBooking ? "Total Amount" : "Package Amount"}
                    </label>
                    <div className="bookingModernReadonly bookingModernAmount">
                      {paymentAmountLabel}
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="bookingModernLabel">Payment Method</label>

                  <div className="bookingModernMethodGrid">
                    {PAYMENT_OPTIONS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPaymentMethod(item.key)}
                        className={`bookingModernMethodCard ${
                          paymentMethod === item.key ? "active" : ""
                        }`}
                      >
                        <div className="bookingModernMethodIcon">{item.icon}</div>
                        <div className="bookingModernMethodContent">
                          <div className="bookingModernMethodTitle">{item.title}</div>
                          <div className="bookingModernMethodDesc">{item.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "BANK_TRANSFER" ? (
                  <div className="bookingModernBankBox">
                    <div>
                      <label className="bookingModernLabel">Reference Number</label>
                      <input
                        className="bookingModernInput"
                        value={referenceNo}
                        onChange={(e) => setReferenceNo(e.target.value)}
                        placeholder="Enter bank transfer reference number"
                      />
                    </div>

                    <div>
                      <label className="bookingModernLabel">Upload Bank Slip</label>

                      <label className="bookingModernUploadBox">
                        <input
                          className="bookingModernHiddenFileInput"
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handleSlipChange}
                        />
                        <span className="bookingModernUploadIcon">📎</span>
                        <span className="bookingModernUploadText">
                          {bankSlipFile
                            ? bankSlipFile.name
                            : "Click to upload JPG, PNG, or PDF"}
                        </span>
                      </label>

                      <div className="bookingModernUploadHint">
                        Maximum file size: 5MB
                      </div>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            <div className="bookingModernActionRow">
              <button
                type="button"
                className="bookingModernGhostBtn"
                onClick={() => navigate("/profile")}
              >
                Back
              </button>

              <button disabled={busy} className="bookingModernPrimaryBtn" type="submit">
                {busy
                  ? "Processing..."
                  : isBookingWithPayment && paymentMethod === "CARD"
                    ? "Continue to Card Payment"
                    : "Create Booking"}
              </button>
            </div>
          </form>
        </section>

        <aside className="bookingModernCard bookingModernSideCard">
          <h2 className="bookingModernCardTitle">Booking Summary</h2>
          <p className="bookingModernCardText">
            Review the selected details before continuing.
          </p>

          <div className="bookingModernSummaryList">
            <div className="bookingModernSummaryItem">
              <span>Booking Type</span>
              <strong>{form.booking_type}</strong>
            </div>

            {isPlayAreaBooking ? (
              <>
                <div className="bookingModernSummaryItem">
                  <span>Play Area</span>
                  <strong>{selectedPlayArea?.name || "-"}</strong>
                </div>

                <div className="bookingModernSummaryItem">
                  <span>Children</span>
                  <strong>{Number(childCount || 0)}</strong>
                </div>

                <div className="bookingModernSummaryItem">
                  <span>Unit Price</span>
                  <strong>
                    {selectedPlayArea ? `LKR ${formatMoney(selectedPlayArea.price)}` : "-"}
                  </strong>
                </div>

                <div className="bookingModernSummaryItem">
                  <span>Remaining Slots</span>
                  <strong>
                    {availabilityLoading
                      ? "Loading..."
                      : Number(availability.remaining_slots || 0)}
                  </strong>
                </div>
              </>
            ) : null}

            {isPartyBooking ? (
              <>
                <div className="bookingModernSummaryItem">
                  <span>Package</span>
                  <strong>{packageNameFromUrl || "-"}</strong>
                </div>

                <div className="bookingModernSummaryItem">
                  <span>Package Price</span>
                  <strong>{packageAmount ? `LKR ${formatMoney(packageAmount)}` : "-"}</strong>
                </div>
              </>
            ) : null}

            <div className="bookingModernSummaryItem">
              <span>Date</span>
              <strong>{form.booking_date || "-"}</strong>
            </div>

            <div className="bookingModernSummaryItem">
              <span>Time Slot</span>
              <strong>{form.time_slot || "-"}</strong>
            </div>

            {isBookingWithPayment ? (
              <>
                <div className="bookingModernSummaryItem">
                  <span>Payment Method</span>
                  <strong>{selectedPayment?.title || "-"}</strong>
                </div>

                <div className="bookingModernSummaryItem bookingModernSummaryHighlight">
                  <span>Total</span>
                  <strong>{paymentAmountLabel || "-"}</strong>
                </div>
              </>
            ) : null}
          </div>

          <div className="bookingModernTipBox">
            <div className="bookingModernTipTitle">Important</div>
            <p>
              Card payments continue to Stripe. Cash and bank transfer payments stay
              pending until confirmation.
            </p>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}