import { useEffect, useState } from "react";
import SimpleTable from "../../components/SimpleTable";
import api from "../../api/axios";

function getStatusClassName(value) {
  const v = String(value || "").toLowerCase();
  if (v === "paid" || v === "success" || v === "completed" || v === "approved") {
    return "active";
  }
  if (v === "pending") return "pending";
  if (v === "failed" || v === "rejected" || v === "cancelled") return "inactive";
  return "";
}

export default function AdminPayments() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const res = await api.get("/api/admin/payments");
      setRows(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load payments (Unauthorized?)");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cols = [
    { key: "payment_no", header: "Receipt" },
    { key: "payer_name", header: "Customer" },
    {
      key: "amount",
      header: "Amount",
      render: (r) => `LKR ${Number(r.amount || 0).toFixed(2)}`,
    },
    { key: "payment_method", header: "Method" },
    {
      key: "payment_status",
      header: "Status",
      render: (r) => (
        <span className={`adminStatusPill ${getStatusClassName(r.payment_status)}`}>
          {r.payment_status || "-"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      render: (r) =>
        r.created_at ? new Date(r.created_at).toLocaleString() : "-",
    },
  ];

  return (
    <div className="instructorPage adminPageStack">
      <div className="instructorPageHeader adminPageHeader">
        <div className="adminPageTitleBlock">
          <h2 className="instructorPageTitle">Manage Payments</h2>
          <p className="adminPageTitleSub">
            View all cash, bank transfer, and card payments.
          </p>
        </div>
      </div>

      {err ? <div className="adminNotice adminNoticeError">{err}</div> : null}

      <div className="instructorContentCard adminTableCard">
        <div className="adminTableToolbar">
          <div className="adminTableTitleGroup">
            <h3 className="adminTableTitle">Payments</h3>
            <p className="adminTableText">All recorded payment transactions.</p>
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