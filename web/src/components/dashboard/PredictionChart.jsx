import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import SkeletonBlock from "../common/SkeletonBlock";

const chartTabs = [
  { key: "weekly", label: "Weekly Forecast" },
  { key: "monthly", label: "Monthly Trend" },
  { key: "location", label: "By Location" }
];

const axisTick = { fontSize: 12, fill: "#94a3b8" };

const tooltipStyle = {
  border: "1px solid rgba(71, 85, 105, 0.7)",
  borderRadius: "0.75rem",
  backgroundColor: "rgba(15, 23, 42, 0.92)",
  color: "#e2e8f0"
};

const tooltipFormatter = (value, key) => {
  if (key.toLowerCase().includes("risk")) {
    return `${Math.round(Number(value) * 100)}%`;
  }
  return value;
};

const PredictionChart = ({ weeklyData = [], monthlyData = [], locationData = [], loading = false }) => {
  const [tab, setTab] = useState("weekly");

  const dataset = useMemo(() => {
    if (tab === "monthly") return monthlyData;
    if (tab === "location") return locationData;
    return weeklyData;
  }, [tab, weeklyData, monthlyData, locationData]);

  const isLocationChart = tab === "location";

  return (
    <section className="saas-panel p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="saas-heading">Prediction Analytics</h3>
          <p className="saas-muted mt-1">Interactive forecasting insights from AI predictions and reports.</p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200/90 bg-white/80 p-1 dark:border-slate-700/90 dark:bg-slate-900/76">
          {chartTabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                tab === item.key
                  ? "bg-brand-primary text-white"
                  : "text-slate-600 hover:bg-sky-50 hover:text-brand-primary dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonBlock className="h-6 w-56" />
          <SkeletonBlock className="h-[300px] w-full" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            {isLocationChart ? (
              <BarChart data={dataset} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="locationName" tick={axisTick} />
                <YAxis yAxisId="left" tick={axisTick} domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                <YAxis yAxisId="right" tick={axisTick} orientation="right" />
                <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} itemStyle={{ color: "#e2e8f0" }} labelStyle={{ color: "#bae6fd" }} />
                <Legend />
                <Bar yAxisId="left" dataKey="avgRiskScore" name="Avg Risk" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="right" dataKey="totalReports" name="Reports" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={dataset} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="riskGradientBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="riskGradientTeal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                <XAxis dataKey="label" tick={axisTick} />
                <YAxis yAxisId="left" tick={axisTick} domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                <YAxis yAxisId="right" tick={axisTick} orientation="right" />
                <Tooltip formatter={tooltipFormatter} contentStyle={tooltipStyle} itemStyle={{ color: "#e2e8f0" }} labelStyle={{ color: "#bae6fd" }} />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="averageRisk"
                  name="Average Risk"
                  stroke="#2563eb"
                  fill="url(#riskGradientBlue)"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="reportCount"
                  name="Reports"
                  stroke="#14b8a6"
                  fill="url(#riskGradientTeal)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </motion.div>
      )}
    </section>
  );
};

export default PredictionChart;
