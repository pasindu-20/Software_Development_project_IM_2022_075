import { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/StatCard";
import { adminCardsApi, inquiryByStatusApi, monthlyRevenueApi } from "../../api/adminApi";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard() {
  const [cards, setCards] = useState(null);
  const [inqStatus, setInqStatus] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const run = async () => {
    setErr("");
    setLoading(true);

    try {
      const results = await Promise.allSettled([
        adminCardsApi(),
        inquiryByStatusApi(),
        monthlyRevenueApi(),
      ]);

      const [cardsRes, statusRes, revenueRes] = results;

      if (cardsRes.status === "fulfilled") {
        setCards(cardsRes.value.data);
      } else {
        console.error("Cards load failed:", cardsRes.reason);
      }

      if (statusRes.status === "fulfilled") {
        setInqStatus(statusRes.value.data || []);
      } else {
        console.error("Inquiry status load failed:", statusRes.reason);
      }

      if (revenueRes.status === "fulfilled") {
        setRevenue(revenueRes.value.data || []);
      } else {
        console.error("Revenue load failed:", revenueRes.reason);
        setErr(
          revenueRes.reason?.response?.data?.message ||
            "Failed to load monthly revenue"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  run();
}, []);

  const revenueTotal = useMemo(() => {
    const v = cards?.totalRevenue;
    if (typeof v === "number") return v.toLocaleString();
    return "-";
  }, [cards]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div style={{ color: "#666", marginTop: 6 }}>
          Admin analytics overview (KPI cards + charts)
        </div>
      </div>

      {err ? (
        <div style={{ background: "#fff0f0", border: "1px solid #ffd6d6", padding: 12, borderRadius: 12, color: "#b00020" }}>
          {err}
        </div>
      ) : null}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
        <StatCard title="Total Inquiries" value={cards?.totalInquiries} />
        <StatCard title="New Inquiries" value={cards?.newInquiries} />
        <StatCard title="Total Enrollments" value={cards?.totalEnrollments} />
        <StatCard title="Total Revenue (LKR)" value={revenueTotal} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Inquiries by Status</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={inqStatus} dataKey="count" nameKey="status" outerRadius={90} />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {loading ? <div style={{ color: "#777", fontSize: 12 }}>Loading…</div> : null}
        </div>

        <div style={{ background: "white", border: "1px solid #eee", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Monthly Revenue</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {loading ? <div style={{ color: "#777", fontSize: 12 }}>Loading…</div> : null}
        </div>
      </div>
    </div>
  );
}
