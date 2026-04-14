import { useEffect, useMemo, useState } from "react";
import { createManualBookingApi } from "../../api/receptionApi";
import {
  listPublicClassesApi,
  listPublicEventsApi,
  listPublicPlayAreasApi,
  listPublicPartyPackagesApi,
} from "../../api/publicApi";

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function buildTimeSlotFromTimes(start, end) {
  if (!start || !end) return "";
  return `${String(start).slice(0, 5)} - ${String(end).slice(0, 5)}`;
}

function getTodayDateString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentTimeString() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
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

function isValidCustomerName(name) {
  return /^[A-Za-z\s]+$/.test(name.trim());
}

function isValidPhone(phone) {
  return /^\d{10}$/.test(phone);
}

export default function RecManualBooking() {
  const [customer_name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [booking_type, setType] = useState("PLAY_AREA");
  const [payment_type, setPaymentType] = useState("CASH");
  const [booking_date, setDate] = useState("");
  const [time_slot, setTimeSlot] = useState("");
  const [note, setNote] = useState("");

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [catalogItems, setCatalogItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const today = getTodayDateString();
  const currentTime = getCurrentTimeString();

  const isPlayAreaType = booking_type === "PLAY_AREA";
  const isManualTimeType = booking_type === "PLAY_AREA" || booking_type === "PARTY";
  const isAutoTimeType = booking_type === "CLASS" || booking_type === "EVENT";

  useEffect(() => {
    loadItemsByType(booking_type);
    setSelectedItemId("");
    setTimeSlot("");
    setStartTime("");
    setEndTime("");
  }, [booking_type]);

  const loadItemsByType = async (type) => {
    setCatalogLoading(true);
    setErr("");

    try {
      if (type === "PLAY_AREA") {
        const res = await listPublicPlayAreasApi();
        setCatalogItems(
          (res.data || []).map((item) => ({
            id: item.id,
            label: `${item.name || item.title} - LKR ${formatMoney(item.price)}`,
            name: item.name || item.title,
            description: item.description || "",
            price: item.price || 0,
            extra:
              Number(item.capacity || item.max_children || 0) > 0
                ? `Capacity: ${item.capacity || item.max_children}`
                : "",
            raw: item,
          }))
        );
      } else if (type === "PARTY") {
        const res = await listPublicPartyPackagesApi();
        setCatalogItems(
          (res.data || []).map((pkg) => ({
            id: pkg.id,
            label: `${pkg.name} - LKR ${formatMoney(pkg.price)}`,
            name: pkg.name,
            description: pkg.duration_text || pkg.description || "",
            price: pkg.price || 0,
            extra:
              Number(pkg.max_children) > 0 ? `Up to ${pkg.max_children} children` : "",
            raw: pkg,
          }))
        );
      } else if (type === "CLASS") {
        const res = await listPublicClassesApi();
        setCatalogItems(
          (res.data || []).map((item) => ({
            id: item.id,
            label: `${item.title} - LKR ${formatMoney(item.fee)}`,
            name: item.title,
            description: item.description || "",
            price: item.fee || 0,
            extra: item.age ? `Age: ${item.age}` : "",
            time_slot:
              item.time_slot ||
              buildTimeSlotFromTimes(item.start_time, item.end_time) ||
              item.schedule_text ||
              "",
            raw: item,
          }))
        );
      } else if (type === "EVENT") {
        const res = await listPublicEventsApi();
        setCatalogItems(
          (res.data || []).map((item) => ({
            id: item.id,
            label: `${item.title} - LKR ${formatMoney(item.fee)}`,
            name: item.title,
            description: item.description || "",
            price: item.fee || 0,
            extra: item.event_date ? `Event Date: ${item.event_date}` : "",
            time_slot:
              item.time_slot || buildTimeSlotFromTimes(item.start_time, item.end_time) || "",
            raw: item,
          }))
        );
      } else {
        setCatalogItems([]);
      }
    } catch {
      setCatalogItems([]);
      setErr("Failed to load available items for the selected booking type.");
    } finally {
      setCatalogLoading(false);
    }
  };

  const selectedItem = useMemo(() => {
    return catalogItems.find((item) => String(item.id) === String(selectedItemId)) || null;
  }, [catalogItems, selectedItemId]);

  useEffect(() => {
    if (!selectedItem) return;

    if (isAutoTimeType && selectedItem.time_slot) {
      setTimeSlot(selectedItem.time_slot);
    } else if (isManualTimeType) {
      setTimeSlot("");
    }
  }, [selectedItem, booking_type, isAutoTimeType, isManualTimeType]);

  useEffect(() => {
    if (!isPlayAreaType) return;

    if (!booking_date) {
      setStartTime("");
      setEndTime("");
      return;
    }

    const minStartTime = getPlayAreaStartMin(booking_date, today, currentTime);

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
  }, [isPlayAreaType, booking_date, startTime, today, currentTime]);

  useEffect(() => {
    if (!isPlayAreaType) return;

    if (startTime) {
      const generatedEndTime = getPlayAreaEndTime(startTime);
      if (generatedEndTime !== endTime) {
        setEndTime(generatedEndTime);
      }
    } else if (endTime) {
      setEndTime("");
    }
  }, [isPlayAreaType, startTime, endTime]);

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (/^[A-Za-z\s]*$/.test(value)) {
      setName(value);
    }
  };

  const handlePhoneChange = (e) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(digitsOnly);
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!customer_name || !phone || !booking_date) {
      return setErr("Customer name, phone, and booking date are required.");
    }

    if (!isValidCustomerName(customer_name)) {
      return setErr("Customer name must contain only letters and spaces.");
    }

    if (!isValidPhone(phone)) {
      return setErr("Phone number must contain exactly 10 digits.");
    }

    if (booking_date < today) {
      return setErr("Past dates cannot be selected.");
    }

    if (!selectedItemId) {
      return setErr("Please select an existing item/package.");
    }

    if (!payment_type) {
      return setErr("Please select a payment type.");
    }

    let finalTimeSlot = time_slot;

    if (isManualTimeType) {
      if (!startTime) {
        return setErr(
          isPlayAreaType
            ? "Please select a start time."
            : "Please select both start time and end time."
        );
      }

      if (isPlayAreaType) {
        if (booking_date === today && currentTime >= PLAY_AREA_CLOSE_TIME) {
          return setErr("Today's play area booking time is over. Please choose another date.");
        }

        if (startTime < PLAY_AREA_OPEN_TIME || startTime > PLAY_AREA_LAST_START_TIME) {
          return setErr("Play area start time must be between 09:00 AM and 06:00 PM.");
        }

        if (booking_date === today && startTime < currentTime) {
          return setErr(
            "For today's booking, start time cannot be earlier than the current time."
          );
        }

        const generatedEndTime = getPlayAreaEndTime(startTime);

        if (!generatedEndTime || startTime >= generatedEndTime) {
          return setErr("Please select a valid play area start time before 06:00 PM.");
        }

        finalTimeSlot = `${startTime} - ${generatedEndTime}`;
      } else {
        if (!endTime) {
          return setErr("Please select both start time and end time.");
        }

        if (booking_date === today && startTime < currentTime) {
          return setErr(
            "For today's booking, start time cannot be earlier than the current time."
          );
        }

        if (startTime >= endTime) {
          return setErr("End time must be later than start time.");
        }

        finalTimeSlot = `${startTime} - ${endTime}`;
      }
    }

    if (isAutoTimeType && !finalTimeSlot) {
      return setErr("Time slot could not be loaded from the selected item.");
    }

    const combinedNote = [
      `Selected ${booking_type.replace("_", " ")}: ${selectedItem?.name || ""}`,
      selectedItem?.price ? `Price: LKR ${formatMoney(selectedItem.price)}` : "",
      `Payment Type: ${payment_type}`,
      selectedItem?.extra || "",
      note?.trim() ? `Reception Note: ${note.trim()}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    setBusy(true);
    try {
      await createManualBookingApi({
        customer_name: customer_name.trim(),
        phone,
        booking_type,
        booking_date,
        time_slot: finalTimeSlot,
        note: combinedNote,
      });

      setInfo("Manual booking created successfully.");
      setName("");
      setPhone("");
      setType("PLAY_AREA");
      setPaymentType("CASH");
      setDate("");
      setTimeSlot("");
      setStartTime("");
      setEndTime("");
      setNote("");
      setSelectedItemId("");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create manual booking");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="instructorPage receptionPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Add Manual Booking</h2>
      </div>

      <form onSubmit={submit} className="instructorContentCard receptionFormCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Create Booking</h3>
            <p className="instructorSectionText">
            </p>
          </div>
        </div>

        <div className="receptionStack">
          <label className="instructorField">
            <span className="instructorFieldLabel">Customer Name</span>
            <input placeholder="Customer name" value={customer_name} onChange={handleNameChange} />
          </label>

          <label className="instructorField">
            <span className="instructorFieldLabel">Phone</span>
            <input placeholder="Phone" value={phone} onChange={handlePhoneChange} maxLength={10} />
          </label>

          <label className="instructorField">
            <span className="instructorFieldLabel">Booking Type</span>
            <select value={booking_type} onChange={(e) => setType(e.target.value)}>
              <option value="PLAY_AREA">Play Area</option>
              <option value="PARTY">Party</option>
              <option value="EVENT">Event</option>
              <option value="CLASS">Class</option>
            </select>
          </label>

          <label className="instructorField">
            <span className="instructorFieldLabel">
              {booking_type === "PLAY_AREA"
                ? "Select Play Area"
                : booking_type === "PARTY"
                ? "Select Party Package"
                : booking_type === "EVENT"
                ? "Select Event"
                : "Select Class"}
            </span>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              disabled={catalogLoading || catalogItems.length === 0}
            >
              <option value="">
                {catalogLoading
                  ? "Loading items..."
                  : booking_type === "PLAY_AREA"
                  ? "Select Play Area"
                  : booking_type === "PARTY"
                  ? "Select Party Package"
                  : booking_type === "EVENT"
                  ? "Select Event"
                  : "Select Class"}
              </option>
              {catalogItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="instructorField">
            <span className="instructorFieldLabel">Payment Type</span>
            <select value={payment_type} onChange={(e) => setPaymentType(e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE">Online Payment</option>
            </select>
          </label>

          {selectedItem ? (
            <div className="receptionDetailBox">
              <div className="receptionDetailTitle">{selectedItem.name}</div>
              {selectedItem.description ? (
                <div className="instructorMuted">{selectedItem.description}</div>
              ) : null}
              {selectedItem.extra ? (
                <div className="instructorMuted">{selectedItem.extra}</div>
              ) : null}
              {selectedItem.price ? (
                <div className="receptionDetailStrong">Price: LKR {formatMoney(selectedItem.price)}</div>
              ) : null}
            </div>
          ) : null}

          <label className="instructorField">
            <span className="instructorFieldLabel">Booking Date</span>
            <input type="date" value={booking_date} min={today} onChange={(e) => setDate(e.target.value)} />
          </label>

          {isManualTimeType ? (
            <div className="receptionFormGrid2">
              <label className="instructorField">
                <span className="instructorFieldLabel">Start Time</span>
                <input
                  type="time"
                  value={startTime}
                  min={
                    isPlayAreaType
                      ? getPlayAreaStartMin(booking_date, today, currentTime)
                      : booking_date === today
                        ? currentTime
                        : undefined
                  }
                  max={isPlayAreaType ? PLAY_AREA_LAST_START_TIME : undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    setStartTime(value);

                    if (isPlayAreaType) {
                      setEndTime(getPlayAreaEndTime(value));
                    }
                  }}
                />
              </label>

              <label className="instructorField">
                <span className="instructorFieldLabel">End Time</span>
                <input
                  type="time"
                  value={endTime}
                  min={
                    isPlayAreaType
                      ? undefined
                      : startTime || (booking_date === today ? currentTime : undefined)
                  }
                  onChange={(e) => {
                    if (!isPlayAreaType) {
                      setEndTime(e.target.value);
                    }
                  }}
                  readOnly={isPlayAreaType}
                  disabled={isPlayAreaType}
                />
              </label>
            </div>
          ) : null}

          {isAutoTimeType ? (
            <label className="instructorField">
              <span className="instructorFieldLabel">Auto-filled Time Slot</span>
              <input value={time_slot} readOnly placeholder="Auto-filled time slot" />
            </label>
          ) : null}

          <label className="instructorField">
            <span className="instructorFieldLabel">Note</span>
            <textarea
              className="receptionTextarea"
              rows={4}
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}
        {info ? <div className="instructorSuccess">{info}</div> : null}

        <div className="receptionButtonRow">
          <button className="instructorButton" disabled={busy} type="submit">
            {busy ? "Saving..." : "Create Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}