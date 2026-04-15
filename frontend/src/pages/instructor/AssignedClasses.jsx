import { useEffect, useState } from "react";
import { getMyAssignedClassesApi } from "../../api/instructorApi";
import useInstructorView from "../../hooks/useInstructorView";

function getDayNameFromDate(dateValue) {
  if (!dateValue) return "";

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-US", { weekday: "long" });
}

function getScheduleLabel(item) {
  if (item.item_type === "CLASS") {
    return item.schedule_text || getDayNameFromDate(item.event_date) || "-";
  }

  return item.event_date ? String(item.event_date).slice(0, 10) : "-";
}

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
    <div className="instructorPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Assigned Classes</h2>
      </div>

      {isAdminInstructorView && (
        <div className="instructorAdminCard">
          <div>
            <p className="instructorAdminTitle">Instructor View (Admin Access)</p>
            <p className="instructorAdminText">
              Pick an instructor to view their current class and event assignments.
            </p>
          </div>

          <div className="instructorToolbar">
            <label className="instructorField">
              <span className="instructorFieldLabel">Select Instructor</span>
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
          </div>

          {selectedInstructor ? (
            <div className="instructorMuted">
              Now viewing: <strong>{selectedInstructor.full_name}</strong>
            </div>
          ) : null}

          {selectorError ? <div className="instructorError">{selectorError}</div> : null}
        </div>
      )}

      <div className="instructorContentCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Schedule Overview</h3>
            <p className="instructorSectionText">
              All assigned class and event items appear here with enrollment and fee details.
            </p>
          </div>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}

        {loading ? (
          <div className="instructorMuted">Loading assigned classes…</div>
        ) : rows.length === 0 ? (
          <div className="instructorMuted">No assigned classes or events found.</div>
        ) : (
          <div className="instructorTableOuter">
            <table className="instructorTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Age Range</th>
                  <th>Day / Date</th>
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
                    <td>
                      <span className="instructorStatusPill">{row.item_type || "-"}</span>
                    </td>
                    <td>{row.title || "-"}</td>
                    <td>
                      {row.age_min ?? "-"} - {row.age_max ?? "-"}
                    </td>
                    <td>{getScheduleLabel(row)}</td>
                    <td>
                      {row.start_time ? String(row.start_time).slice(0, 5) : "-"}
                      {row.end_time ? ` - ${String(row.end_time).slice(0, 5)}` : ""}
                    </td>
                    <td>LKR {Number(row.fee || 0).toFixed(2)}</td>
                    <td>{Number(row.enrolled_count || 0)}</td>
                    <td>
                      <span className="instructorStatusPill">{row.status || "-"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}