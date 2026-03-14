import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AlertFeed from "../components/dashboard/AlertFeed";

const includesTerm = (value, searchQuery) =>
  String(value || "").toLowerCase().includes(String(searchQuery || "").toLowerCase());

const AlertsPage = () => {
  const { alerts, searchQuery, loading, resolveAlert } = useOutletContext();

  const visibleAlerts = useMemo(() => {
    if (!searchQuery) return alerts;
    return alerts.filter(
      (alert) => includesTerm(alert.locationName, searchQuery) || includesTerm(alert.message, searchQuery)
    );
  }, [alerts, searchQuery]);

  const criticalCount = visibleAlerts.filter((alert) => alert.severity === "high").length;

  return (
    <section className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* --- Page Header & Emergency Stats --- */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Incident <span className="text-red-600">Feed</span>
            </h1>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Real-time intelligence stream. Monitoring {visibleAlerts.length} active vectors.
          </p>
        </header>

        {/* --- Quick Mini-Stats --- */}
        <div className="grid grid-cols-2 gap-3 sm:flex">
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 min-w-[140px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Alerts</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">{visibleAlerts.length}</span>
          </div>
          <div className="flex flex-col rounded-2xl border border-red-100 bg-red-50 px-5 py-3 shadow-sm dark:border-red-900/20 dark:bg-red-900/10 min-w-[140px]">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Critical (AI)</span>
            <span className="text-xl font-bold text-red-600 dark:text-red-400">{criticalCount}</span>
          </div>
        </div>
      </div>

      {/* --- Main Alerts Feed Area --- */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Live Intelligence Stream</h2>
          {searchQuery ? (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              Results for: "{searchQuery}"
            </span>
          ) : null}
        </div>

        <AlertFeed alerts={visibleAlerts} loading={loading} onResolve={resolveAlert} />
      </motion.section>

      {/* --- Empty State Placeholder --- */}
      {!loading && visibleAlerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
            <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">All Clear</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">No pending alerts found for this region.</p>
        </div>
      )}
    </section>
  );
};

export default AlertsPage;