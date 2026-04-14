import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

function getStatusClassName(value) {
  const v = String(value || "").toLowerCase();
  if (v === "active") return "active";
  if (v === "inactive") return "inactive";
  return "";
}

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
          (editingId ? "Failed to update play area" : "Failed to create play area")
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
      setErr(e?.response?.data?.message || "Failed to update play area status");
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
          <a className="adminTextLink" href={r.image_url} target="_blank" rel="noreferrer">
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
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className={`adminStatusPill ${getStatusClassName(r.status)}`}>
          {r.status || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="adminActionGroup">
          <button
            type="button"
            className="adminActionButton adminActionButtonNeutral"
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
            onClick={() => toggleStatus(r)}
          >
            {r.status === "ACTIVE" ? "Inactivate" : "Activate"}
          </button>

          <button
            type="button"
            className="adminActionButton adminActionButtonDanger"
            onClick={() => deleteRow(r)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="instructorPage adminPageStack">
      <div className="instructorPageHeader adminPageHeader">
        <div className="adminPageTitleBlock">
          <h2 className="instructorPageTitle">Manage Play Area</h2>
          <p className="adminPageTitleSub">
            Create, edit, activate, and manage play area records.
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
              {editingId ? "Update Play Area" : "Add New Play Area"}
            </h3>
            <p className="adminCardText">
             
            </p>
          </div>
        </div>

        <div className="adminFormGrid">
          <label className="adminField">
            <span className="adminFieldLabel">Name</span>
            <input
              className="adminInput"
              placeholder="Enter play area name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <span className="adminFieldLabel">Age group</span>
            <input
              className="adminInput"
              placeholder="Example: 4-7 years"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            />
          </label>

          <label className="adminField">
            <span className="adminFieldLabel">Image URL</span>
            <input
              className="adminInput"
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </label>

          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Capacity</span>
              <input
                className="adminInput"
                type="number"
                min="1"
                placeholder="Capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </label>

            <label className="adminField">
              <span className="adminFieldLabel">Price (LKR)</span>
              <input
                className="adminInput"
                type="number"
                min="1"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
          </div>

          <label className="adminField adminFieldCompact">
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
            <h3 className="adminTableTitle">Play Areas</h3>
            <p className="adminTableText">Existing play area records.</p>
          </div>

          <button className="adminGhostButton" onClick={load} type="button">
            Refresh
          </button>
        </div>

        <div className="adminTableWrap">
          <SimpleTable columns={cols} rows={rows} />
        </div>
      </div>
    </div>
  );
}