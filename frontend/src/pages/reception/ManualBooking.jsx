import { useEffect, useMemo, useState } from "react";
import { createManualBookingApi } from "../../api/receptionApi";
import {
  listPublicClassesApi,
  listPublicEventsApi,
  listPublicPlayAreasApi,
} from "../../api/publicApi";

const PARTY_PACKAGES = [
  {
    id: "PKG01",
    name: "Classic Party",
    price: 25000,
    duration: "2-hour party room access",
    capacity: "Up to 15 children",
  },
  {
    id: "PKG02",
    name: "Deluxe Party",
    price: 50000,
    duration: "3-hour party room access",
    capacity: "Up to 25 children",
  },
];

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

  const isManualTimeType =
    booking_type === "PLAY_AREA" || booking_type === "PARTY";
  const isAutoTimeType =
    booking_type === "CLASS" || booking_type === "EVENT";

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
            label: `${item.name} - LKR ${formatMoney(item.price)}`,
            name: item.name,
            description: item.description || "",
            price: item.price || 0,
            extra: item.age_group ? `Age Group: ${item.age_group}` : "",
            raw: item,
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
              item.time_slot ||
              buildTimeSlotFromTimes(item.start_time, item.end_time) ||
              "",
            raw: item,
          }))
        );
      } else if (type === "PARTY") {
        setCatalogItems(
          PARTY_PACKAGES.map((pkg) => ({
            id: pkg.id,
            label: `${pkg.name} - LKR ${formatMoney(pkg.price)}`,
            name: pkg.name,
            description: pkg.duration,
            price: pkg.price,
            extra: pkg.capacity,
            raw: pkg,
          }))
        );
      } else {
        setCatalogItems([]);
      }
    } catch (e) {
      setCatalogItems([]);
      setErr("Failed to load available items for the selected booking type.");
    } finally {
      setCatalogLoading(false);
    }
  };

  const selectedItem = useMemo(() => {
    return (
      catalogItems.find((item) => String(item.id) === String(selectedItemId)) ||
      null
    );
  }, [catalogItems, selectedItemId]);

  useEffect(() => {
    if (!selectedItem) return;

    if (isAutoTimeType && selectedItem.time_slot) {
      setTimeSlot(selectedItem.time_slot);
    } else if (isManualTimeType) {
      setTimeSlot("");
    }
  }, [selectedItem, booking_type, isAutoTimeType, isManualTimeType]);

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
      if (!startTime || !endTime) {
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
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Add Manual Booking</h2>

      <form
        onSubmit={submit}
        style={{
          background: "white",
          padding: 16,
          borderRadius: 12,
          display: "grid",
          gap: 10,
          maxWidth: 700,
        }}
      >
        <input
          placeholder="Customer name"
          value={customer_name}
          onChange={handleNameChange}
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={handlePhoneChange}
          maxLength={10}
        />

        <select value={booking_type} onChange={(e) => setType(e.target.value)}>
          <option value="PLAY_AREA">Play Area</option>
          <option value="PARTY">Party</option>
          <option value="EVENT">Event</option>
          <option value="CLASS">Class</option>
        </select>

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

        <select
          value={payment_type}
          onChange={(e) => setPaymentType(e.target.value)}
        >
          <option value="CASH">Cash</option>
          <option value="CARD">Card</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="ONLINE">Online Payment</option>
        </select>

        {selectedItem && (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 12,
              background: "#fafafa",
              display: "grid",
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 700 }}>{selectedItem.name}</div>
            {selectedItem.description ? (
              <div style={{ color: "#555" }}>{selectedItem.description}</div>
            ) : null}
            {selectedItem.extra ? (
              <div style={{ color: "#555" }}>{selectedItem.extra}</div>
            ) : null}
            {selectedItem.price ? (
              <div style={{ color: "#111827", fontWeight: 600 }}>
                Price: LKR {formatMoney(selectedItem.price)}
              </div>
            ) : null}
          </div>
        )}

        <input
          type="date"
          value={booking_date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
        />

        {isManualTimeType && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <label style={{ display: "block", marginBottom: 6 }}>
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                min={booking_date === today ? currentTime : undefined}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6 }}>
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                min={
                  startTime || (booking_date === today ? currentTime : undefined)
                }
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        )}

        {isAutoTimeType && (
          <input
            value={time_slot}
            readOnly
            placeholder="Auto-filled time slot"
          />
        )}

        <textarea
          rows={4}
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {info && <div style={{ color: "green" }}>{info}</div>}

        <button disabled={busy} type="submit">
          {busy ? "Saving..." : "Create Booking"}
        </button>
      </form>
    </div>
  );
}