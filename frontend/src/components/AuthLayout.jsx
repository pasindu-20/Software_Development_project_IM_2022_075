import { Link } from "react-router-dom";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fde7f3, #fff1f7)",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          {subtitle && (
            <div style={{ color: "#666", fontSize: 13, marginTop: 6 }}>
              {subtitle}
            </div>
          )}
        </div>

        <div>{children}</div>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "#777" }}>
          © {new Date().getFullYear()} Poddo Playhouse
        </div>
      </div>
    </div>
  );
}
