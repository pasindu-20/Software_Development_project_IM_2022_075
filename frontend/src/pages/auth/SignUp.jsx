import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { registerApi } from "../../api/authApi";

export default function SignUp() {
  const nav = useNavigate();

  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      await registerApi({ full_name, email, phone, password });
      nav("/auth/signin");
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Sign Up" subtitle="Create a parent account">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Full name"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        <input
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          minLength={8}
          required
        />

        {err && <div style={{ color: "crimson" }}>{err}</div>}

        <button disabled={busy} type="submit">
          {busy ? "Creating..." : "Create Account"}
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <Link to="/auth/signin">Back to Sign In</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
