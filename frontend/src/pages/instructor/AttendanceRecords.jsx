import { useEffect, useState } from "react";
import { getMyAssignedClassesApi, getAttendanceRecordsApi } from "../../api/instructorApi";
import useInstructorView from "../../hooks/useInstructorView";

export default function InsAttendanceRecords() {
  const {
    isAdminInstructorView,
    instructors,
    selectedInstructorId,
    setSelectedInstructorId,
    selectedInstructor,
    loadingInstructors,
    selectorError,
  } = useInstructorView();

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");

  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, [selectedInstructorId, isAdminInstructorView]);

  const loadClasses = async () => {
    if (isAdminInstructorView && !selectedInstructorId) {
      setClasses([]);
      setClassId("");
      setRows([]);
      return;
    }

    try {
      const res = await getMyAssignedClassesApi(selectedInstructorId || undefined);
      const list = Array.isArray(res.data) ? res.data.filter((x) => x.item_type === "CLASS") : [];
      setClasses(list);
      setClassId(list[0]?.id ? String(list[0].id) : "");
      setRows([]);
    } catch {
      setClasses([]);
      setClassId("");
      setRows([]);
    }
  };

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await getAttendanceRecordsApi(
        classId,
        from,
        to,
        selectedInstructorId || undefined
      );
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Attendance Records</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 10 }}>
        {isAdminInstructorView && (
          <>
            <div style={{ fontWeight: 700 }}>Instructor View (Admin Access)</div>

            <label>
              Select Instructor:&nbsp;
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                disabled={loadingInstructors}
              >
                {instructors.length === 0 && <option value="">No instructors</option>}
                {instructors.map((ins) => (
                  <option key={ins.id} value={ins.id}>
                    {ins.full_name}
                  </option>
                ))}
              </select>
            </label>

            {selectedInstructor ? (
              <div style={{ color: "#666" }}>Now viewing: {selectedInstructor.full_name}</div>
            ) : null}

            {selectorError ? <div style={{ color: "crimson" }}>{selectorError}</div> : null}
          </>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label>
            Class:&nbsp;
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.length === 0 && <option value="">No classes</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || `Class #${c.id}`}
                </option>
              ))}
            </select>
          </label>

          <label>
            From:&nbsp;
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>

          <label>
            To:&nbsp;
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>

          <button onClick={load} disabled={loading || !classId}>
            {loading ? "Loading…" : "Load Records"}
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        {rows.length === 0 ? (
          <div style={{ color: "#666" }}>No records found.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>Date</th>
                <th>Child</th>
                <th>Guardian</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={r.id || idx}>
                  <td>{r.date ? String(r.date).slice(0, 10) : "—"}</td>
                  <td>{r.child_name || "—"}</td>
                  <td>{r.guardian_name || "—"}</td>
                  <td>{r.guardian_phone || "—"}</td>
                  <td>{r.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}