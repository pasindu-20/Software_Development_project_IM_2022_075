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

const isEmailReplyNote = (note) => String(note || "").trim().startsWith("[EMAIL_REPLY]");
const cleanHistoryNote = (note) => String(note || "").replace(/^\[EMAIL_REPLY\]\s*/, "").trim();

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
    } catch {
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
        prev ? { ...prev, status: prev.status === "NEW" ? "CONTACTED" : prev.status } : prev
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
    <div className="instructorPage receptionPage receptionInquiriesPage">
      <div className="instructorPageHeader">
        <h2 className="instructorPageTitle">Customer Inquiries</h2>
      </div>

      <div className="instructorContentCard">
        <div className="instructorSectionHeader">
          <div>
            <h3 className="instructorSectionTitle">Inquiry Queue</h3>
            <p className="instructorSectionText">
             
            </p>
          </div>
        </div>

        {err ? <div className="instructorError">{err}</div> : null}
        {info ? <div className="instructorSuccess">{info}</div> : null}

        {loading ? (
          <div className="instructorMuted">Loading inquiries…</div>
        ) : rows.length === 0 ? (
          <div className="instructorMuted">No inquiries found.</div>
        ) : (
          <div className="instructorTableOuter">
            <table className="instructorTable">
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
                    <td>
                      <span className={`receptionStatusPill ${String(q.status || "new").toLowerCase()}`}>
                        {q.status || "NEW"}
                      </span>
                    </td>
                    <td>{formatDateTime(q.created_at)}</td>
                    <td>
                      <div className="receptionTableActions">
                        <button className="receptionMiniButton" onClick={() => openInquiryModal(q)} type="button">
                          View Message
                        </button>
                        <button
                          className="receptionMiniButton"
                          onClick={() => updateStatus(q.id, "CONTACTED")}
                          disabled={busyId === q.id}
                          type="button"
                        >
                          {busyId === q.id ? "Updating..." : "Contacted"}
                        </button>
                        <button
                          className="receptionMiniButton"
                          onClick={() => updateStatus(q.id, "FOLLOW_UP")}
                          disabled={busyId === q.id}
                          type="button"
                        >
                          Follow Up
                        </button>
                        <button
                          className="receptionMiniButton"
                          onClick={() => updateStatus(q.id, "CONVERTED")}
                          disabled={busyId === q.id}
                          type="button"
                        >
                          Converted
                        </button>
                        <button
                          className="receptionMiniButton"
                          onClick={() => updateStatus(q.id, "CLOSED")}
                          disabled={busyId === q.id}
                          type="button"
                        >
                          Close
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selected ? (
        <div className="receptionModalOverlay" onClick={closeModal}>
          <div className="receptionModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="receptionModalHeader">
              <div>
                <h3 className="instructorSectionTitle">Inquiry Details</h3>
                <p className="instructorSectionText">View the message, reply, and review follow-up history.</p>
              </div>
              <button className="receptionIconButton" onClick={closeModal} type="button">
                ×
              </button>
            </div>

            <div className="receptionDetailBox">
              <div className="receptionDetailGrid">
                <div className="receptionDetailItem"><strong>ID:</strong> {selected.id}</div>
                <div className="receptionDetailItem"><strong>Customer:</strong> {selected.customer_name || "—"}</div>
                <div className="receptionDetailItem"><strong>Phone:</strong> {selected.phone || "—"}</div>
                <div className="receptionDetailItem"><strong>Email:</strong> {selected.email || "—"}</div>
                <div className="receptionDetailItem"><strong>Type:</strong> {selected.inquiry_type || "—"}</div>
                <div className="receptionDetailItem"><strong>Status:</strong> {selected.status || "NEW"}</div>
                <div className="receptionDetailItem"><strong>Created At:</strong> {formatDateTime(selected.created_at)}</div>
              </div>
            </div>

            <div className="receptionDetailBox">
              <div className="receptionDetailTitle">Message</div>
              <div className="receptionMessageBox">{selected.message || "No message available."}</div>
            </div>

            <div className="receptionDetailBox">
              <div className="receptionDetailTitle">Reply to Customer</div>
              <div className="receptionStack">
                <label className="instructorField">
                  <span className="instructorFieldLabel">Subject</span>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    placeholder="Enter reply subject"
                  />
                </label>

                <label className="instructorField">
                  <span className="instructorFieldLabel">Reply Message</span>
                  <textarea
                    className="receptionTextarea"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply to the customer here..."
                    rows={6}
                  />
                </label>

                <div className="receptionButtonRow receptionButtonRowBetween">
                  <div className="instructorMuted">
                    Reply will be sent to: <strong>{selected.email || "No email"}</strong>
                  </div>
                  <button className="instructorButton" onClick={sendReply} disabled={sendingReply} type="button">
                    {sendingReply ? "Sending..." : "Send Reply Email"}
                  </button>
                </div>
              </div>
            </div>

            <div className="receptionDetailBox">
              <div className="receptionDetailTitle">Reply / Follow-up History</div>

              {followupsLoading ? (
                <div className="instructorMuted">Loading history...</div>
              ) : followups.length === 0 ? (
                <div className="instructorMuted">No follow-up history yet.</div>
              ) : (
                <div className="receptionCardStack">
                  {followups.map((item) => (
                    <div key={item.id} className="receptionHistoryCard">
                      <div className="receptionButtonRow receptionButtonRowBetween receptionHistoryHeader">
                        <strong>{item.staff_name || "Staff"}</strong>
                        <span className="instructorMuted">
                          {isEmailReplyNote(item.note) ? "Email Reply" : "Follow Up"} • {formatDateTime(item.created_at)}
                        </span>
                      </div>
                      <div className="receptionHistoryText">{cleanHistoryNote(item.note)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="receptionButtonRow receptionButtonRowEnd">
              <button
                className="receptionSecondaryButton"
                onClick={() => updateStatus(selected.id, "CONTACTED")}
                disabled={busyId === selected.id}
                type="button"
              >
                {busyId === selected.id ? "Updating..." : "Mark as Contacted"}
              </button>
              <button
                className="receptionSecondaryButton"
                onClick={() => updateStatus(selected.id, "FOLLOW_UP")}
                disabled={busyId === selected.id}
                type="button"
              >
                Follow Up
              </button>
              <button
                className="receptionSecondaryButton"
                onClick={() => updateStatus(selected.id, "CONVERTED")}
                disabled={busyId === selected.id}
                type="button"
              >
                Converted
              </button>
              <button
                className="receptionSecondaryButton"
                onClick={() => updateStatus(selected.id, "CLOSED")}
                disabled={busyId === selected.id}
                type="button"
              >
                Close Inquiry
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}