import { useEffect, useState } from "react";
import {
  getAttendanceRecordsApi,
  getMyAssignedClassesApi,
} from "../../api/instructorApi";
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
      const list = Array.isArray(res.data)
        ? res.data.filter((x) => x.item_type === "CLASS")
        : [];
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
    <div className="instructorPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Attendance Records</h2>
      </div>

      {isAdminInstructorView && (
        <div className="instructorAdminCard">
          <div>
            <p className="instructorAdminTitle">Instructor View (Admin Access)</p>
            <p className="instructorAdminText">
              View attendance history for a selected instructor and class.
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
            <h3 className="instructorSectionTitle">Attendance History</h3>
            <p className="instructorSectionText">
              Filter records by class and date range, then load the matching attendance list.
            </p>
          </div>
        </div>

        <div className="instructorToolbar">
          <label className="instructorField">
            <span className="instructorFieldLabel">Class</span>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.length === 0 && <option value="">No classes</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || `Class #${c.id}`}
                </option>
              ))}
            </select>
          </label>

          <label className="instructorField">
            <span className="instructorFieldLabel">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>

          <label className="instructorField">
            <span className="instructorFieldLabel">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>

          <button
            onClick={load}
            disabled={loading || !classId}
            className="instructorButton"
            type="button"
          >
            {loading ? "Loading…" : "Load Records"}
          </button>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}

        {rows.length === 0 ? (
          <div className="instructorMuted">No records found.</div>
        ) : (
          <div className="instructorTableOuter">
            <table className="instructorTable">
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
                    <td>
                      <span className="instructorStatusPill">{r.status || "—"}</span>
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