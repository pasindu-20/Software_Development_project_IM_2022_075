// frontend/src/pages/auth/ResetPassword.jsx
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { resetPasswordApi } from "../../api/authApi";

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const prefilledEmail = useMemo(() => params.get("email") || "", [params]);

  console.log("🔍 ResetPassword page loaded");
  console.log("📧 Email from URL:", prefilledEmail);
  console.log("🔗 Full URL:", window.location.href);
  console.log("📍 Hash:", window.location.hash);

  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState("");
  const [new_password, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!email) return setErr("Email is required");
    if (!otp || otp.length !== 6) return setErr("Enter the 6-digit OTP");
    if (!new_password || new_password.length < 8) return setErr("Password must be at least 8 characters");
    if (new_password !== confirm) return setErr("Passwords do not match");

    setBusy(true);
    try {
      await resetPasswordApi({ email, otp, new_password });
      setInfo("✅ Password reset successful. Please sign in.");
      setTimeout(() => nav("/auth/signin"), 800);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" subtitle="Enter OTP + new password">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          placeholder="OTP (6 digits)"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />

        <input
          type="password"
          placeholder="New password"
          value={new_password}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        {err && <div style={{ color: "crimson", fontWeight: 700 }}>{err}</div>}
        {info && <div style={{ color: "green", fontWeight: 700 }}>{info}</div>}

        <button disabled={busy} type="submit">
          {busy ? "Resetting..." : "Reset Password"}
        </button>

        <div style={{ fontSize: 13 }}>
          <Link to="/auth/signin">Back to Sign In</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
