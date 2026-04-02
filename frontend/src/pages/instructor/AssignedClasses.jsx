import { useEffect, useState } from "react";
import { getMyAssignedClassesApi } from "../../api/instructorApi";
import useInstructorView from "../../hooks/useInstructorView";

export default function AssignedClasses() {
  const {
    isAdminInstructorView,
    instructors,
    selectedInstructorId,
    setSelectedInstructorId,
    selectedInstructor,
    loadingInstructors,
    selectorError,
  } = useInstructorView();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (isAdminInstructorView && !selectedInstructorId) {
      setRows([]);
      setLoading(false);
      return;
    }

    load();
  }, [selectedInstructorId, isAdminInstructorView]);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await getMyAssignedClassesApi(selectedInstructorId || undefined);
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

      {isAdminInstructorView && (
        <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>Instructor View (Admin Access)</div>

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
            <div style={{ color: "#666", marginTop: 8 }}>
              Now viewing: {selectedInstructor.full_name}
            </div>
          ) : null}

          {selectorError ? <div style={{ color: "crimson", marginTop: 8 }}>{selectorError}</div> : null}
        </div>
      )}

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