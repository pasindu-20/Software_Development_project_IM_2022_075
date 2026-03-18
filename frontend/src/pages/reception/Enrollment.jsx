import { useEffect, useState } from "react";
import { createEnrollmentApi, listEnrollmentsApi } from "../../api/receptionApi";
import { listPublicClassesApi } from "../../api/publicApi";

export default function RecEnrollment() {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [child_id, setChildId] = useState("");
  const [class_id, setClassId] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
    loadClasses();
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await listEnrollmentsApi();
      setRows(res.data || []);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await listPublicClassesApi();
      setClasses(res.data || []);
    } catch {
      setClasses([]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!child_id || !class_id) {
      return setErr("child_id and class_id are required.");
    }

    setBusy(true);
    try {
      await createEnrollmentApi({
        child_id: Number(child_id),
        class_id: Number(class_id),
      });

      setInfo("Enrollment created.");
      setChildId("");
      setClassId("");
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create enrollment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Manage Enrollment</h2>

      <form
        onSubmit={submit}
        style={{
          background: "white",
          padding: 16,
          borderRadius: 12,
          display: "grid",
          gap: 10,
          maxWidth: 680,
        }}
      >
        <div style={{ fontWeight: 700 }}>Create Enrollment</div>

        <input
          placeholder="Child ID"
          value={child_id}
          onChange={(e) => setChildId(e.target.value)}
        />

        <select value={class_id} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.id} - {cls.title}
            </option>
          ))}
        </select>

        <div style={{ fontSize: 13, color: "#666" }}>
          Use an existing child ID. This flow currently enrolls already-registered children.
        </div>

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
                  <td>{r.class_title || r.class_id || "—"}</td>
                  <td>{r.status || "PENDING"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}