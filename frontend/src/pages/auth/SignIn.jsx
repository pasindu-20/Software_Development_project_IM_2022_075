import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../auth/useAuth";

export default function SignIn() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      const data = await login({ email, password }); // ✅ now returns backend data

      // Force password change (staff first login)
      if (data.force_password_change) {
        return nav("/auth/change-password");
      }

      // Parents go to Profile (acts as parent dashboard)
      if (data.role === "PARENT") {
        return nav("/profile");
      }

      // Staff should use staff portal login
      // IMPORTANT: don't clear token if role is staff (optional) - but per your rule, we block here:
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("force_password_change");

      return setErr("Staff accounts must log in from Staff Portal.");
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Sign In" subtitle="Parent / Customer Login">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <input
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button disabled={busy} type="submit">
          {busy ? "Signing in..." : "Sign In"}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <Link to="/auth/forgot">Forgot password?</Link>
          <Link to="/auth/signup">Create account</Link>
        </div>

        <div style={{ marginTop: 10, fontSize: 13 }}>
          Staff login: <Link to="/admin/signin">Go to Staff Portal</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
