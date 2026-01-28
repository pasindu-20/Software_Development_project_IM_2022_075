import { useEffect, useState } from "react";
import { getMyAssignedClassesApi } from "../../api/instructorApi";

export default function InsDashboard() {
  const [classes, setClasses] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await getMyAssignedClassesApi();
      setClasses(res.data || []);
    } catch (e) {
      setClasses([]);
      setErr("Instructor classes API not ready or server error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Instructor Dashboard</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Card title="Assigned Classes" value={loading ? "…" : String(classes.length)} />
        <Card title="Today’s Attendance" value="—" />
        <Card title="Pending Actions" value="—" />
      </div>

      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>My Assigned Classes</h3>

        {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}

        {loading ? (
          <div>Loading…</div>
        ) : classes.length === 0 ? (
          <div style={{ color: "#666" }}>No assigned classes found.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>Class</th>
                <th>Schedule</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td>{c.title || c.name || `Class #${c.id}`}</td>
                  <td>{c.schedule || "—"}</td>
                  <td>{c.room || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ background: "white", padding: 14, borderRadius: 12 }}>
      <div style={{ fontSize: 13, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
