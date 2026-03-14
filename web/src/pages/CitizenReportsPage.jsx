import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import ReportsTable from "../components/dashboard/ReportsTable";

const includesTerm = (value, searchQuery) =>
  String(value || "").toLowerCase().includes(String(searchQuery || "").toLowerCase());

const CitizenReportsPage = () => {
  const { reports, loading, searchQuery, toggleReportVerification } = useOutletContext();
  const [verificationFilter, setVerificationFilter] = useState("all");

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        if (!searchQuery) return true;
        return includesTerm(report.reporterName, searchQuery) || includesTerm(report.locationName, searchQuery);
      })
      .filter((report) => {
        if (verificationFilter === "all") return true;
        if (verificationFilter === "verified") return report.isVerified;
        return !report.isVerified;
      });
  }, [reports, searchQuery, verificationFilter]);

  const verifiedCount = filteredReports.filter((item) => item.isVerified).length;
  const pendingCount = filteredReports.length - verifiedCount;

  return (
    <section className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* --- Workflow Header & Filter Tabs --- */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Verification <span className="text-indigo-600">Queue</span>
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Validate citizen submissions to improve AI prediction accuracy.
          </p>
        </div>

        {/* --- Modern Segmented Control --- */}
        <div className="flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50">
          {["all", "verified", "pending"].map((tab) => (
            <button
              key={tab}
              onClick={() => setVerificationFilter(tab)}
              className={`relative rounded-xl px-6 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                verificationFilter === tab
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- Status Dashboard Widgets --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="group rounded-[2rem] border border-slate-200 bg-white p-6 transition-all hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Total Visible</span>
            <div className="rounded-full bg-indigo-50 p-2 dark:bg-indigo-500/10">
              <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{filteredReports.length}</p>
        </div>

        <div className="group rounded-[2rem] border border-emerald-100 bg-emerald-50/30 p-6 transition-all hover:shadow-lg dark:border-emerald-900/20 dark:bg-emerald-900/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">Verified Base</span>
            <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-500/10">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-emerald-600 dark:text-emerald-400">{verifiedCount}</p>
        </div>

        <div className="group rounded-[2rem] border border-amber-100 bg-amber-50/30 p-6 transition-all hover:shadow-lg dark:border-amber-900/20 dark:bg-amber-900/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">Awaiting Action</span>
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-500/10">
              <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
        </div>
      </div>

      {/* --- Main Table Container --- */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Report Registry</h2>
          {searchQuery ? (
            <p className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              FILTERED BY SEARCH
            </p>
          ) : null}
        </div>

        <ReportsTable reports={filteredReports} loading={loading} onToggleVerification={toggleReportVerification} />
      </motion.section>

      {/* --- Quick Tip Footer --- */}
      <div className="flex items-center justify-center gap-2 text-slate-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <p className="text-xs font-medium italic">Verified reports directly influence the Risk Heatmap calculations.</p>
      </div>
    </section>
  );
};

export default CitizenReportsPage;