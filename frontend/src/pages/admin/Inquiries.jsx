import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

function getStatusClassName(value) {
  const v = String(value || "").toLowerCase();
  if (v === "converted" || v === "contacted" || v === "closed") return "active";
  if (v === "new" || v === "follow_up" || v === "follow-up") return "pending";
  return "";
}

export default function AdminInquiries() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const res = await api.get("/api/inquiry");
      const data = Array.isArray(res.data?.inquiries)
        ? res.data.inquiries
        : Array.isArray(res.data)
        ? res.data
        : [];
      setRows(data);
    } catch (e) {
      setErr(
        e?.response?.data?.message || "Failed to load inquiries (Unauthorized?)"
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cols = [
    { key: "id", header: "ID" },
    { key: "customer_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "inquiry_type", header: "Type" },
    { key: "message", header: "Message" },
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
          <h2 className="instructorPageTitle">Customer Inquiry</h2>
          <p className="adminPageTitleSub">
            View all inquiry messages sent through the website.
          </p>
        </div>
      </div>

      {err ? <div className="adminNotice adminNoticeError">{err}</div> : null}

      <div className="instructorContentCard adminTableCard">
        <div className="adminTableToolbar">
          <div className="adminTableTitleGroup">
            <h3 className="adminTableTitle">Inquiries</h3>
            <p className="adminTableText"></p>
          </div>

          <button className="adminGhostButton" onClick={load} type="button">
            Refresh
          </button>
        </div>

        <div className="adminTableWrap">
          <SimpleTable columns={cols} rows={rows} />
        </div>
      </div>
    </div>
  );
}