import { useEffect, useState } from "react";
import {
  getEnrolledChildrenApi,
  getMyAssignedClassesApi,
} from "../../api/instructorApi";
import useInstructorView from "../../hooks/useInstructorView";

export default function InsEnrolledChildren() {
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
  const [children, setChildren] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClasses();
  }, [selectedInstructorId, isAdminInstructorView]);

  useEffect(() => {
    if (!classId) return;
    loadChildren(classId);
  }, [classId, selectedInstructorId]);

  const loadClasses = async () => {
    if (isAdminInstructorView && !selectedInstructorId) {
      setClasses([]);
      setClassId("");
      return;
    }

    try {
      const res = await getMyAssignedClassesApi(selectedInstructorId || undefined);
      const list = Array.isArray(res.data)
        ? res.data.filter((x) => x.item_type === "CLASS")
        : [];
      setClasses(list);
      setClassId(list[0]?.id ? String(list[0].id) : "");
      setChildren([]);
    } catch {
      setClasses([]);
      setClassId("");
      setChildren([]);
    }
  };

  const loadChildren = async (id) => {
    setLoading(true);
    setErr("");
    try {
      const res = await getEnrolledChildrenApi(
        id,
        undefined,
        selectedInstructorId || undefined
      );
      setChildren(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setChildren([]);
      setErr(e?.response?.data?.message || "Failed to load enrolled children");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instructorPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Enrolled Children</h2>
      </div>

      {isAdminInstructorView && (
        <div className="instructorAdminCard">
          <div>
            <p className="instructorAdminTitle">Instructor View (Admin Access)</p>
            <p className="instructorAdminText">
              Select an instructor first, then switch between their class lists.
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
            <h3 className="instructorSectionTitle">Class Enrollments</h3>
            <p className="instructorSectionText">
              Review the children currently enrolled in each assigned class.
            </p>
          </div>
        </div>

        <div className="instructorToolbar">
          <label className="instructorField">
            <span className="instructorFieldLabel">Select Class</span>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.length === 0 && <option value="">No classes</option>}
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title || `Class #${c.id}`}
                </option>
              ))}
            </select>
          </label>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}

        {loading ? (
          <div className="instructorMuted">Loading enrolled children…</div>
        ) : children.length === 0 ? (
          <div className="instructorMuted">No enrolled children found.</div>
        ) : (
          <div className="instructorTableOuter">
            <table className="instructorTable">
              <thead>
                <tr>
                  <th>Child Name</th>
                  <th>Guardian</th>
                  <th>Contact</th>
                  <th>Enrollment Status</th>
                </tr>
              </thead>
              <tbody>
                {children.map((ch) => (
                  <tr key={ch.id}>
                    <td>{ch.child_name || `Child #${ch.id}`}</td>
                    <td>{ch.guardian_name || "—"}</td>
                    <td>{ch.guardian_phone || "—"}</td>
                    <td>
                      <span className="instructorStatusPill">
                        {ch.enrollment_status || "—"}
                      </span>
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