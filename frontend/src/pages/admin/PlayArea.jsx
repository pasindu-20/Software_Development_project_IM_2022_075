import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

export default function AdminPlayArea() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");

  const load = async () => {
    setErr("");
    try {
      // Backend endpoint should be: GET /api/admin/play-areas (we’ll align later)
      const res = await api.get("/api/admin/play-areas");
      setRows(res.data || []);
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
    if (!capacity || Number(capacity) <= 0) return setErr("Capacity must be a positive number");
    if (!price || Number(price) <= 0) return setErr("Price must be a positive number");

    setBusy(true);
    try {
      await api.post("/api/admin/play-areas", {
        name: name.trim(),
        capacity: Number(capacity),
        price: Number(price),
      });

      setInfo("Play area created");
      setName("");
      setCapacity("");
      setPrice("");
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create play area");
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Play Area" },
    { key: "capacity", header: "Capacity" },
    {
      key: "price",
      header: "Price",
      render: (r) => `LKR ${Number(r.price || 0).toFixed(2)}`,
    },
    { key: "status", header: "Status" },
    {
      key: "created_at",
      header: "Created",
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "-"),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <div className="badgeSoft">🎠 Admin</div>
          <h1 style={{ margin: "8px 0 0" }}>Manage Play Area</h1>
          <div style={{ opacity: 0.75, fontWeight: 600 }}>
            Create and view play areas (capacity, pricing). 
          </div>
        </div>

        <button className="kidBtnGhost" onClick={load}>
          Refresh
        </button>
      </div>

      {err ? (
        <div className="kidCard" style={{ padding: 12, border: "1px solid #ffd6d6", background: "#fff0f0", color: "#b00020", fontWeight: 700 }}>
          {err}
        </div>
      ) : null}

      {info ? (
        <div className="kidCard" style={{ padding: 12, border: "1px solid #b7ebc6", background: "#f0fff4", color: "#0a6b2b", fontWeight: 700 }}>
          {info}
        </div>
      ) : null}

      <motion.form
        onSubmit={create}
        className="kidCard"
        style={{ padding: 16, display: "grid", gap: 10, maxWidth: 640 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ fontWeight: 900 }}>➕ Create Play Area</div>

        <input placeholder="Play area name (e.g., Indoor Play Zone)" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Capacity (e.g., 20)" value={capacity} onChange={(e) => setCapacity(e.target.value)} type="number" min="1" />
        <input placeholder="Price (LKR) (e.g., 2500)" value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="1" />

        <button className="kidBtn" disabled={busy} type="submit">
          {busy ? "Creating..." : "Create"}
        </button>
        
      </motion.form>

      <div className="kidCard" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>📋 Play Areas</div>
        <SimpleTable columns={columns} rows={rows} />
      </div>
    </div>
  );
}
