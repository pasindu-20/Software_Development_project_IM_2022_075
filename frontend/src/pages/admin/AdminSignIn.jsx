import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { useAuth } from "../../auth/useAuth";

export default function AdminSignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("root@poddo.lk");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      const data = await login({ email, password });

      if (data.role !== "ADMIN") {
        setErr("Access denied. Not an admin account.");
        return;
      }

      navigate("/admin/dashboard");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Admin login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Admin Portal Sign In" subtitle="Admin access only">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
        {err ? <div style={{ color: "crimson" }}>{err}</div> : null}
        <button disabled={busy} type="submit">{busy ? "Signing in..." : "Sign In (Admin)"}</button>
      </form>
    </AuthLayout>
  );
}
