import { useEffect, useState } from "react";
import { listInquiriesApi, updateInquiryStatusApi } from "../../api/receptionApi";

export default function RecInquiries() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setErr("");
    setInfo("");
    setLoading(true);
    try {
      const res = await listInquiriesApi();
      setRows(res.data || []);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setErr("");
    setInfo("");
    setBusyId(id);

    try {
      await updateInquiryStatusApi(id, status);
      setInfo("Inquiry updated.");
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update inquiry");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Customer Inquiries</h2>

      <div style={{ background: "white", padding: 16, borderRadius: 12 }}>
        {err && <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>}
        {info && <div style={{ color: "green", marginBottom: 10 }}>{info}</div>}

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#666" }}>No inquiries found.</div>
        ) : (
          <table width="100%" cellPadding="8" border="1">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td>{q.customer_name || "—"}</td>
                  <td>{q.phone || "—"}</td>
                  <td>{q.inquiry_type || "—"}</td>
                  <td>{q.status || "NEW"}</td>
                  <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => updateStatus(q.id, "CONTACTED")}
                      disabled={busyId === q.id}
                    >
                      {busyId === q.id ? "Updating…" : "Contacted"}
                    </button>

                    <button
                      onClick={() => updateStatus(q.id, "FOLLOW_UP")}
                      disabled={busyId === q.id}
                    >
                      Follow Up
                    </button>

                    <button
                      onClick={() => updateStatus(q.id, "CONVERTED")}
                      disabled={busyId === q.id}
                    >
                      Converted
                    </button>

                    <button
                      onClick={() => updateStatus(q.id, "CLOSED")}
                      disabled={busyId === q.id}
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}