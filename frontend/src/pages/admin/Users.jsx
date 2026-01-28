import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import { createStaffUserApi, listStaffUsersApi } from "../../api/adminUsersApi";

export default function AdminUsers() {
  const [rows, setRows] = useState([]);

  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("RECEPTIONIST"); // default

  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setErr("");
    try {
      const res = await listStaffUsersApi();
      setRows(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load staff users");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    setErr("");
    setInfo("");

    if (!full_name || !email) {
      return setErr("Full name and email are required");
    }

    setBusy(true);
    try {
      const res = await createStaffUserApi({
        full_name,
        email,
        phone: phone || null,
        role, // "RECEPTIONIST" | "INSTRUCTOR"
      });

      // backend returns tempPassword
      const tempPassword = res?.data?.tempPassword;

      setInfo(
        tempPassword
          ? `Staff user created ✅ Temporary password: ${tempPassword}`
          : "Staff user created successfully ✅"
      );

      setFullName("");
      setEmail("");
      setPhone("");
      setRole("RECEPTIONIST");

      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: "id", header: "ID" },
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "role", header: "Role" }, // backend should return role as string
    { key: "status", header: "Status" },
    {
      key: "force_password_change",
      header: "Must Change Password",
      render: (r) => (r.force_password_change ? "YES" : "NO"),
    },
    {
      key: "created_at",
      header: "Created",
      render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString() : "-"),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0 }}>User Management</h2>
        <div style={{ color: "#666", marginTop: 6 }}>
          Create Receptionist and Instructor accounts (Admin only).
        </div>
      </div>

      {err ? (
        <div
          style={{
            background: "#fff0f0",
            border: "1px solid #ffd6d6",
            padding: 12,
            borderRadius: 12,
            color: "#b00020",
          }}
        >
          {err}
        </div>
      ) : null}

      {info ? (
        <div
          style={{
            background: "#f0fff4",
            border: "1px solid #b7ebc6",
            padding: 12,
            borderRadius: 12,
            color: "#0a6b2b",
            whiteSpace: "pre-wrap",
          }}
        >
          {info}
        </div>
      ) : null}

      <form
        onSubmit={createUser}
        style={{
          background: "white",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 14,
          display: "grid",
          gap: 10,
          maxWidth: 560,
        }}
      >
        <div style={{ fontWeight: 700 }}>Create Staff Account</div>

        <input
          placeholder="Full name"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        <input
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="INSTRUCTOR">Instructor</option>
        </select>

        <button disabled={busy} type="submit">
          {busy ? "Creating..." : "Create Staff User"}
        </button>

        <div style={{ fontSize: 12, color: "#777" }}>
          The system generates a temporary password. Staff must change it on first login.
        </div>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 700 }}>Staff Users</div>
        <button onClick={load} style={{ padding: "6px 10px" }}>
          Refresh
        </button>
      </div>

      <SimpleTable columns={columns} rows={rows} />
    </div>
  );
}
