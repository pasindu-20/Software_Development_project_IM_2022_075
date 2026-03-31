import { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/StatCard";
import {
  adminCardsApi,
  inquiryByStatusApi,
  monthlyRevenueApi,
} from "../../api/adminApi";

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
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const [cards, setCards] = useState(null);
  const [inqStatus, setInqStatus] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const revenueBarColors = ["#c9abd9", "#a78bfa", "#7c3aed"];
  const inquiryStatusColors = {
    NEW: "#a78bfa",
    FOLLOW_UP: "#f59e0b",
    CONTACTED: "#10b981",
    CONVERTED: "#3b82f6",
    CLOSED: "#ef4444",
  };

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

  const revenueYAxisMax = useMemo(() => {
    const maxValue = revenue.reduce(
      (max, item) => Math.max(max, Number(item.total || 0)),
      0
    );

    if (maxValue <= 0) return 1000;

    const paddedMax = maxValue * 1.15;
    return Math.ceil(paddedMax / 1000) * 1000;
  }, [revenue]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: 0 }}>Dashboard</h2>
        <div style={{ color: "#666", marginTop: 6 }}>
          Admin analytics overview (KPI cards + charts)
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <StatCard title="Total Inquiries" value={cards?.totalInquiries} />
        <StatCard title="New Inquiries" value={cards?.newInquiries} />
        <StatCard title="Total Enrollments" value={cards?.totalEnrollments} />
        <StatCard title="Total Revenue (LKR)" value={revenueTotal} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div
          style={{
            background: "white",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Inquiries by Status
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inqStatus}
                  dataKey="count"
                  nameKey="status"
                  outerRadius={90}
                >
                  {inqStatus.map((entry, index) => (
                    <Cell
                      key={`pie-cell-${entry.status}-${index}`}
                      fill={inquiryStatusColors[entry.status] || "#c9abd9"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {loading ? (
            <div style={{ color: "#777", fontSize: 12 }}>Loading…</div>
          ) : null}
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            Monthly Revenue
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenue}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" />
                <YAxis
                  domain={[0, revenueYAxisMax]}
                  tickFormatter={(value) => Number(value).toLocaleString()}
                />
                <Tooltip
                  formatter={(value) => [
                    `LKR ${Number(value || 0).toLocaleString()}`,
                    "Revenue",
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullMonthLabel || ""
                  }
                />
                <Bar dataKey="total" name="Revenue (LKR)">
                  {revenue.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.month}-${index}`}
                      fill={revenueBarColors[index % revenueBarColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {loading ? (
            <div style={{ color: "#777", fontSize: 12 }}>Loading…</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}