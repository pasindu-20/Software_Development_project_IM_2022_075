import { useEffect, useState } from "react";
import {
  listInquiriesApi,
  listInquiryFollowupsApi,
  sendInquiryReplyApi,
  updateInquiryStatusApi,
} from "../../api/receptionApi";

const APP_NAME = "Poddo Play House";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
};

const buildDefaultReplySubject = (row) => {
  const type = String(row?.inquiry_type || "general").toLowerCase();
  return `Re: Your ${type} inquiry to ${APP_NAME}`;
};

const isEmailReplyNote = (note) =>
  String(note || "").trim().startsWith("[EMAIL_REPLY]");

const cleanHistoryNote = (note) =>
  String(note || "").replace(/^\[EMAIL_REPLY\]\s*/, "").trim();

export default function RecInquiries() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [followups, setFollowups] = useState([]);
  const [followupsLoading, setFollowupsLoading] = useState(false);

  const load = async ({ keepInfo = false } = {}) => {
    setErr("");
    if (!keepInfo) setInfo("");
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

  const loadFollowups = async (inquiryId) => {
    if (!inquiryId) return;

    setFollowupsLoading(true);

    try {
      const res = await listInquiryFollowupsApi(inquiryId);
      setFollowups(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setFollowups([]);
    } finally {
      setFollowupsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };

    if (showModal) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showModal]);

  const openInquiryModal = async (row) => {
    setSelected(row);
    setShowModal(true);
    setErr("");
    setInfo("");
    setReplySubject(buildDefaultReplySubject(row));
    setReplyMessage("");
    setFollowups([]);
    await loadFollowups(row.id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelected(null);
    setReplySubject("");
    setReplyMessage("");
    setFollowups([]);
  };

  const updateStatus = async (id, status) => {
    setErr("");
    setInfo("");
    setBusyId(id);

    try {
      await updateInquiryStatusApi(id, status);
      await load({ keepInfo: true });

      setInfo("Inquiry updated successfully.");

      if (selected?.id === id) {
        setSelected((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to update inquiry");
    } finally {
      setBusyId(null);
    }
  };

  const sendReply = async () => {
    if (!selected) return;

    setErr("");
    setInfo("");

    if (!replySubject.trim()) {
      setErr("Reply subject is required.");
      return;
    }

    if (!replyMessage.trim()) {
      setErr("Reply message is required.");
      return;
    }

    setSendingReply(true);

    try {
      await sendInquiryReplyApi(selected.id, {
        subject: replySubject.trim(),
        message: replyMessage.trim(),
      });

      await load({ keepInfo: true });
      await loadFollowups(selected.id);

      setSelected((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === "NEW" ? "CONTACTED" : prev.status,
            }
          : prev
      );

      setReplyMessage("");
      setInfo("Reply email sent successfully.");
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to send reply");
    } finally {
      setSendingReply(false);
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
              maxWidth: 900,
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

            <div style={{ marginBottom: 20 }}>
              <strong>Reply to Customer:</strong>

              <div
                style={{
                  marginTop: 10,
                  display: "grid",
                  gap: 10,
                  padding: 14,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "#fcfcfc",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Subject
                  </div>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="Enter reply subject"
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #ccc",
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    Reply Message
                  </div>
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply to the customer here..."
                    rows={6}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #ccc",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ fontSize: 13, color: "#666" }}>
                    Reply will be sent to: <strong>{selected.email || "No email"}</strong>
                  </div>

                  <button onClick={sendReply} disabled={sendingReply}>
                    {sendingReply ? "Sending..." : "Send Reply Email"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <strong>Reply / Follow-up History:</strong>

              <div
                style={{
                  marginTop: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  background: "#fafafa",
                  padding: 12,
                }}
              >
                {followupsLoading ? (
                  <div>Loading history...</div>
                ) : followups.length === 0 ? (
                  <div style={{ color: "#666" }}>No follow-up history yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 10 }}>
                    {followups.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          border: "1px solid #e3e3e3",
                          borderRadius: 8,
                          background: "#fff",
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                            marginBottom: 8,
                          }}
                        >
                          <div>
                            <strong>{item.staff_name || "Staff"}</strong>
                          </div>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {isEmailReplyNote(item.note) ? "Email Reply" : "Follow Up"} •{" "}
                            {formatDateTime(item.created_at)}
                          </div>
                        </div>

                        <div
                          style={{
                            whiteSpace: "pre-wrap",
                            lineHeight: 1.6,
                            color: "#333",
                          }}
                        >
                          {cleanHistoryNote(item.note)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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