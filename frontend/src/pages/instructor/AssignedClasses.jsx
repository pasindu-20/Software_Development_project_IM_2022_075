import { useEffect, useState } from "react";
import { getMyAssignedClassesApi } from "../../api/instructorApi";

export default function AssignedClasses() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await getMyAssignedClassesApi();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load assigned classes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Assigned Classes</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        {err ? <div style={{ color: "crimson", marginBottom: 12 }}>{err}</div> : null}

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#666" }}>No assigned classes or events found.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>Age Range</th>
                <th>Date</th>
                <th>Time</th>
                <th>Fee</th>
                <th>Enrolled</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.item_type || "-"}</td>
                  <td>{row.title || "-"}</td>
                  <td>{row.age_min ?? "-"} - {row.age_max ?? "-"}</td>
                  <td>{row.event_date ? String(row.event_date).slice(0, 10) : "-"}</td>
                  <td>
                    {row.start_time ? String(row.start_time).slice(0, 5) : "-"}
                    {row.end_time ? ` - ${String(row.end_time).slice(0, 5)}` : ""}
                  </td>
                  <td>LKR {Number(row.fee || 0).toFixed(2)}</td>
                  <td>{Number(row.enrolled_count || 0)}</td>
                  <td>{row.status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}