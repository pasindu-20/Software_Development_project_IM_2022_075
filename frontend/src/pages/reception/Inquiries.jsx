import { useEffect, useState } from "react";
import { listInquiriesApi, updateInquiryStatusApi } from "../../api/receptionApi";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

export default function RecInquiries() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setErr("");
    setInfo("");
    setLoading(true);

    try {
      const res = await listInquiriesApi();

      const data = Array.isArray(res.data?.inquiries)
        ? res.data.inquiries
        : Array.isArray(res.data)
        ? res.data
        : [];

      setRows(data);
    } catch (e) {
      setRows([]);
      setErr(e?.response?.data?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    if (showModal) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showModal]);

  const openInquiryModal = (row) => {
    setSelected(row);
    setShowModal(true);
    setErr("");
    setInfo("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
  };

  const updateStatus = async (id, status) => {
    setErr("");
    setInfo("");
    setBusyId(id);

    try {
      await updateInquiryStatusApi(id, status);
      setInfo("Inquiry updated successfully.");
      await load();

      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status } : prev));
      }
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
          <div>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ color: "#666" }}>No inquiries found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table width="100%" cellPadding="8" border="1">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((q) => (
                  <tr key={q.id}>
                    <td>{q.id}</td>
                    <td>{q.customer_name || "—"}</td>
                    <td>{q.phone || "—"}</td>
                    <td>{q.email || "—"}</td>
                    <td>{q.inquiry_type || "—"}</td>
                    <td>{q.status || "NEW"}</td>
                    <td>{formatDateTime(q.created_at)}</td>
                    <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => openInquiryModal(q)}>View Message</button>

                      <button
                        onClick={() => updateStatus(q.id, "CONTACTED")}
                        disabled={busyId === q.id}
                      >
                        {busyId === q.id ? "Updating..." : "Contacted"}
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
          </div>
        )}
      </div>

      {showModal && selected && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 800,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <h3 style={{ margin: 0 }}>Inquiry Details</h3>
              <button onClick={closeModal}>X</button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <div>
                <strong>ID:</strong>
                <div>{selected.id}</div>
              </div>

              <div>
                <strong>Customer:</strong>
                <div>{selected.customer_name || "—"}</div>
              </div>

              <div>
                <strong>Phone:</strong>
                <div>{selected.phone || "—"}</div>
              </div>

              <div>
                <strong>Email:</strong>
                <div>{selected.email || "—"}</div>
              </div>

              <div>
                <strong>Type:</strong>
                <div>{selected.inquiry_type || "—"}</div>
              </div>

              <div>
                <strong>Status:</strong>
                <div>{selected.status || "NEW"}</div>
              </div>

              <div>
                <strong>Created At:</strong>
                <div>{formatDateTime(selected.created_at)}</div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <strong>Message:</strong>
              <div
                style={{
                  marginTop: 8,
                  padding: 14,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "#fafafa",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  minHeight: 120,
                }}
              >
                {selected.message || "No message available."}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => updateStatus(selected.id, "CONTACTED")}
                disabled={busyId === selected.id}
              >
                {busyId === selected.id ? "Updating..." : "Mark as Contacted"}
              </button>

              <button
                onClick={() => updateStatus(selected.id, "FOLLOW_UP")}
                disabled={busyId === selected.id}
              >
                Follow Up
              </button>

              <button
                onClick={() => updateStatus(selected.id, "CONVERTED")}
                disabled={busyId === selected.id}
              >
                Converted
              </button>

              <button
                onClick={() => updateStatus(selected.id, "CLOSED")}
                disabled={busyId === selected.id}
              >
                Close
              </button>

              <button onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}