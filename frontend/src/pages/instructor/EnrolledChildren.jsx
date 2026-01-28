import { useEffect, useState } from "react";
import { getMyAssignedClassesApi, getEnrolledChildrenApi } from "../../api/instructorApi";

export default function InsEnrolledChildren() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [children, setChildren] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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
    try {
      const res = await getEnrolledChildrenApi(id);
      setChildren(res.data || []);
    } catch {
      setChildren([]);
      setErr("API not ready: /api/instructor/classes/:id/children");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Enrolled Children</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12, display: "grid", gap: 10 }}>
        <label>
          Select Class:
          <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ marginLeft: 10 }}>
            {classes.length === 0 && <option value="">No classes</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || c.name || `Class #${c.id}`}
              </option>
            ))}
          </select>
        </label>

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        {loading ? (
          <div>Loading…</div>
        ) : children.length === 0 ? (
          <div style={{ color: "#666" }}>No enrolled children found.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>Child Name</th>
                <th>Guardian</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {children.map((ch) => (
                <tr key={ch.id}>
                  <td>{ch.child_name || ch.name || `Child #${ch.id}`}</td>
                  <td>{ch.guardian_name || "—"}</td>
                  <td>{ch.guardian_phone || ch.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
