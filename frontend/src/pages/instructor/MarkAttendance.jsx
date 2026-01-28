import { useEffect, useState } from "react";
import {
  getMyAssignedClassesApi,
  getEnrolledChildrenApi,
  markAttendanceApi,
} from "../../api/instructorApi";

export default function InsMarkAttendance() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [children, setChildren] = useState([]);
  const [records, setRecords] = useState({}); // child_id -> "PRESENT"/"ABSENT"

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyAssignedClassesApi();
        const list = res.data || [];
        setClasses(list);
        if (list[0]?.id) setClassId(String(list[0].id));
      } catch {
        setClasses([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!classId) return;
    loadChildren(classId);
  }, [classId]);

  const loadChildren = async (id) => {
    setLoading(true);
    setErr("");
    setInfo("");
    try {
      const res = await getEnrolledChildrenApi(id);
      const list = res.data || [];
      setChildren(list);

      // default all PRESENT
      const map = {};
      list.forEach((c) => {
        map[c.id] = "PRESENT";
      });
      setRecords(map);
    } catch {
      setChildren([]);
      setErr("API not ready: /api/instructor/classes/:id/children");
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (childId, status) => {
    setRecords((prev) => ({ ...prev, [childId]: status }));
  };

  const save = async () => {
    setErr("");
    setInfo("");

    if (!classId) return setErr("Please select a class");
    if (!date) return setErr("Please select date");

    const payload = children.map((c) => ({
      child_id: c.id,
      status: records[c.id] || "PRESENT",
    }));

    setSaving(true);
    try {
      await markAttendanceApi(classId, date, payload);
      setInfo("Attendance saved successfully");
    } catch {
      setErr("API not ready: /api/instructor/classes/:id/attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Mark Attendance</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label>
            Class:&nbsp;
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.length === 0 && <option value="">No classes</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || c.name || `Class #${c.id}`}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date:&nbsp;
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <button onClick={save} disabled={saving || loading}>
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </div>

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {info && <div style={{ color: "green" }}>{info}</div>}

        {loading ? (
          <div>Loading children…</div>
        ) : children.length === 0 ? (
          <div style={{ color: "#666" }}>No children found for this class.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>Child</th>
                <th>Present</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              {children.map((c) => (
                <tr key={c.id}>
                  <td>{c.child_name || c.name || `Child #${c.id}`}</td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="radio"
                      name={`att_${c.id}`}
                      checked={(records[c.id] || "PRESENT") === "PRESENT"}
                      onChange={() => setStatus(c.id, "PRESENT")}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="radio"
                      name={`att_${c.id}`}
                      checked={(records[c.id] || "PRESENT") === "ABSENT"}
                      onChange={() => setStatus(c.id, "ABSENT")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
