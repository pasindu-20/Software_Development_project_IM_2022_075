import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Download,
  GraduationCap,
  Landmark,
  MessageCircleMore,
} from "lucide-react";
import {
  adminCardsApi,
  downloadIncomeReportApi,
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

function getFileNameFromDisposition(disposition, fallback) {
  const value = String(disposition || "");
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const simpleMatch = value.match(/filename="?([^";]+)"?/i);
  if (simpleMatch?.[1]) {
    return simpleMatch[1];
  }

  return fallback;
}

function buildReportMonthOptions(startYear = 2026, startMonth = 2) {
  const options = [];
  const today = new Date();

  const start = new Date(startYear, startMonth - 1, 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;

    options.push({
      value: `${year}-${String(month).padStart(2, "0")}`,
      label: cursor.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return options;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [cards, setCards] = useState(null);
  const [inqStatus, setInqStatus] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [selectedReportMonth, setSelectedReportMonth] = useState("");
  const [downloadingReport, setDownloadingReport] = useState(false);
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

  const reportMonthOptions = useMemo(() => {
    return buildReportMonthOptions(2026, 2);
  }, []);

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
          const revenueRows = revenueRes.value.data || [];
          setRevenue(revenueRows);
        } else {
          console.error("Revenue load failed:", revenueRes.reason);
          setErr(
            revenueRes.reason?.response?.data?.message ||
              "Failed to load monthly revenue"
          );
        }

        setSelectedReportMonth((current) => {
          if (current) return current;
          return reportMonthOptions[reportMonthOptions.length - 1]?.value || "";
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [reportMonthOptions]);

  const revenueTotal = useMemo(() => {
    const raw = cards?.totalRevenue;
    const value = Number(raw);
    return Number.isFinite(value) ? value.toLocaleString() : "-";
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

  const hasInquiryData = inqStatus.some((item) => Number(item.count || 0) > 0);
  const hasRevenueData = revenue.some((item) => Number(item.total || 0) > 0);

  const handleDownloadIncomeReport = async () => {
    const month =
      selectedReportMonth ||
      reportMonthOptions[reportMonthOptions.length - 1]?.value;

    if (!month) {
      setErr("No report month available to download.");
      return;
    }

    try {
      setErr("");
      setDownloadingReport(true);

      const response = await downloadIncomeReportApi(month);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fallbackName = `income-report-${month}.pdf`;

      link.href = url;
      link.download = getFileNameFromDisposition(
        response.headers?.["content-disposition"],
        fallbackName
      );

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Income report download failed:", error);
      setErr("Failed to download the income report");
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="instructorPage adminDashboardPage">
      <div className="instructorPageHeader adminDashboardTopRow">
        <div>
          <h2 className="instructorPageTitle">Admin Dashboard</h2>
          <p className="instructorSectionText adminDashboardSubtitle"></p>
        </div>

        <div className="adminDashboardTopActions">
          <button
            onClick={() => navigate("/reception/dashboard")}
            className="adminSwitchButton adminSwitchButtonAlt"
            type="button"
          >
            Switch to Reception Dashboard
          </button>

          <button
            onClick={() => navigate("/instructor/dashboard")}
            className="adminSwitchButton"
            type="button"
          >
            Switch to Instructor Dashboard
          </button>
        </div>
      </div>

      {err ? <div className="instructorError">{err}</div> : null}

      <div className="instructorStatsGrid adminDashboardStatsGrid">
        <StatCard
          icon={MessageCircleMore}
          title="Total Inquiries"
          value={cards?.totalInquiries ?? "—"}
        />
        <StatCard
          icon={CalendarClock}
          title="New Inquiries"
          value={cards?.newInquiries ?? "—"}
        />
        <StatCard
          icon={GraduationCap}
          title="Total Enrollments"
          value={cards?.totalEnrollments ?? "—"}
        />
        <StatCard
          icon={Landmark}
          title="Total Revenue (LKR)"
          value={revenueTotal}
        />
      </div>

      <div className="adminDashboardCharts">
        <div className="instructorContentCard adminChartCard">
          <div className="instructorSectionHeader">
            <div>
              <h3 className="instructorSectionTitle">Inquiries by Status</h3>
              <p className="instructorSectionText">
                Current customer inquiry distribution.
              </p>
            </div>
          </div>

          <div className="adminChartArea">
            {loading ? (
              <div className="instructorMuted adminChartEmpty">
                Loading chart data…
              </div>
            ) : !hasInquiryData ? (
              <div className="instructorMuted adminChartEmpty">
                No inquiry data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inqStatus}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={58}
                    outerRadius={92}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2}
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
            )}
          </div>
        </div>

        <div className="instructorContentCard adminChartCard">
          <div className="instructorSectionHeader adminChartCardHeader">
            <div>
              <h3 className="instructorSectionTitle">Monthly Revenue</h3>
              <p className="instructorSectionText">
                Revenue summary for the latest months.
              </p>
            </div>

            <div className="adminReportToolbar">
              <select
                className="adminReportSelect"
                value={selectedReportMonth}
                onChange={(e) => setSelectedReportMonth(e.target.value)}
                disabled={!reportMonthOptions.length || downloadingReport}
              >
                {reportMonthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                className="adminReportDownloadButton"
                type="button"
                onClick={handleDownloadIncomeReport}
                disabled={!reportMonthOptions.length || downloadingReport}
              >
                <Download size={16} strokeWidth={2.2} />
                <span>
                  {downloadingReport
                    ? "Preparing Report..."
                    : "Download Income Report"}
                </span>
              </button>
            </div>
          </div>

          <div className="adminChartArea">
            {loading ? (
              <div className="instructorMuted adminChartEmpty">
                Loading chart data…
              </div>
            ) : !hasRevenueData ? (
              <div className="instructorMuted adminChartEmpty">
                No revenue data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenue}
                  margin={{ top: 10, right: 10, left: 20, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="monthLabel" />
                  <YAxis
                    width={80}
                    tickMargin={8}
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
                  <Bar
                    dataKey="total"
                    radius={[10, 10, 0, 0]}
                    name="Revenue (LKR)"
                  >
                    {revenue.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.monthLabel || entry.month || index}`}
                        fill={
                          revenueBarColors[index % revenueBarColors.length]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value }) {
  return (
    <div className="instructorStatCard">
      <div className="instructorStatIcon">
        <Icon size={20} strokeWidth={2} />
      </div>

      <div>
        <div className="instructorStatLabel">{title}</div>
        <div className="instructorStatValue">{value}</div>
      </div>
    </div>
  );
}