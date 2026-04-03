import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarCheck2, ClipboardList, Users } from "lucide-react";
import {
  getInstructorDashboardApi,
  getMyAssignedClassesApi,
} from "../../api/instructorApi";
import { useAuth } from "../../auth/useAuth";
import useInstructorView from "../../hooks/useInstructorView";

export default function InsDashboard() {
  const { user } = useAuth();
  const {
    isAdminInstructorView,
    instructors,
    selectedInstructorId,
    setSelectedInstructorId,
    selectedInstructor,
    loadingInstructors,
    selectorError,
  } = useInstructorView();

  const [stats, setStats] = useState({
    assignedClasses: 0,
    totalEnrollments: 0,
    classesMarkedToday: 0,
    pendingAttendanceToday: 0,
  });
  const [classes, setClasses] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdminInstructorView && !selectedInstructorId) {
      setStats({
        assignedClasses: 0,
        totalEnrollments: 0,
        classesMarkedToday: 0,
        pendingAttendanceToday: 0,
      });
      setClasses([]);
      setLoading(false);
      return;
    }

    load();
  }, [selectedInstructorId, isAdminInstructorView]);

  const load = async () => {
    setLoading(true);
    setErr("");

    try {
      const [statsRes, classesRes] = await Promise.all([
        getInstructorDashboardApi(selectedInstructorId || undefined),
        getMyAssignedClassesApi(selectedInstructorId || undefined),
      ]);

      setStats({
        assignedClasses: Number(statsRes.data?.assignedClasses || 0),
        totalEnrollments: Number(statsRes.data?.totalEnrollments || 0),
        classesMarkedToday: Number(statsRes.data?.classesMarkedToday || 0),
        pendingAttendanceToday: Number(
          statsRes.data?.pendingAttendanceToday || 0
        ),
      });

      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
    } catch (e) {
      setClasses([]);
      setErr(e?.response?.data?.message || "Failed to load instructor dashboard");
    } finally {
      setLoading(false);
    }
  };

  const displayName = useMemo(() => {
    if (isAdminInstructorView) {
      return selectedInstructor?.full_name || "Instructor";
    }

    return user?.full_name || user?.name || "Instructor";
  }, [isAdminInstructorView, selectedInstructor, user]);

  return (
    <div className="instructorPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Instructor Dashboard</h2>
      </div>

      {isAdminInstructorView && (
        <div className="instructorAdminCard">
          <div>
            <p className="instructorAdminTitle">Instructor View (Admin Access)</p>
            <p className="instructorAdminText">
              Switch between instructors without changing any existing behavior.
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
                    {ins.full_name} {ins.email ? `(${ins.email})` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedInstructor && (
            <div className="instructorMuted">
              Now viewing: <strong>{selectedInstructor.full_name}</strong>
            </div>
          )}

          {selectorError ? <div className="instructorError">{selectorError}</div> : null}
        </div>
      )}

      {err ? <div className="instructorError">{err}</div> : null}

      {loading ? (
        <div className="instructorContentCard">
          <div className="instructorMuted">Loading dashboard data…</div>
        </div>
      ) : (
        <>
          <div className="instructorHeroCard">
            <div className="instructorHeroEyebrow">Teaching overview</div>
            <h3 className="instructorHeroTitle">Welcome back, {displayName}</h3>
            <p className="instructorHeroText">
              
            </p>
          </div>

          <div className="instructorStatsGrid">
            <StatCard
              icon={BookOpen}
              title="Assigned Items"
              value={stats.assignedClasses}
            />
            <StatCard
              icon={Users}
              title="Total Enrollments"
              value={stats.totalEnrollments}
            />
            <StatCard
              icon={CalendarCheck2}
              title="Classes Marked Today"
              value={stats.classesMarkedToday}
            />
            <StatCard
              icon={ClipboardList}
              title="Pending Attendance"
              value={stats.pendingAttendanceToday}
            />
          </div>

          <div className="instructorContentCard">
            <div className="instructorSectionHeader">
              <div>
                <h3 className="instructorSectionTitle">
                  {isAdminInstructorView
                    ? "Selected Instructor Classes and Events"
                    : "My Assigned Classes and Events"}
                </h3>
                <p className="instructorSectionText">
                  A quick view of scheduled items and today&apos;s attendance counts.
                </p>
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="instructorMuted">No assigned classes found.</div>
            ) : (
              <div className="instructorTableOuter">
                <table className="instructorTable">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Enrolled</th>
                      <th>Today Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <span className="instructorStatusPill">
                            {c.item_type || "-"}
                          </span>
                        </td>
                        <td>{c.title || `Class #${c.id}`}</td>
                        <td>
                          {c.event_date ? String(c.event_date).slice(0, 10) : "-"}
                        </td>
                        <td>
                          {c.start_time ? String(c.start_time).slice(0, 5) : "-"}
                          {c.end_time ? ` - ${String(c.end_time).slice(0, 5)}` : ""}
                        </td>
                        <td>{Number(c.enrolled_count || 0)}</td>
                        <td>
                          {c.item_type === "CLASS"
                            ? Number(c.today_attendance_count || 0)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="instructorStatCard">
      <div className="instructorStatIcon">
        <Icon size={20} strokeWidth={2} />
      </div>

      <div>
        <div className="instructorStatLabel">{title}</div>
        <div className="instructorStatValue">{value}</div>
      </div>
    </div>
  );
}