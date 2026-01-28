import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";

import {
  listInquiriesApi,
  assignInquiryApi,
  updateInquiryStatusApi,
  addFollowupApi,
  listFollowupsApi,
} from "../../api/inquiryApi";

const STATUS = ["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "CLOSED"];

export default function InquiriesManager({ title = "Customer Inquiries" }) {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [followups, setFollowups] = useState([]);

  const [assignedTo, setAssignedTo] = useState("");
  const [newStatus, setNewStatus] = useState("NEW");
  const [note, setNote] = useState("");
  const [followupDate, setFollowupDate] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setErr("");
    setInfo("");
    setLoading(true);
    try {
      const res = await listInquiriesApi();
      setRows(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const loadFollowups = async (inquiryId) => {
    try {
      const res = await listFollowupsApi(inquiryId);
      setFollowups(res.data || []);
    } catch {
      setFollowups([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSelect = async (r) => {
    setSelected(r);
    setAssignedTo(r.assigned_to ?? "");
    setNewStatus(r.status ?? "NEW");
    setNote("");
    setFollowupDate("");
    await loadFollowups(r.id);
  };

  const onAssign = async () => {
    if (!selected) return;
    if (!assignedTo) return setErr("assigned_to is required (enter a staff user id)");
    setErr("");
    setInfo("");
    try {
      await assignInquiryApi(selected.id, { assigned_to: Number(assignedTo) });
      setInfo("Assigned successfully");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Assign failed");
    }
  };

  const onStatus = async () => {
    if (!selected) return;
    setErr("");
    setInfo("");
    try {
      await updateInquiryStatusApi(selected.id, { status: newStatus });
      setInfo("Status updated");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Status update failed");
    }
  };

  const onAddFollowup = async () => {
    if (!selected) return;
    if (!note.trim()) return setErr("Follow-up note is required");
    setErr("");
    setInfo("");
    try {
      await addFollowupApi(selected.id, {
        note: note.trim(),
        followup_date: followupDate || null,
      });
      setInfo("Follow-up added");
      setNote("");
      setFollowupDate("");
      await loadFollowups(selected.id);
    } catch (e) {
      setErr(e?.response?.data?.message || "Follow-up failed");
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "customer_name", header: "Customer" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "inquiry_type", header: "Type" },
    { key: "status", header: "Status" },
    { key: "assigned_to", header: "Assigned To" },
    {
      key: "action",
      header: "Action",
      render: (r) => (
        <button onClick={() => onSelect(r)} style={{ padding: "6px 10px" }}>
          Open
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div style={{ color: "#666", marginTop: 6 }}>
          View inquiries, assign to staff, update status, and add follow-ups.
        </div>
      </div>

      {err ? (
        <div style={{ background: "#fff0f0", border: "1px solid #ffd6d6", padding: 12, borderRadius: 12, color: "#b00020" }}>
          {err}
        </div>
      ) : null}

      {info ? (
        <div style={{ background: "#f0fff4", border: "1px solid #b7ebc6", padding: 12, borderRadius: 12, color: "#0a6b2b" }}>
          {info}
        </div>
      ) : null}

      <SimpleTable columns={columns} rows={rows} />

      {loading ? <div style={{ color: "#777" }}>Loading…</div> : null}

      {/* Detail panel */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Selected Inquiry</div>
          {!selected ? (
            <div style={{ color: "#777" }}>Click “Open” on an inquiry.</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <div><b>ID:</b> {selected.id}</div>
              <div><b>Customer:</b> {selected.customer_name}</div>
              <div><b>Phone:</b> {selected.phone}</div>
              <div><b>Email:</b> {selected.email || "-"}</div>
              <div><b>Message:</b> {selected.message || "-"}</div>

              <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "10px 0" }} />

              <div style={{ display: "grid", gap: 8 }}>
                <label style={{ fontSize: 12, color: "#666" }}>Assign to staff (user id)</label>
                <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="e.g. 2" />
                <button onClick={onAssign}>Assign</button>
              </div>

              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                <label style={{ fontSize: 12, color: "#666" }}>Update Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {STATUS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button onClick={onStatus}>Update Status</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Follow-ups</div>

          {!selected ? (
            <div style={{ color: "#777" }}>Select an inquiry first.</div>
          ) : (
            <>
              <div style={{ display: "grid", gap: 8 }}>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write follow-up note..."
                  rows={4}
                />
                <input
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  type="date"
                />
                <button onClick={onAddFollowup}>Add Follow-up</button>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                {(followups || []).length ? (
                  followups.map((f) => (
                    <div key={f.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 10 }}>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {f.staff_name || `user ${f.user_id}`} • {f.followup_date || "No date"} • {new Date(f.created_at).toLocaleString()}
                      </div>
                      <div style={{ marginTop: 6 }}>{f.note}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#777" }}>No follow-ups yet.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <button onClick={load} style={{ width: 160 }}>
        Refresh
      </button>
    </div>
  );
}
