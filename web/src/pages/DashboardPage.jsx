import { Suspense, lazy, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import StatCard from "../components/common/StatCard";
import PredictionChart from "../components/dashboard/PredictionChart";
import ReportsTable from "../components/dashboard/ReportsTable";
import AlertFeed from "../components/dashboard/AlertFeed";

const RiskHeatmapMap = lazy(() => import("../components/dashboard/RiskHeatmapMap"));

const includesTerm = (value, searchQuery) =>
  String(value || "").toLowerCase().includes(String(searchQuery || "").toLowerCase());

const DashboardPage = () => {
  const {
    stats,
    filters,
    updateFilter,
    period,
    setPeriod,
    reports,
    alerts,
    heatPoints,
    trendsWeekly,
    trendsMonthly,
    locationBreakdown,
    loading,
    error,
    searchQuery,
    refresh,
    resolveAlert,
    toggleReportVerification,
    downloadExport
  } = useOutletContext();

  const filteredReports = useMemo(() => {
    if (!searchQuery) return reports;

    return reports.filter(
      (report) => includesTerm(report.reporterName, searchQuery) || includesTerm(report.locationName, searchQuery)
    );
  }, [reports, searchQuery]);

  const filteredAlerts = useMemo(() => {
    if (!searchQuery) return alerts;
    return alerts.filter(
      (alert) => includesTerm(alert.locationName, searchQuery) || includesTerm(alert.message, searchQuery)
    );
  }, [alerts, searchQuery]);

  return (
    <section className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="saas-panel p-4 md:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white md:text-3xl">
              OutbreakSense AI Portal
            </h1>
            <p className="saas-muted mt-1">Premium monitoring workspace for government outbreak response teams.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              className="btn-ghost"
            >
              Refresh
            </button>
            <button type="button" onClick={() => downloadExport("csv")} className="btn-primary">
              Export CSV
            </button>
            <button type="button" onClick={() => downloadExport("pdf")} className="btn-ghost">
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="field-label">
            From date
            <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} className="field-input" />
          </label>

          <label className="field-label">
            To date
            <input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} className="field-input" />
          </label>

          <label className="field-label xl:col-span-2">
            City / area
            <input
              value={filters.location}
              placeholder="Dhaka Center, Mirpur, Uttara..."
              onChange={(event) => updateFilter("location", event.target.value)}
              className="field-input"
            />
          </label>

          <label className="field-label">
            Risk severity
            <select value={filters.severity} onChange={(event) => updateFilter("severity", event.target.value)} className="field-input">
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="field-label">
            Trend window
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="field-input">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>

        {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-700 dark:border-red-700/70 dark:bg-red-900/30 dark:text-red-200">{error}</p> : null}
      </motion.section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Reports" value={stats?.totalReports || 0} subtitle="All active submissions" tone="blue" />
        <StatCard title="High Risk" value={stats?.highRiskReports || 0} subtitle="Escalation priority" tone="red" />
        <StatCard title="Medium Risk" value={stats?.mediumRiskReports || 0} subtitle="Monitor closely" tone="amber" />
        <StatCard title="Active Alerts" value={stats?.activeAlerts || 0} subtitle="Open intervention signals" tone="red" />
        <StatCard title="This Week" value={stats?.reportsThisWeek || 0} subtitle="Current week volume" tone="teal" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Suspense
          fallback={<div className="saas-panel h-[460px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 xl:col-span-2" />}
        >
          <RiskHeatmapMap points={heatPoints} loading={loading} className="xl:col-span-2" />
        </Suspense>
        <AlertFeed alerts={filteredAlerts} loading={loading} onResolve={resolveAlert} compact />
      </div>

      <PredictionChart
        weeklyData={trendsWeekly}
        monthlyData={trendsMonthly}
        locationData={locationBreakdown}
        loading={loading}
      />

      <ReportsTable reports={filteredReports} loading={loading} onToggleVerification={toggleReportVerification} />
    </section>
  );
};

export default DashboardPage;
