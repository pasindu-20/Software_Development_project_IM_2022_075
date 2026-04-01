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
  const [records, setRecords] = useState({});

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyAssignedClassesApi();
        const list = Array.isArray(res.data) ? res.data.filter((x) => x.item_type === "CLASS") : [];
        setClasses(list);
        if (list[0]?.id) setClassId(String(list[0].id));
      } catch {
        setClasses([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!classId || !date) return;
    loadChildren(classId, date);
  }, [classId, date]);

  const loadChildren = async (id, selectedDate) => {
    setLoading(true);
    setErr("");
    try {
      const res = await getEnrolledChildrenApi(id, selectedDate);
      const list = Array.isArray(res.data) ? res.data : [];
      setChildren(list);

      const map = {};
      list.forEach((c) => {
        map[c.id] = c.attendance_status || "PRESENT";
      });
      setRecords(map);
    } catch (e) {
      setChildren([]);
      setErr(e?.response?.data?.message || "Failed to load children for attendance");
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
      await loadChildren(classId, date);
      setInfo("Attendance saved successfully!");

      setTimeout(() => {
        setInfo("");
      }, 3000);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to save attendance");
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
            <select
              value={classId}
              onChange={(e) => {
                setInfo("");
                setClassId(e.target.value);
              }}
            >
              {classes.length === 0 && <option value="">No classes</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || `Class #${c.id}`}
                </option>
              ))}
            </select>
          </label>

          <label>
            Date:&nbsp;
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setInfo("");
                setDate(e.target.value);
              }}
            />
          </label>

          <button onClick={save} disabled={saving || loading || children.length === 0}>
            {saving ? "Saving…" : "Save Attendance"}
          </button>
        </div>

        {err && <div style={{ color: "crimson", fontWeight: "500" }}>{err}</div>}
        {info && <div style={{ color: "green", fontWeight: "600" }}>{info}</div>}

        {loading ? (
          <div>Loading children…</div>
        ) : children.length === 0 ? (
          <div style={{ color: "#666" }}>No children found for this class.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>Child</th>
                <th>Guardian</th>
                <th>Present</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              {children.map((c) => (
                <tr key={c.id}>
                  <td>{c.child_name || `Child #${c.id}`}</td>
                  <td>{c.guardian_name || "—"}</td>
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