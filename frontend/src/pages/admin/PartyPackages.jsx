import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

export default function AdminPartyPackages() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [packageCode, setPackageCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [maxChildren, setMaxChildren] = useState("");
  const [durationText, setDurationText] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [sortOrder, setSortOrder] = useState("");
  const [featuresText, setFeaturesText] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const resetForm = () => {
    setEditingId(null);
    setPackageCode("");
    setName("");
    setDescription("");
    setPrice("");
    setMaxChildren("");
    setDurationText("");
    setBadgeText("");
    setIsFeatured(false);
    setSortOrder("");
    setFeaturesText("");
    setStatus("ACTIVE");
  };

  const load = async () => {
    setErr("");
    try {
      const res = await api.get("/api/admin/party-packages");
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load party packages");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitForm = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!packageCode.trim()) return setErr("Package code is required");
    if (!name.trim()) return setErr("Package name is required");
    if (price === "" || Number(price) < 0) {
      return setErr("Price must be 0 or more");
    }
    if (maxChildren === "" || Number(maxChildren) <= 0) {
      return setErr("Maximum children must be greater than 0");
    }

    setBusy(true);
    try {
      const payload = {
        package_code: packageCode.trim(),
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        max_children: Number(maxChildren),
        duration_text: durationText.trim(),
        badge_text: badgeText.trim(),
        is_featured: isFeatured ? 1 : 0,
        sort_order: sortOrder === "" ? 0 : Number(sortOrder),
        features: featuresText,
        status,
      };

      if (editingId) {
        await api.put(`/api/admin/party-packages/${editingId}`, payload);
        setInfo("Party package updated successfully");
      } else {
        await api.post("/api/admin/party-packages", payload);
        setInfo("Party package created successfully");
      }

      resetForm();
      await load();
    } catch (e2) {
      setErr(
        e2?.response?.data?.message ||
          (editingId
            ? "Failed to update party package"
            : "Failed to create party package")
      );
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row) => {
    setErr("");
    setInfo("");
    setEditingId(row.id);
    setPackageCode(row.package_code || "");
    setName(row.name || "");
    setDescription(row.description || "");
    setPrice(row.price ?? "");
    setMaxChildren(row.max_children ?? "");
    setDurationText(row.duration_text || "");
    setBadgeText(row.badge_text || "");
    setIsFeatured(Boolean(row.is_featured));
    setSortOrder(row.sort_order ?? "");
    setFeaturesText(Array.isArray(row.features) ? row.features.join("\n") : "");
    setStatus(row.status || "ACTIVE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleStatus = async (row) => {
    const nextStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setErr("");
    setInfo("");
    try {
      await api.patch(`/api/admin/party-packages/${row.id}/status`, {
        status: nextStatus,
      });
      setInfo(`Party package marked as ${nextStatus}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update status");
    }
  };

  const deleteRow = async (row) => {
    const ok = window.confirm(
      `Are you sure you want to delete this party package?\n\n${row.name}`
    );
    if (!ok) return;

    setErr("");
    setInfo("");
    try {
      await api.delete(`/api/admin/party-packages/${row.id}`);
      setInfo("Party package deleted successfully");

      if (editingId === row.id) {
        resetForm();
      }

      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete party package");
    }
  };

  const cols = [
    { key: "id", header: "ID" },
    { key: "package_code", header: "Package Code" },
    { key: "name", header: "Package Name" },
    {
      key: "price",
      header: "Price",
      render: (r) => `LKR ${formatMoney(r.price)}`,
    },
    { key: "max_children", header: "Max Children" },
    { key: "duration_text", header: "Duration" },
    {
      key: "featured",
      header: "Featured",
      render: (r) => (r.is_featured ? "Yes" : "No"),
    },
    { key: "sort_order", header: "Sort Order" },
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
            style={{ padding: "8px 12px", background: "#7f1d1d" }}
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
        <div className="badgeSoft">🎉 Admin</div>
        <h1 style={{ margin: "8px 0 0" }}>Manage Party Packages</h1>
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
        style={{ padding: 16, display: "grid", gap: 10, maxWidth: 760 }}
      >
        <div style={{ fontWeight: 900 }}>
          {editingId ? "✏️ Update Party Package" : "➕ Add New Party Package"}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            placeholder="Package Code (ex: Package 01)"
            value={packageCode}
            onChange={(e) => setPackageCode(e.target.value)}
          />
          <input
            placeholder="Package Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <textarea
          placeholder="Short Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ resize: "vertical" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            type="number"
            min="0"
            placeholder="Price (LKR)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            type="number"
            min="1"
            placeholder="Maximum Children"
            value={maxChildren}
            onChange={(e) => setMaxChildren(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            placeholder="Duration Text"
            value={durationText}
            onChange={(e) => setDurationText(e.target.value)}
          />
          <input
            placeholder="Badge Text (ex: Premium)"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input
            type="number"
            min="0"
            placeholder="Sort Order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
          />
          Mark as featured package
        </label>

        <textarea
          placeholder="Features (one feature per line)"
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          rows={8}
          style={{ resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="kidBtn" type="submit" disabled={busy}>
            {busy
              ? editingId
                ? "Updating..."
                : "Saving..."
              : editingId
              ? "Update Package"
              : "Create Package"}
          </button>

          {editingId ? (
            <button type="button" className="kidBtn ghost" onClick={resetForm}>
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      <SimpleTable columns={cols} rows={rows} />
    </div>
  );
}