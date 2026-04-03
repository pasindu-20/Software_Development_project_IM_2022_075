import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { useAuth } from "../auth/useAuth";

const instructorIconMap = {
  Dashboard: LayoutDashboard,
  "View Assigned Classes": BookOpen,
  "View Enrolled Children": Users,
  "Mark Attendance": ClipboardCheck,
  "View Attendance Records": CalendarDays,
};

export default function Sidebar({ title, items }) {
  const { logout, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isInstructorPortal = location.pathname.startsWith("/instructor");
  const isAdminInsideStaffView =
    role === "ADMIN" &&
    (
      location.pathname.startsWith("/reception") ||
      location.pathname.startsWith("/instructor")
    );

  if (isInstructorPortal) {
    return (
      <aside className="sidebarInstructorShell">
        <div className="sidebarInstructorTop">
          <div className="sidebarInstructorBrand">
            <div className="sidebarInstructorBrandMark">
              <img
                src="https://res.cloudinary.com/du6mnjqdn/image/upload/v1775075925/images_qw2txg.png"
                alt="Company Logo"
                className="sidebarInstructorBrandImage"
              />
            </div>
            <div>
              <div className="sidebarInstructorBrandName">Poddo Play House</div>
              <div className="sidebarInstructorBrandSub">Instructor Dashboard</div>
            </div>
          </div>

          <div className="sidebarInstructorSectionLabel"></div>

          <nav className="sidebarInstructorNav">
            {items.map((x) => {
              const Icon = instructorIconMap[x.label] || LayoutDashboard;

              return (
                <NavLink
                  key={x.to}
                  to={x.to}
                  className={({ isActive }) =>
                    `sidebarInstructorLink${isActive ? " sidebarInstructorLinkActive" : ""}`
                  }
                >
                  <Icon size={18} strokeWidth={2} />
                  <span>{x.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="sidebarInstructorBottom">
          {isAdminInsideStaffView && (
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="sidebarInstructorSecondaryButton"
              type="button"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              <span>Back to Admin Dashboard</span>
            </button>
          )}

          <button
            onClick={logout}
            className="sidebarInstructorLogoutButton"
            type="button"
          >
            <LogOut size={16} strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside style={{ padding: 16, borderRight: "1px solid #eee", background: "white" }}>
      <h3>{title}</h3>

      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {items.map((x) => (
          <NavLink
            key={x.to}
            to={x.to}
            style={({ isActive }) => ({
              padding: 10,
              borderRadius: 10,
              textDecoration: "none",
              background: isActive ? "#f3d4f6" : "transparent",
              color: "#222",
            })}
          >
            {x.label}
          </NavLink>
        ))}
      </div>

      {isAdminInsideStaffView && (
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{
            marginTop: 20,
            width: "100%",
            border: "none",
            borderRadius: 10,
            padding: "10px 12px",
            background: "#222",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Back to Admin Dashboard
        </button>
      )}

      <button onClick={logout} style={{ marginTop: 20, width: "100%" }}>
        Logout
      </button>
    </aside>
  );
}