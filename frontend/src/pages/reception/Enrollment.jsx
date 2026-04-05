import { useEffect, useState } from "react";
import { createEnrollmentApi, listEnrollmentsApi } from "../../api/receptionApi";
import { listPublicClassesApi } from "../../api/publicApi";

export default function RecEnrollment() {
  const [rows, setRows] = useState([]);
  const [classes, setClasses] = useState([]);
  const [child_id, setChildId] = useState("");
  const [class_id, setClassId] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    load();
    loadClasses();
  }, []);

  const load = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await listEnrollmentsApi();
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load enrollments");
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await listPublicClassesApi();
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setClasses([]);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!child_id || !class_id) {
      return setErr("child_id and class_id are required.");
    }

    setBusy(true);
    try {
      await createEnrollmentApi({
        child_id: Number(child_id),
        class_id: Number(class_id),
      });

      setInfo("Enrollment created.");
      setChildId("");
      setClassId("");
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create enrollment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="instructorPage receptionPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Manage Enrollment</h2>
      </div>

      <form onSubmit={submit} className="instructorContentCard receptionFormCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Create Enrollment</h3>
            <p className="instructorSectionText">
             
            </p>
          </div>
        </div>

        <div className="receptionStack">
          <label className="instructorField">
            <span className="instructorFieldLabel">Child ID</span>
            <input
              placeholder="Child ID"
              value={child_id}
              onChange={(e) => setChildId(e.target.value)}
            />
          </label>

          <label className="instructorField">
            <span className="instructorFieldLabel">Select Class</span>
            <select value={class_id} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.id} - {cls.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}
        {info ? <div className="instructorSuccess">{info}</div> : null}

        <div className="receptionButtonRow">
          <button className="instructorButton" disabled={busy} type="submit">
            {busy ? "Saving…" : "Create Enrollment"}
          </button>
        </div>
      </form>

      <div className="instructorContentCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Enrollments</h3>
            <p className="instructorSectionText">Current enrollment records and statuses.</p>
          </div>
        </div>

        {loading ? (
          <div className="instructorMuted">Loading enrollments…</div>
        ) : rows.length === 0 ? (
          <div className="instructorMuted">No enrollments found.</div>
        ) : (
          <div className="instructorTableOuter">
            <table className="instructorTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Child</th>
                  <th>Guardian</th>
                  <th>Phone</th>
                  <th>Class</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.child_name || "—"}</td>
                    <td>{r.guardian_name || "—"}</td>
                    <td>{r.guardian_phone || "—"}</td>
                    <td>{r.class_title || r.class_id || "—"}</td>
                    <td>
                      <span className={`receptionStatusPill ${String(r.status || "pending").toLowerCase()}`}>
                        {r.status || "PENDING"}
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