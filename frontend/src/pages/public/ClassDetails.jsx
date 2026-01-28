import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { getPublicClassApi } from "../../api/publicApi";

export default function ClassDetails() {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isParent = !!token && role === "PARENT";

  useEffect(() => {
    const run = async () => {
      setErr("");
      try {
        const res = await getPublicClassApi(id);
        setCls(res.data);
      } catch (e) {
        // fallback (when endpoint not ready yet)
        setCls({
          id,
          title: "Class Details",
          description: "Class details API not connected yet. This is a UI placeholder.",
          schedule: "Weekend",
          fee: 5000,
        });
        setErr(e?.response?.data?.message || "");
      }
    };
    run();
  }, [id]);

  const feeText = useMemo(() => {
    const n = Number(cls?.fee ?? cls?.class_fee ?? cls?.price ?? 0);
    return Number.isFinite(n) ? `LKR ${n.toFixed(2)}` : "—";
  }, [cls]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="kidCard" style={{ padding: 18, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div className="badgeSoft">🎓 Class</div>
            <h1 style={{ margin: "10px 0 0", fontSize: 28 }}>{cls?.title || "Class"}</h1>
            <div style={{ marginTop: 8, opacity: 0.85, fontWeight: 700 }}>
              {cls?.description || "—"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="kidBtnGhost" to="/services">Back to Services</Link>

            {isParent ? (
              <Link className="kidBtn" to={`/profile/enroll?class_id=${encodeURIComponent(cls?.id ?? id)}`}>
                Enroll Now
              </Link>
            ) : (
              <Link className="kidBtn" to="/auth/signin">
                Sign in to Enroll
              </Link>
            )}
          </div>
        </div>

        {err ? (
          <div style={{ marginTop: 12, color: "#b00020", fontWeight: 800 }}>
            {err}
          </div>
        ) : null}

        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div className="kidCard" style={{ padding: 14, boxShadow: "none" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Schedule</div>
            <div style={{ fontWeight: 900, marginTop: 4 }}>{cls?.schedule || "—"}</div>
          </div>

          <div className="kidCard" style={{ padding: 14, boxShadow: "none" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Fee</div>
            <div style={{ fontWeight: 900, marginTop: 4 }}>{feeText}</div>
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="kidBtnGhost" to="/contact">Ask about this class</Link>
          {isParent ? (
            <div style={{ fontWeight: 800, opacity: 0.8, alignSelf: "center" }}>
              Tip: Your enrollment will be created as <b>PENDING</b> — then you can pay.
            </div>
          ) : (
            <div style={{ fontWeight: 800, opacity: 0.8, alignSelf: "center" }}>
              Tip: Sign in first, then you can enroll and pay from your profile.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
