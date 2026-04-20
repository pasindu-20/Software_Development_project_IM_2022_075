import { useEffect, useState } from "react";
import api from "../../api/axios";

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getStatusClassName(value) {
  const v = String(value || "").toLowerCase();
  if (v === "active") return "active";
  if (v === "inactive") return "inactive";
  return "";
}

function getDayNameFromDate(dateValue) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function getScheduleLabel(row) {
  if (row.item_type === "CLASS") {
    return row.schedule_text || getDayNameFromDate(row.event_date) || "-";
  }

  return row.event_date ? String(row.event_date).slice(0, 10) : "-";
}

const headerCellStyle = {
  textAlign: "left",
  padding: "12px 10px",
  fontSize: 12,
  color: "#334155",
  borderBottom: "1px solid #eee",
  whiteSpace: "nowrap",
  verticalAlign: "top",
};

const bodyCellStyle = {
  padding: "12px 10px",
  fontSize: 13,
  color: "#0f172a",
  verticalAlign: "top",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

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
  const [scheduleDay, setScheduleDay] = useState("");
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
    setScheduleDay("");
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
    if (itemType === "CLASS" && !scheduleDay) return "Day is required for classes";
    if (itemType === "EVENT" && !eventDate) return "Date is required for events";
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
        schedule_text: itemType === "CLASS" ? scheduleDay : null,
        event_date: itemType === "EVENT" ? eventDate : null,
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
          (editingId
            ? "Failed to update class / event"
            : "Failed to create class / event")
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
    setScheduleDay(row.schedule_text || getDayNameFromDate(row.event_date) || "");
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
      `Are you sure you want to delete this ${
        row.item_type?.toLowerCase() || "item"
      }?\n\n${row.title}`
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

  return (
    <div className="instructorPage adminPageStack">
      <div className="instructorPageHeader adminPageHeader">
        <div className="adminPageTitleBlock">
          <h2 className="instructorPageTitle">Manage Events / Classes</h2>
          <p className="adminPageTitleSub">
            Create, update, activate, and manage class and event records.
          </p>
        </div>
      </div>

      {err ? <div className="adminNotice adminNoticeError">{err}</div> : null}
      {info ? <div className="adminNotice adminNoticeSuccess">{info}</div> : null}

      <form
        onSubmit={submitForm}
        className="instructorContentCard adminFormCard adminFormWide"
      >
        <div className="adminCardHeader">
          <div>
            <h3 className="adminCardTitle">
              {editingId ? "Update Class / Event" : "Add New Class / Event"}
            </h3>
            <p className="adminCardText"></p>
          </div>
        </div>

        <div className="adminFormGrid">
          <label className="adminField">
            <span className="adminFieldLabel">Item type</span>
            <select
              className="adminSelect"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
            >
              <option value="CLASS">CLASS</option>
              <option value="EVENT">EVENT</option>
            </select>
          </label>

          <label className="adminField">
            <span className="adminFieldLabel">Title</span>
            <input
              className="adminInput"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="adminField">
            <span className="adminFieldLabel">Description</span>
            <textarea
              className="adminTextarea"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>

          <label className="adminField">
            <span className="adminFieldLabel">Image URL</span>
            <input
              className="adminInput"
              type="text"
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </label>

          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Minimum age</span>
              <input
                className="adminInput"
                type="number"
                min="0"
                placeholder="Minimum age"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
              />
            </label>

            <label className="adminField">
              <span className="adminFieldLabel">Maximum age</span>
              <input
                className="adminInput"
                type="number"
                min="0"
                placeholder="Maximum age"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
              />
            </label>
          </div>

          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Fee (LKR)</span>
              <input
                className="adminInput"
                type="number"
                min="0"
                placeholder="Fee"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </label>

            <label className="adminField">
              <span className="adminFieldLabel">Instructor</span>
              <select
                className="adminSelect"
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
              >
                <option value="">Select Instructor</option>
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.full_name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="adminFormGrid2">
            {itemType === "CLASS" ? (
              <label className="adminField">
                <span className="adminFieldLabel">Day</span>
                <select
                  className="adminSelect"
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(e.target.value)}
                >
                  <option value="">Select Day</option>
                  {WEEK_DAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="adminField">
                <span className="adminFieldLabel">Date</span>
                <input
                  className="adminInput"
                  type="date"
                  value={eventDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </label>
            )}

            <label className="adminField">
              <span className="adminFieldLabel">Status</span>
              <select
                className="adminSelect"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>
          </div>

          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Start time</span>
              <input
                className="adminInput"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>

            <label className="adminField">
              <span className="adminFieldLabel">End time</span>
              <input
                className="adminInput"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>

          <div className="adminButtonRow">
            <button className="adminPrimaryButton" disabled={busy} type="submit">
              {busy ? (editingId ? "Updating..." : "Creating...") : editingId ? "Update" : "Create"}
            </button>

            {editingId ? (
              <button
                type="button"
                className="adminGhostButton"
                onClick={resetForm}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="instructorContentCard adminTableCard">
        <div className="adminTableToolbar">
          <div className="adminTableTitleGroup">
            <h3 className="adminTableTitle">Events / Classes</h3>
            <p className="adminTableText">Existing class and event records.</p>
          </div>

          <button className="adminGhostButton" onClick={load} type="button">
            Refresh
          </button>
        </div>

        <div className="adminTableWrap">
          <div
            style={{
              overflowX: "auto",
              width: "100%",
              maxWidth: "100%",
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 12,
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: "4%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "13%" }} />
              </colgroup>

              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={headerCellStyle}>ID</th>
                  <th style={headerCellStyle}>Type</th>
                  <th style={headerCellStyle}>Title</th>
                  <th style={headerCellStyle}>Description</th>
                  <th style={headerCellStyle}>Image URL</th>
                  <th style={headerCellStyle}>Age Range</th>
                  <th style={headerCellStyle}>Fee</th>
                  <th style={headerCellStyle}>Instructor</th>
                  <th style={headerCellStyle}>Day / Date</th>
                  <th style={headerCellStyle}>Start Time</th>
                  <th style={headerCellStyle}>End Time</th>
                  <th style={headerCellStyle}>Status</th>
                  <th style={headerCellStyle}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ padding: 14, color: "#64748b" }}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr key={r.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ ...bodyCellStyle, whiteSpace: "nowrap" }}>{r.id ?? "-"}</td>
                      <td style={{ ...bodyCellStyle, whiteSpace: "nowrap" }}>{r.item_type || "-"}</td>
                      <td style={bodyCellStyle}>{r.title || "-"}</td>
                      <td style={bodyCellStyle}>{r.description || "-"}</td>
                      <td style={bodyCellStyle}>
                        {r.image_url ? (
                          <a
                            className="adminTextLink"
                            href={r.image_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Image
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ ...bodyCellStyle, whiteSpace: "nowrap" }}>
                        {`${r.age_min ?? "-"} - ${r.age_max ?? "-"}`}
                      </td>
                      <td style={bodyCellStyle}>{`LKR ${Number(r.fee || 0).toFixed(2)}`}</td>
                      <td style={bodyCellStyle}>{r.instructor_name || "-"}</td>
                      <td style={bodyCellStyle}>{getScheduleLabel(r)}</td>
                      <td style={{ ...bodyCellStyle, whiteSpace: "nowrap" }}>
                        {r.start_time ? String(r.start_time).slice(0, 5) : "-"}
                      </td>
                      <td style={{ ...bodyCellStyle, whiteSpace: "nowrap" }}>
                        {r.end_time ? String(r.end_time).slice(0, 5) : "-"}
                      </td>
                      <td style={{ ...bodyCellStyle, whiteSpace: "nowrap" }}>
                        <span className={`adminStatusPill ${getStatusClassName(r.status)}`}>
                          {r.status || "-"}
                        </span>
                      </td>
                      <td style={bodyCellStyle}>
                        <div
                          className="adminActionGroup"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                            flexWrap: "nowrap",
                          }}
                        >
                          <button
                            type="button"
                            className="adminActionButton adminActionButtonNeutral"
                            style={{
                              width: "100%",
                              minHeight: 34,
                              padding: "0 10px",
                              fontSize: 13,
                            }}
                            onClick={() => startEdit(r)}
                          >
                            Update
                          </button>

                          <button
                            type="button"
                            className={`adminActionButton ${
                              r.status === "ACTIVE"
                                ? "adminActionButtonDanger"
                                : "adminActionButtonSuccess"
                            }`}
                            style={{
                              width: "100%",
                              minHeight: 34,
                              padding: "0 10px",
                              fontSize: 13,
                            }}
                            onClick={() => toggleStatus(r)}
                          >
                            {r.status === "ACTIVE" ? "Inactivate" : "Activate"}
                          </button>

                          <button
                            type="button"
                            className="adminActionButton adminActionButtonDanger"
                            style={{
                              width: "100%",
                              minHeight: 34,
                              padding: "0 10px",
                              fontSize: 13,
                            }}
                            onClick={() => deleteRow(r)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}