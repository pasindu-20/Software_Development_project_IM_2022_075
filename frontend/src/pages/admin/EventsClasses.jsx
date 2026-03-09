import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

export default function AdminEventsClasses() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const [itemType, setItemType] = useState("CLASS");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [fee, setFee] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const load = async () => {
    setErr("");
    try {
      const res = await api.get("/api/admin/events-classes");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load events/classes");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!title.trim()) return setErr("Title is required");
    if (ageMin === "" || Number(ageMin) < 0) return setErr("Minimum age must be 0 or more");
    if (ageMax === "" || Number(ageMax) < Number(ageMin)) return setErr("Maximum age must be greater than or equal to minimum age");
    if (fee === "" || Number(fee) < 0) return setErr("Fee must be 0 or more");

    setBusy(true);
    try {
      await api.post("/api/admin/events-classes", {
        item_type: itemType,
        title: title.trim(),
        description: description.trim(),
        age_min: Number(ageMin),
        age_max: Number(ageMax),
        fee: Number(fee),
        status,
      });

      setInfo("Class / Event created successfully");
      setItemType("CLASS");
      setTitle("");
      setDescription("");
      setAgeMin("");
      setAgeMax("");
      setFee("");
      setStatus("ACTIVE");
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create class / event");
    } finally {
      setBusy(false);
    }
  };

  const cols = [
    { key: "id", header: "ID" },
    { key: "item_type", header: "Type" },
    { key: "title", header: "Title" },
    { key: "description", header: "Description" },
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
    { key: "total_enrollments", header: "Enrollments" },
    { key: "status", header: "Status" },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div className="badgeSoft">🎓 Admin</div>
        <h1 style={{ margin: "8px 0 0" }}>Manage Events / Classes</h1>
      </div>

      {err ? <div className="kidCard" style={{ padding: 12, color: "#b00020" }}>{err}</div> : null}
      {info ? <div className="kidCard" style={{ padding: 12, color: "#0a6b2b" }}>{info}</div> : null}

      <form onSubmit={create} className="kidCard" style={{ padding: 16, display: "grid", gap: 10, maxWidth: 720 }}>
        <div style={{ fontWeight: 900 }}>➕ Add New Class / Event</div>

        <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
          <option value="CLASS">CLASS</option>
          <option value="EVENT">EVENT</option>
        </select>

        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          style={{ resize: "vertical" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input type="number" min="0" placeholder="Minimum Age" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} />
          <input type="number" min="0" placeholder="Maximum Age" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} />
        </div>

        <input type="number" min="0" placeholder="Fee (LKR)" value={fee} onChange={(e) => setFee(e.target.value)} />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <button className="kidBtn" disabled={busy} type="submit">
          {busy ? "Creating..." : "Create"}
        </button>
      </form>

      <div className="kidCard" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>📋 Events / Classes</div>
        <SimpleTable columns={cols} rows={rows} />
      </div>
    </div>
  );
}