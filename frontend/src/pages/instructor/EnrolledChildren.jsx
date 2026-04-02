import { useEffect, useState } from "react";
import { getMyAssignedClassesApi, getEnrolledChildrenApi } from "../../api/instructorApi";
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
      const list = Array.isArray(res.data) ? res.data.filter((x) => x.item_type === "CLASS") : [];
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
      const res = await getEnrolledChildrenApi(id, undefined, selectedInstructorId || undefined);
      setChildren(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setChildren([]);
      setErr(e?.response?.data?.message || "Failed to load enrolled children");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Enrolled Children</h2>

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

        <label>
          Select Class:
          <select value={classId} onChange={(e) => setClassId(e.target.value)} style={{ marginLeft: 10 }}>
            {classes.length === 0 && <option value="">No classes</option>}
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title || `Class #${c.id}`}
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
                <th>Enrollment Status</th>
              </tr>
            </thead>
            <tbody>
              {children.map((ch) => (
                <tr key={ch.id}>
                  <td>{ch.child_name || `Child #${ch.id}`}</td>
                  <td>{ch.guardian_name || "—"}</td>
                  <td>{ch.guardian_phone || "—"}</td>
                  <td>{ch.enrollment_status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}