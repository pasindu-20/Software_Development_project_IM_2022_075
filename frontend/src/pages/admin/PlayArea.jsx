import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

export default function AdminPlayArea() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const load = async () => {
    setErr("");
    try {
      const res = await api.get("/api/admin/play-areas");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load play areas");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!name.trim()) return setErr("Name is required");
    if (capacity === "" || Number(capacity) <= 0) return setErr("Capacity must be greater than 0");
    if (price === "" || Number(price) <= 0) return setErr("Price must be greater than 0");

    setBusy(true);
    try {
      await api.post("/api/admin/play-areas", {
        name: name.trim(),
        description: description.trim(),
        age_group: ageGroup.trim(),
        image_url: imageUrl.trim(),
        capacity: Number(capacity),
        price: Number(price),
        status,
      });

      setInfo("Play area created successfully");
      setName("");
      setDescription("");
      setAgeGroup("");
      setImageUrl("");
      setCapacity("");
      setPrice("");
      setStatus("ACTIVE");
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create play area");
    } finally {
      setBusy(false);
    }
  };

  const cols = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "age_group", header: "Age Group" },
    { key: "capacity", header: "Capacity" },
    { key: "price", header: "Price", render: (r) => `LKR ${Number(r.price || 0).toFixed(2)}` },
    { key: "status", header: "Status" },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <div className="badgeSoft">🛝 Admin</div>
        <h1 style={{ margin: "8px 0 0" }}>Manage Play Area</h1>
      </div>

      {err ? <div className="kidCard" style={{ padding: 12, color: "#b00020" }}>{err}</div> : null}
      {info ? <div className="kidCard" style={{ padding: 12, color: "#0a6b2b" }}>{info}</div> : null}

      <form onSubmit={create} className="kidCard" style={{ padding: 16, display: "grid", gap: 10, maxWidth: 720 }}>
        <div style={{ fontWeight: 900 }}>➕ Add New Play Area</div>

        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        <input placeholder="Age Group (example: 4-7 years)" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} />
        <input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <input type="number" min="1" placeholder="Capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        <input type="number" min="1" placeholder="Price (LKR)" value={price} onChange={(e) => setPrice(e.target.value)} />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <button className="kidBtn" disabled={busy} type="submit">
          {busy ? "Creating..." : "Create"}
        </button>
      </form>

      <div className="kidCard" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>📋 Play Areas</div>
        <SimpleTable columns={cols} rows={rows} />
      </div>
    </div>
  );
}