import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import api from "../../api/axios";
import { useAuth } from "../../auth/useAuth";

export default function ChangePassword() {
  const { role } = useAuth();
  const nav = useNavigate();

  const [current_password, setCurrent] = useState("");
  const [new_password, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const goToPortal = () => {
    if (role === "ADMIN") return nav("/admin/dashboard");
    if (role === "RECEPTIONIST") return nav("/reception/dashboard");
    if (role === "INSTRUCTOR") return nav("/instructor/dashboard");
    // Parents go to Profile page (dashboard)
    return nav("/profile");
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (new_password.length < 8) return setErr("New password must be at least 8 characters");
    if (new_password !== confirm) return setErr("Passwords do not match");

    setBusy(true);
    try {
      await api.post("/api/auth/change-password", { current_password, new_password });

      localStorage.setItem("force_password_change", "0");
      setInfo("Password changed successfully");

      setTimeout(goToPortal, 600);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to change password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Change Password" subtitle="Update your password">
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          type="password"
          placeholder="Current password"
          value={current_password}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="New password (min 8 chars)"
          value={new_password}
          onChange={(e) => setNewPass(e.target.value)}
          minLength={8}
          required
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={8}
          required
        />

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {info && <div style={{ color: "green" }}>{info}</div>}

        <button disabled={busy} type="submit">
          {busy ? "Saving..." : "Update Password"}
        </button>
      </form>
    </AuthLayout>
  );
}
