import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/AuthLayout";
import { forgotPasswordApi } from "../../api/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");
    setBusy(true);

    try {
      const res = await forgotPasswordApi({ email });
      // backend returns generic msg + dev link in dev mode
      setInfo(res.data?.message || "If the email exists, a reset link will be sent.");

      if (res.data?.dev_reset_link) {
        setInfo((prev) => prev + `\nDEV LINK: ${res.data.dev_reset_link}`);
      }
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="We will send a reset link">
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />

        {err && <div style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{err}</div>}
        {info && <div style={{ color: "green", whiteSpace: "pre-wrap" }}>{info}</div>}

        <button disabled={busy} type="submit">
          {busy ? "Sending..." : "Send reset link"}
        </button>

        <div style={{ fontSize: 13 }}>
          <Link to="/auth/signin">Back to Sign In</Link>
        </div>
      </form>
    </AuthLayout>
  );
}
