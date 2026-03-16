import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

export default function AdminPlayArea() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setAgeGroup("");
    setImageUrl("");
    setCapacity("");
    setPrice("");
    setStatus("ACTIVE");
  };

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

  const submitForm = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!name.trim()) return setErr("Name is required");
    if (capacity === "" || Number(capacity) <= 0) {
      return setErr("Capacity must be greater than 0");
    }
    if (price === "" || Number(price) <= 0) {
      return setErr("Price must be greater than 0");
    }

    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        age_group: ageGroup.trim(),
        image_url: imageUrl.trim(),
        capacity: Number(capacity),
        price: Number(price),
        status,
      };

      if (editingId) {
        await api.put(`/api/admin/play-areas/${editingId}`, payload);
        setInfo("Play area updated successfully");
      } else {
        await api.post("/api/admin/play-areas", payload);
        setInfo("Play area created successfully");
      }

      resetForm();
      await load();
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          (editingId
            ? "Failed to update play area"
            : "Failed to create play area")
      );
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row) => {
    setErr("");
    setInfo("");
    setEditingId(row.id);
    setName(row.name || "");
    setDescription(row.description || "");
    setAgeGroup(row.age_group || "");
    setImageUrl(row.image_url || "");
    setCapacity(row.capacity ?? "");
    setPrice(row.price ?? "");
    setStatus(row.status || "ACTIVE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (row) => {
    const nextStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setErr("");
    setInfo("");

    try {
      await api.patch(`/api/admin/play-areas/${row.id}/status`, {
        status: nextStatus,
      });

      setInfo(`Play area marked as ${nextStatus}`);
      await load();
    } catch (e) {
      setErr(
        e?.response?.data?.message || "Failed to update play area status"
      );
    }
  };

  const deleteRow = async (row) => {
    const ok = window.confirm(
      `Are you sure you want to delete this play area?\n\n${row.name}`
    );
    if (!ok) return;

    setErr("");
    setInfo("");

    try {
      await api.delete(`/api/admin/play-areas/${row.id}`);
      setInfo("Play area deleted successfully");

      if (editingId === row.id) {
        resetForm();
      }

      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete play area");
    }
  };

  const cols = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
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
    { key: "age_group", header: "Age Group" },
    { key: "capacity", header: "Capacity" },
    {
      key: "price",
      header: "Price",
      render: (r) => `LKR ${Number(r.price || 0).toFixed(2)}`,
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
        <div className="badgeSoft">🛝 Admin</div>
        <h1 style={{ margin: "8px 0 0" }}>Manage Play Area</h1>
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
          {editingId ? "✏️ Update Play Area" : "➕ Add New Play Area"}
        </div>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />

        <input
          placeholder="Age Group (example: 4-7 years)"
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
        />

        <input
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />

        <input
          type="number"
          min="1"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />

        <input
          type="number"
          min="1"
          placeholder="Price (LKR)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="kidBtn" disabled={busy} type="submit">
            {busy
              ? editingId
                ? "Updating..."
                : "Creating..."
              : editingId
              ? "Update"
              : "Create"}
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
        <div style={{ fontWeight: 900, marginBottom: 10 }}>📋 Play Areas</div>
        <SimpleTable columns={cols} rows={rows} />
      </div>
    </div>
  );
}