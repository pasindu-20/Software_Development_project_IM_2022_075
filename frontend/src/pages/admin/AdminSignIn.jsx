import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../auth/useAuth";

export default function AdminSignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const goToPortalByRole = (role) => {
    if (role === "ADMIN") return navigate("/admin/dashboard");
    if (role === "RECEPTIONIST") return navigate("/reception/dashboard");
    if (role === "INSTRUCTOR") return navigate("/instructor/dashboard");

    setErr("Access denied. This account cannot use the staff portal.");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      const data = await login({ email, password });

      // Only staff roles can use this portal
      if (!["ADMIN", "RECEPTIONIST", "INSTRUCTOR"].includes(data.role)) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        localStorage.removeItem("force_password_change");
        setErr("Only staff accounts can log in from the Staff Portal.");
        return;
      }

      // First login: force password change
      if (data.force_password_change) {
        navigate("/auth/change-password");
        return;
      }

      goToPortalByRole(data.role);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Staff login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Staff Portal Sign In" subtitle="Admin, Receptionist, and Instructor access">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          required
        />

        {err ? <div style={{ color: "crimson" }}>{err}</div> : null}

        <button disabled={busy} type="submit">
          {busy ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthLayout>
  );
}