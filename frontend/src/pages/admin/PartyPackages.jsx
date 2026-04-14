import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function getStatusClassName(value) {
  const v = String(value || "").toLowerCase();
  if (v === "active") return "active";
  if (v === "inactive") return "inactive";
  return "";
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
          <h2 className="instructorPageTitle">Manage Party Packages</h2>
          <p className="adminPageTitleSub">
            Create, update, activate, and manage party packages.
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
              {editingId ? "Update Party Package" : "Add New Party Package"}
            </h3>
            <p className="adminCardText">
              
            </p>
          </div>
        </div>

        <div className="adminFormGrid">
          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Package code</span>
              <input
                className="adminInput"
                placeholder="Package Code (ex: Package 01)"
                value={packageCode}
                onChange={(e) => setPackageCode(e.target.value)}
              />
            </label>

            <label className="adminField">
              <span className="adminFieldLabel">Package name</span>
              <input
                className="adminInput"
                placeholder="Package Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </div>

          <label className="adminField">
            <span className="adminFieldLabel">Short description</span>
            <textarea
              className="adminTextarea"
              placeholder="Short Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </label>

          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Price (LKR)</span>
              <input
                className="adminInput"
                type="number"
                min="0"
                placeholder="Price (LKR)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>

            <label className="adminField">
              <span className="adminFieldLabel">Maximum children</span>
              <input
                className="adminInput"
                type="number"
                min="1"
                placeholder="Maximum Children"
                value={maxChildren}
                onChange={(e) => setMaxChildren(e.target.value)}
              />
            </label>
          </div>

          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Duration text</span>
              <input
                className="adminInput"
                placeholder="Duration Text"
                value={durationText}
                onChange={(e) => setDurationText(e.target.value)}
              />
            </label>

            <label className="adminField">
              <span className="adminFieldLabel">Badge text</span>
              <input
                className="adminInput"
                placeholder="Badge Text (ex: Premium)"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
              />
            </label>
          </div>

          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Sort order</span>
              <input
                className="adminInput"
                type="number"
                min="0"
                placeholder="Sort Order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </label>

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

          <label className="adminCheckboxRow">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <span>Mark as featured package</span>
          </label>

          <label className="adminField">
            <span className="adminFieldLabel">Features</span>
            <textarea
              className="adminTextarea"
              placeholder="Features (one feature per line)"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              rows={8}
            />
          </label>

          <div className="adminButtonRow">
            <button className="adminPrimaryButton" type="submit" disabled={busy}>
              {busy
                ? editingId
                  ? "Updating..."
                  : "Saving..."
                : editingId
                ? "Update Package"
                : "Create Package"}
            </button>

            {editingId ? (
              <button
                type="button"
                className="adminGhostButton"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </div>
      </form>

      <div className="instructorContentCard adminTableCard">
        <div className="adminTableToolbar">
          <div className="adminTableTitleGroup">
            <h3 className="adminTableTitle">Party Packages</h3>
            <p className="adminTableText">Existing package records and status.</p>
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