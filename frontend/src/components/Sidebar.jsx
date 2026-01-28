import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function Sidebar({ title, items }) {
  const { logout } = useAuth();

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

      <button onClick={logout} style={{ marginTop: 20, width: "100%" }}>
        Logout
      </button>
    </aside>
  );
}
