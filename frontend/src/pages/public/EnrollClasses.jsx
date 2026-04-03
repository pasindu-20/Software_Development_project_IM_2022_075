import { useEffect, useMemo, useState } from "react";
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

  const toggleChildSelection = (id) => {
    setSelectedChildren((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addChild = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!newChildName.trim()) {
      setErr("Child name is required.");
      return;
    }

    setBusy(true);
    try {
      await addChildApi({ child_name: newChildName.trim() });
      setInfo("Child added successfully.");
      setNewChildName("");
      await loadChildren();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to add child.");
    } finally {
      setBusy(false);
    }
  };

  const enroll = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!selectedChildren.length || !class_id) {
      setErr("Please select at least one child and one class.");
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
          `${enrolledCount} child(ren) enrolled successfully. ${alreadyCount} child(ren) were already enrolled before.`
        );
      } else if (enrolledCount > 0) {
        setInfo(`${enrolledCount} child(ren) enrolled successfully.`);
      } else if (alreadyCount > 0) {
        setErr("Selected child(ren) are already enrolled in this class.");
      } else {
        setErr("No enrollments were created.");
      }

      setSelectedChildren([]);
      setTimeout(() => navigate("/profile"), 1200);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to enroll.");
    } finally {
      setBusy(false);
    }
  };

  const selectedClass = useMemo(() => {
    return classes.find((cl) => String(cl.id) === String(class_id)) || null;
  }, [classes, class_id]);

  const formatMoney = (value) => `LKR ${Number(value || 0).toFixed(2)}`;

  return (
    <motion.div
      className="enrollModernPage"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="enrollModernHero">
        <div className="enrollModernHeroText">
          <div className="enrollModernBadge">🎓 Enroll to a Class</div>
          <h1 className="enrollModernTitle">Enroll Classes</h1>
          <p className="enrollModernSubtitle">
            Add your child details and enroll them into the class you want in a
            clean and simple flow.
          </p>

          <div className="enrollModernStats">
            <div className="enrollModernStat">
              <span className="enrollModernStatLabel">Children</span>
              <strong>{children.length}</strong>
            </div>
            <div className="enrollModernStat">
              <span className="enrollModernStatLabel">Available Classes</span>
              <strong>{classes.length}</strong>
            </div>
            <div className="enrollModernStat">
              <span className="enrollModernStatLabel">Selected</span>
              <strong>{selectedChildren.length}</strong>
            </div>
          </div>
        </div>

        <Link className="enrollModernBackBtn" to="/profile">
          ← Back to Profile
        </Link>
      </div>

      {err ? (
        <div className="enrollModernAlert enrollModernAlertError">{err}</div>
      ) : null}

      {info ? (
        <div className="enrollModernAlert enrollModernAlertSuccess">{info}</div>
      ) : null}

      <div className="enrollModernGrid">
        <section className="enrollModernCard">
          
          <h2 className="enrollModernCardTitle">Add Child</h2>
          <p className="enrollModernCardText">
            Add one or more children before enrolling them into classes.
          </p>

          <form onSubmit={addChild} className="enrollModernForm">
            <label className="enrollModernLabel">Child name</label>
            <input
              className="enrollModernInput"
              placeholder="Enter child name"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
            />

            <button disabled={busy} className="enrollModernPrimaryBtn" type="submit">
              {busy ? "Saving..." : "Add Child"}
            </button>
          </form>

          <div className="enrollModernHelper">
            You can add multiple children and later enroll them together.
          </div>
        </section>

        <section className="enrollModernCard enrollModernCardLarge">
          <div className="enrollModernCardTop">
            <div>
              
              <h2 className="enrollModernCardTitle">Enroll Child / Children</h2>
              <p className="enrollModernCardText">
                Select the children and choose the class you want to enroll in.
              </p>
            </div>

            <div className="enrollModernSelectedPill">
              {selectedChildren.length} selected
            </div>
          </div>

          <form onSubmit={enroll} className="enrollModernForm">
            <div>
              <label className="enrollModernLabel">Select children</label>

              <div className="enrollModernChildrenBox">
                {children.length === 0 ? (
                  <div className="enrollModernEmpty">
                    No children added yet. Add a child first to continue.
                  </div>
                ) : (
                  children.map((c) => {
                    const childIdNum = Number(c.id);
                    const checked = selectedChildren.includes(childIdNum);

                    return (
                      <label
                        key={c.id}
                        className={`enrollModernChildItem ${
                          checked ? "active" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleChildSelection(childIdNum)}
                        />
                        <span>{c.child_name || c.full_name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <label className="enrollModernLabel">Select class</label>
              <select
                className="enrollModernInput enrollModernSelect"
                value={class_id}
                onChange={(e) => setClassId(e.target.value)}
              >
                <option value="">Choose a class</option>
                {classes.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.title} ({formatMoney(cl.fee)})
                  </option>
                ))}
              </select>
            </div>

            {selectedClass ? (
              <div className="enrollModernClassPreview">
                <span className="enrollModernClassPreviewName">
                  {selectedClass.title}
                </span>
                <span className="enrollModernClassPreviewFee">
                  {formatMoney(selectedClass.fee)}
                </span>
              </div>
            ) : null}

            <button disabled={busy} className="enrollModernPrimaryBtn" type="submit">
              {busy ? "Enrolling..." : "Enroll Now"}
            </button>
          </form>

          <div className="enrollModernNote">
            After enrolling, go back to <strong>My Profile</strong> and click{" "}
            <strong>Pay Now</strong> for pending enrollments.
          </div>
        </section>
      </div>
    </motion.div>
  );
}