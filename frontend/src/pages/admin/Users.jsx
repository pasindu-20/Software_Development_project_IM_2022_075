import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import { createStaffUserApi, listStaffUsersApi } from "../../api/adminUsersApi";

function getStatusClassName(value) {
  const v = String(value || "").toLowerCase();
  if (v === "active") return "active";
  if (v === "inactive") return "inactive";
  if (v === "pending") return "pending";
  return "";
}

export default function AdminUsers() {
  const [rows, setRows] = useState([]);

  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("RECEPTIONIST");

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
        role,
      });

      const tempPassword = res?.data?.tempPassword;

      setInfo(
        tempPassword
          ? `Staff user created successfully. Temporary password: ${tempPassword}`
          : "Staff user created successfully."
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
    { key: "role", header: "Role" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className={`adminStatusPill ${getStatusClassName(r.status)}`}>
          {r.status || "-"}
        </span>
      ),
    },
    {
      key: "force_password_change",
      header: "Must Change Password",
      render: (r) => (r.force_password_change ? "YES" : "NO"),
    },
    {
      key: "created_at",
      header: "Created",
      render: (r) =>
        r.created_at ? new Date(r.created_at).toLocaleString() : "-",
    },
  ];

  return (
    <div className="instructorPage adminPageStack">
      <div className="instructorPageHeader adminPageHeader">
        <div className="adminPageTitleBlock">
          <h2 className="instructorPageTitle">User Management</h2>
          <p className="adminPageTitleSub">
            Create and view receptionist and instructor staff accounts.
          </p>
        </div>
      </div>

      {err ? <div className="adminNotice adminNoticeError">{err}</div> : null}
      {info ? <div className="adminNotice adminNoticeSuccess">{info}</div> : null}

      <form
        onSubmit={createUser}
        className="instructorContentCard adminFormCard adminFormLimit"
      >
        <div className="adminCardHeader">
          <div>
            <h3 className="adminCardTitle">Create Staff Account</h3>
            <p className="adminCardText">
            
            </p>
          </div>
        </div>

        <div className="adminFormGrid">
          <label className="adminField">
            <span className="adminFieldLabel">Full name</span>
            <input
              className="adminInput"
              placeholder="Enter full name"
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label className="adminField">
            <span className="adminFieldLabel">Email</span>
            <input
              className="adminInput"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </label>

          <div className="adminFormGrid2">
            <label className="adminField">
              <span className="adminFieldLabel">Phone</span>
              <input
                className="adminInput"
                placeholder="Optional phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label className="adminField">
              <span className="adminFieldLabel">Role</span>
              <select
                className="adminSelect"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </label>
          </div>

          <div className="adminButtonRow">
            <button className="adminPrimaryButton" disabled={busy} type="submit">
              {busy ? "Creating..." : "Create Staff User"}
            </button>
          </div>

          <div className="adminFormFooterText">
            Staff users will be asked to change their password on first login.
          </div>
        </div>
      </form>

      <div className="instructorContentCard adminTableCard">
        <div className="adminTableToolbar">
          <div className="adminTableTitleGroup">
            <h3 className="adminTableTitle">Staff Users</h3>
            <p className="adminTableText">All receptionist and instructor accounts.</p>
          </div>

          <button onClick={load} className="adminGhostButton" type="button">
            Refresh
          </button>
        </div>

        <div className="adminTableWrap">
          <SimpleTable columns={columns} rows={rows} />
        </div>
      </div>
    </div>
  );
}