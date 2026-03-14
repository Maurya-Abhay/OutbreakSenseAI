import { motion } from "framer-motion";
import SkeletonBlock from "../common/SkeletonBlock";
import { capitalize, formatDateShort, formatPercent } from "../../utils/formatters";

const riskBadgeClass = (riskLevel) => {
  if (riskLevel === "High") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  if (riskLevel === "Medium") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
};

const ReportsTable = ({ reports = [], loading = false, onToggleVerification, compact = false }) => {
  return (
    <section className="saas-panel p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h3 className="saas-heading">Recent Citizen Reports</h3>
          <p className="saas-muted mt-1">Verification workflow with real-time AI confidence details.</p>
        </div>
        <span className="saas-chip rounded-xl px-3 py-1 text-xs font-semibold">
          {reports.length} rows
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/90 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700/90 dark:text-slate-400">
              <th className="py-2 pr-3">Reporter</th>
              <th className="py-2 pr-3">Disease</th>
              <th className="py-2 pr-3">Location</th>
              <th className="py-2 pr-3">Severity</th>
              <th className="py-2 pr-3">Predicted Risk</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Date</th>
              {!compact ? <th className="py-2 pr-1">Action</th> : null}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              [...Array(4)].map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-slate-200/70 dark:border-slate-700/70">
                  <td className="py-3 pr-3" colSpan={compact ? 7 : 8}>
                    <SkeletonBlock className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : reports.length ? (
              reports.map((report, index) => (
                <motion.tr
                  key={report.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-slate-200/70 dark:border-slate-700/70"
                >
                  <td className="py-2.5 pr-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{report.reporterName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{report.reporterEmail || "-"}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-200">{report.diseaseType || "Unknown"}</td>
                  <td className="py-2.5 pr-3 text-slate-700 dark:text-slate-200">{report.locationName}</td>
                  <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{capitalize(report.severity)}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${riskBadgeClass(report.aiRiskLevel)}`}>
                      {report.aiRiskLevel} ({formatPercent(report.aiRiskScore)})
                    </span>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {report.aiPredictionSource || "ai-engine"}
                    </p>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        report.isVerified
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-200"
                      }`}
                    >
                      {report.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-600 dark:text-slate-300">{formatDateShort(report.createdAt)}</td>
                  {!compact ? (
                    <td className="py-2.5 pr-1">
                      <button
                        type="button"
                        onClick={() => onToggleVerification(report.id, !report.isVerified)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          report.isVerified
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800/85 dark:text-slate-200 dark:hover:bg-slate-700"
                            : "bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/35 dark:text-teal-200 dark:hover:bg-teal-900/55"
                        }`}
                      >
                        {report.isVerified ? "Mark Pending" : "Verify"}
                      </button>
                    </td>
                  ) : null}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={compact ? 7 : 8} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No reports match current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ReportsTable;
