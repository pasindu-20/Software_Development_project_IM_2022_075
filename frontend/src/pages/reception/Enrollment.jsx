import { useEffect, useState } from "react";
import { createEnrollmentApi, listEnrollmentsApi } from "../../api/receptionApi";

export default function RecEnrollment() {
  const [rows, setRows] = useState([]);
  const [child_name, setChildName] = useState("");
  const [guardian_name, setGuardianName] = useState("");
  const [guardian_phone, setGuardianPhone] = useState("");
  const [class_id, setClassId] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await listEnrollmentsApi();
      setRows(res.data || []);
    } catch {
      setRows([]);
      setErr("API not ready: GET /api/reception/enrollments");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!child_name || !guardian_name || !guardian_phone || !class_id) {
      return setErr("All fields are required (child, guardian, phone, class id).");
    }

    setBusy(true);
    try {
      await createEnrollmentApi({ child_name, guardian_name, guardian_phone, class_id });
      setInfo("Enrollment created.");
      setChildName("");
      setGuardianName("");
      setGuardianPhone("");
      setClassId("");
      await load();
    } catch {
      setErr("API not ready: POST /api/reception/enrollments");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Manage Enrollment</h2>

      <form onSubmit={submit} style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 10, maxWidth: 680 }}>
        <div style={{ fontWeight: 700 }}>Create Enrollment</div>

        <input placeholder="Child name" value={child_name} onChange={(e) => setChildName(e.target.value)} />
        <input placeholder="Guardian name" value={guardian_name} onChange={(e) => setGuardianName(e.target.value)} />
        <input placeholder="Guardian phone" value={guardian_phone} onChange={(e) => setGuardianPhone(e.target.value)} />
        <input placeholder="Class ID (for now)" value={class_id} onChange={(e) => setClassId(e.target.value)} />

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {info && <div style={{ color: "green" }}>{info}</div>}

        <button disabled={busy} type="submit">
          {busy ? "Saving…" : "Create Enrollment"}
        </button>
      </form>

      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>Enrollments</div>

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#666" }}>No enrollments found.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>ID</th>
                <th>Child</th>
                <th>Guardian</th>
                <th>Phone</th>
                <th>Class</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.child_name || "—"}</td>
                  <td>{r.guardian_name || "—"}</td>
                  <td>{r.guardian_phone || "—"}</td>
                  <td>{r.class_id || "—"}</td>
                  <td>{r.status || "ACTIVE"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
