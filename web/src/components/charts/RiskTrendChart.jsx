import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import SkeletonBlock from "../common/SkeletonBlock";

const RiskTrendChart = ({
  data = [],
  loading = false,
  title = "Weekly / Monthly Risk Trends",
  subtitle = "Track predicted disease outbreak pattern shift over time."
}) => {
  const axisTick = { fontSize: 12, fill: "#94a3b8" };

  if (loading) {
    return (
      <section className="saas-panel h-[340px] p-4 md:p-5" aria-busy="true" aria-live="polite">
        <SkeletonBlock className="h-6 w-56" />
        <SkeletonBlock className="mt-2 h-4 w-72" />
        <SkeletonBlock className="mt-4 h-[220px] w-full" />
      </section>
    );
  }

  return (
    <section className="saas-panel h-[340px] p-4 md:p-5" aria-label="Risk trend chart">
      <div className="mb-4">
        <h3 className="saas-heading">{title}</h3>
        <p className="saas-muted mt-1">{subtitle}</p>
      </div>

      <ResponsiveContainer width="100%" height="78%">
        <AreaChart data={data} margin={{ top: 6, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.04} />
            </linearGradient>
            <linearGradient id="reportsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
          <XAxis dataKey="label" tick={axisTick} />
          <YAxis yAxisId="left" tick={axisTick} domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
          <YAxis yAxisId="right" tick={axisTick} orientation="right" />
          <Tooltip
            formatter={(value, key) => {
              if (String(key).toLowerCase().includes("risk")) {
                return `${Math.round(Number(value) * 100)}%`;
              }
              return value;
            }}
            contentStyle={{
              border: "1px solid rgba(71, 85, 105, 0.7)",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(15, 23, 42, 0.92)",
              color: "#e2e8f0"
            }}
            itemStyle={{ color: "#e2e8f0" }}
            labelStyle={{ color: "#bae6fd" }}
          />
          <Legend />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="averageRisk"
            stroke="#ef4444"
            fill="url(#riskGradient)"
            name="Avg Risk"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="reportCount"
            stroke="#10b981"
            fill="url(#reportsGradient)"
            name="Reports"
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
};

export default memo(RiskTrendChart);
