import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

export default function AdminEventsClasses() {
  const [rows, setRows] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [itemType, setItemType] = useState("CLASS");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [fee, setFee] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const resetForm = () => {
    setEditingId(null);
    setItemType("CLASS");
    setTitle("");
    setDescription("");
    setImageUrl("");
    setAgeMin("");
    setAgeMax("");
    setFee("");
    setInstructorId("");
    setEventDate("");
    setStartTime("");
    setEndTime("");
    setStatus("ACTIVE");
  };

  const load = async () => {
    setErr("");
    try {
      const [eventsRes, instructorsRes] = await Promise.all([
        api.get("/api/admin/events-classes"),
        api.get("/api/admin/instructors"),
      ]);

      setRows(Array.isArray(eventsRes.data) ? eventsRes.data : []);
      setInstructors(Array.isArray(instructorsRes.data) ? instructorsRes.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load events/classes");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const validateForm = () => {
    if (!title.trim()) return "Title is required";
    if (ageMin === "" || Number(ageMin) < 0) return "Minimum age must be 0 or more";
    if (ageMax === "" || Number(ageMax) < Number(ageMin)) {
      return "Maximum age must be greater than or equal to minimum age";
    }
    if (fee === "" || Number(fee) < 0) return "Fee must be 0 or more";
    if (!instructorId) return "Instructor is required";
    if (!eventDate) return "Date is required";
    if (!startTime) return "Starting time is required";
    if (!endTime) return "Ending time is required";
    if (startTime >= endTime) return "Ending time must be greater than starting time";
    return "";
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    const validationError = validateForm();
    if (validationError) return setErr(validationError);

    setBusy(true);
    try {
      const payload = {
        item_type: itemType,
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl.trim(),
        age_min: Number(ageMin),
        age_max: Number(ageMax),
        fee: Number(fee),
        instructor_id: Number(instructorId),
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        status,
      };

      if (editingId) {
        await api.put(`/api/admin/events-classes/${editingId}`, payload);
        setInfo("Class / Event updated successfully");
      } else {
        await api.post("/api/admin/events-classes", payload);
        setInfo("Class / Event created successfully");
      }

      resetForm();
      await load();
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
        (editingId ? "Failed to update class / event" : "Failed to create class / event")
      );
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row) => {
    setErr("");
    setInfo("");
    setEditingId(row.id);
    setItemType(row.item_type || "CLASS");
    setTitle(row.title || "");
    setDescription(row.description || "");
    setImageUrl(row.image_url || "");
    setAgeMin(row.age_min ?? "");
    setAgeMax(row.age_max ?? "");
    setFee(row.fee ?? "");
    setInstructorId(row.instructor_id ?? "");
    setEventDate(row.event_date ? String(row.event_date).slice(0, 10) : "");
    setStartTime(row.start_time ? String(row.start_time).slice(0, 5) : "");
    setEndTime(row.end_time ? String(row.end_time).slice(0, 5) : "");
    setStatus(row.status || "ACTIVE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (row) => {
    const nextStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setErr("");
    setInfo("");
    try {
      await api.patch(`/api/admin/events-classes/${row.id}/status`, {
        status: nextStatus,
      });

      setInfo(`Class / Event marked as ${nextStatus}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update status");
    }
  };

  const deleteRow = async (row) => {
    const ok = window.confirm(
      `Are you sure you want to delete this ${row.item_type?.toLowerCase() || "item"}?\n\n${row.title}`
    );

    if (!ok) return;

    setErr("");
    setInfo("");

    try {
      await api.delete(`/api/admin/events-classes/${row.id}`);
      setInfo("Class / Event deleted successfully");

      if (editingId === row.id) {
        resetForm();
      }

      await load();
    } catch (e) {
      console.error("Delete error:", e);
      console.error("Delete error response:", e?.response?.data);
      setErr(e?.response?.data?.message || "Failed to delete class / event");
    }
  };

  const cols = [
    { key: "id", header: "ID" },
    { key: "item_type", header: "Type" },
    { key: "title", header: "Title" },
    { key: "description", header: "Description" },
    {
      key: "image_url",
      header: "Image URL",
      render: (r) =>
        r.image_url ? (
          <a href={r.image_url} target="_blank" rel="noreferrer">
            View Image
          </a>
        ) : (
          "-"
        ),
    },
    {
      key: "age_range",
      header: "Age Range",
      render: (r) => `${r.age_min ?? "-"} - ${r.age_max ?? "-"}`,
    },
    {
      key: "fee",
      header: "Fee",
      render: (r) => `LKR ${Number(r.fee || 0).toFixed(2)}`,
    },
    {
      key: "instructor_name",
      header: "Instructor",
      render: (r) => r.instructor_name || "-",
    },
    {
      key: "event_date",
      header: "Date",
      render: (r) => (r.event_date ? String(r.event_date).slice(0, 10) : "-"),
    },
    {
      key: "start_time",
      header: "Start Time",
      render: (r) => (r.start_time ? String(r.start_time).slice(0, 5) : "-"),
    },
    {
      key: "end_time",
      header: "End Time",
      render: (r) => (r.end_time ? String(r.end_time).slice(0, 5) : "-"),
    },
    { key: "status", header: "Status" },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            className="kidBtn"
            onClick={() => startEdit(r)}
            style={{ padding: "8px 12px" }}
          >
            Update
          </button>

          <button
            type="button"
            className="kidBtn"
            onClick={() => toggleStatus(r)}
            style={{
              padding: "8px 12px",
              background: r.status === "ACTIVE" ? "#b00020" : "#0a6b2b",
            }}
          >
            {r.status === "ACTIVE" ? "Inactivate" : "Activate"}
          </button>

          <button
            type="button"
            className="kidBtn"
            onClick={() => deleteRow(r)}
            style={{
              padding: "8px 12px",
              background: "#7f1d1d",
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div className="badgeSoft">🎓 Admin</div>
        <h1 style={{ margin: "8px 0 0" }}>Manage Events / Classes</h1>
      </div>

      {err ? (
        <div className="kidCard" style={{ padding: 12, color: "#b00020" }}>
          {err}
        </div>
      ) : null}

      {info ? (
        <div className="kidCard" style={{ padding: 12, color: "#0a6b2b" }}>
          {info}
        </div>
      ) : null}

      <form
        onSubmit={submitForm}
        className="kidCard"
        style={{ padding: 16, display: "grid", gap: 10, maxWidth: 720 }}
      >
        <div style={{ fontWeight: 900 }}>
          {editingId ? "✏️ Update Class / Event" : "➕ Add New Class / Event"}
        </div>

        <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
          <option value="CLASS">CLASS</option>
          <option value="EVENT">EVENT</option>
        </select>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ resize: "vertical" }}
        />

        <input
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            type="number"
            min="0"
            placeholder="Minimum Age"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
          />
          <input
            type="number"
            min="0"
            placeholder="Maximum Age"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
          />
        </div>

        <input
          type="number"
          min="0"
          placeholder="Fee (LKR)"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
        />

        <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>
          <option value="">Select Instructor</option>
          {instructors.map((ins) => (
            <option key={ins.id} value={ins.id}>
              {ins.full_name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={eventDate}
          min={new Date().toISOString().split("T")[0]}
          onChange={(e) => setEventDate(e.target.value)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="kidBtn" disabled={busy} type="submit">
            {busy ? (editingId ? "Updating..." : "Creating...") : editingId ? "Update" : "Create"}
          </button>

          {editingId ? (
            <button
              type="button"
              className="kidBtn"
              onClick={resetForm}
              style={{ background: "#6b7280" }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="kidCard" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>📋 Events / Classes</div>
        <SimpleTable columns={cols} rows={rows} />
      </div>
    </div>
  );
}