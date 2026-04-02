import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Sidebar({ title, items }) {
  const { logout, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminInsideReception =
    role === "ADMIN" && location.pathname.startsWith("/reception");

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

      {isAdminInsideReception && (
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