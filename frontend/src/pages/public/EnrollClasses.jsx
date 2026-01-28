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

  const [child_id, setChildId] = useState("");
  const [class_id, setClassId] = useState("");

  const [newChildName, setNewChildName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    setErr("");
    try {
      const [kidsRes, clsRes] = await Promise.all([
        listChildrenApi(),
        listClassesApi(),
      ]);
      setChildren(kidsRes.data || []);
      setClasses(clsRes.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load data");
    }
  };

  useEffect(() => {
    load();

    // ✅ If class_id exists in URL, preselect it
    const preClassId = searchParams.get("class_id");
    if (preClassId) setClassId(String(preClassId));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addChild = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!newChildName.trim()) return setErr("Child name is required");

    setBusy(true);
    try {
      await addChildApi({ child_name: newChildName.trim() });
      setInfo("✅ Child added");
      setNewChildName("");
      await load();
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

    if (!child_id || !class_id) return setErr("Select child and class");

    setBusy(true);
    try {
      await enrollApi({ child_id: Number(child_id), class_id: Number(class_id) });
      setInfo("✅ Enrollment created (PENDING). Now you can pay from your profile.");
      setTimeout(() => navigate("/profile"), 800);
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
          {/* Add Child */}
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

          {/* Enroll */}
          <div className="kidCard" style={{ padding: 14, boxShadow: "none" }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>✅ Enroll</div>

            <form onSubmit={enroll} style={{ display: "grid", gap: 10 }}>
              <select
                className="kidInput"
                value={child_id}
                onChange={(e) => setChildId(e.target.value)}
              >
                <option value="">Select Child</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.child_name}
                  </option>
                ))}
              </select>

              <select
                className="kidInput"
                value={class_id}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Select Class</option>
                {classes.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.title} (LKR {Number(cl.fee).toFixed(2)})
                  </option>
                ))}
              </select>

              <button disabled={busy} className="kidBtn" type="submit">
                {busy ? "Enrolling..." : "Enroll Now"}
              </button>
            </form>

            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
              After enrolling, go back to <b>My Profile</b> and click <b>Pay Now</b> for pending enrollments.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
