import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  addChildApi,
  enrollApi,
  listChildrenApi,
  listClassesApi,
} from "../../api/parentApi";

export default function EnrollClasses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [children, setChildren] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedChildren, setSelectedChildren] = useState([]);
  const [class_id, setClassId] = useState("");

  const [newChildName, setNewChildName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const loadChildren = async () => {
    try {
      const kidsRes = await listChildrenApi();
      setChildren(kidsRes.data || []);
    } catch (e) {
      console.error("Failed to load children:", e);
    }
  };

  const toggleChildSelection = (id) => {
    setSelectedChildren((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const loadClasses = async () => {
    try {
      const clsRes = await listClassesApi();
      setClasses(clsRes.data || []);
    } catch (e) {
      console.error("Failed to load classes:", e);
      setErr(e?.response?.data?.message || "Failed to load classes");
    }
  };

  const load = async () => {
    setErr("");
    await loadChildren();
    await loadClasses();
  };

  useEffect(() => {
    load();

    const preClassId = searchParams.get("class_id");
    if (preClassId) setClassId(String(preClassId));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addChild = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!newChildName.trim()) {
      setErr("Child name is required");
      return;
    }

    setBusy(true);
    try {
      await addChildApi({ child_name: newChildName.trim() });
      setInfo("Child added");
      setNewChildName("");
      await loadChildren(); // only reload children
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to add child");
    } finally {
      setBusy(false);
    }
  };

  const enroll = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!selectedChildren.length || !class_id) {
      setErr("Select at least one child and a class");
      return;
    }

    setBusy(true);
    try {
      const res = await enrollApi({
        child_ids: selectedChildren,
        class_id: Number(class_id),
      });

      const data = res.data || {};
      const enrolledCount = data.enrolled?.length || 0;
      const alreadyCount = data.already_enrolled?.length || 0;

      if (enrolledCount > 0 && alreadyCount > 0) {
        setInfo(
          `${enrolledCount} child(ren) enrolled. ${alreadyCount} already enrolled before.`
        );
      } else if (enrolledCount > 0) {
        setInfo(`${enrolledCount} child(ren) enrolled successfully.`);
      } else if (alreadyCount > 0) {
        setErr("Selected child(ren) are already enrolled in this class.");
      } else {
        setErr("No enrollments were created.");
      }

      setSelectedChildren([]);
      setTimeout(() => navigate("/profile"), 1000);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to enroll");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div
        className="kidCard"
        style={{ padding: 16, maxWidth: 860, display: "grid", gap: 14 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="badgeSoft">🎓 Enroll to a Class</div>
            <h1 style={{ margin: "10px 0 0", fontSize: 26 }}>Enroll Classes</h1>
          </div>
          <Link className="kidBtnGhost" to="/profile">
            Back to Profile
          </Link>
        </div>

        {err ? <div style={{ color: "#b00020", fontWeight: 800 }}>{err}</div> : null}
        {info ? <div style={{ color: "#0a6b2b", fontWeight: 800 }}>{info}</div> : null}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="kidCard" style={{ padding: 14, boxShadow: "none" }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>👶 Add Child</div>

            <form onSubmit={addChild} style={{ display: "grid", gap: 10 }}>
              <input
                className="kidInput"
                placeholder="Child name"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
              />

              <button disabled={busy} className="kidBtn" type="submit">
                {busy ? "Saving..." : "Add Child"}
              </button>
            </form>

            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
              You can add multiple children and enroll them to classes.
            </div>
          </div>

          <div className="kidCard" style={{ padding: 14, boxShadow: "none" }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
               Enroll Child / Children
            </div>

            <form onSubmit={enroll} style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: 10,
                  display: "grid",
                  gap: 8,
                  maxHeight: 180,
                  overflowY: "auto",
                  background: "#fff",
                }}
              >
                {children.length === 0 ? (
                  <div style={{ fontSize: 14, opacity: 0.7 }}>No children added yet</div>
                ) : (
                  children.map((c) => {
                    const childIdNum = Number(c.id);
                    return (
                      <label
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedChildren.includes(childIdNum)}
                          onChange={() => toggleChildSelection(childIdNum)}
                        />
                        <span>{c.child_name || c.full_name}</span>
                      </label>
                    );
                  })
                )}
              </div>

              <select
                className="kidInput"
                value={class_id}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.title} (LKR {Number(cl.fee || 0).toFixed(2)})
                  </option>
                ))}
              </select>

              <button disabled={busy} className="kidBtn" type="submit">
                {busy ? "Enrolling..." : "Enroll Now"}
              </button>
            </form>

            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
              After enrolling, go back to <b>My Profile</b> and click <b>Pay Now</b> for
              pending enrollments.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}