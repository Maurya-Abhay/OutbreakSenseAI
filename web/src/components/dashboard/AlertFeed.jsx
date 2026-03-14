import { motion } from "framer-motion";
import SkeletonBlock from "../common/SkeletonBlock";
import { formatDateTime } from "../../utils/formatters";

const severityClass = {
  high: "border-red-200 bg-red-50/82 text-red-700 dark:border-red-700/70 dark:bg-red-900/26 dark:text-red-100",
  medium:
    "border-amber-200 bg-amber-50/82 text-amber-700 dark:border-amber-700/70 dark:bg-amber-900/26 dark:text-amber-100",
  low: "border-sky-200 bg-sky-50/84 text-sky-700 dark:border-sky-700/70 dark:bg-sky-900/26 dark:text-sky-100"
};

const AlertFeed = ({ alerts = [], loading = false, onResolve, compact = false }) => {
  return (
    <aside className="saas-panel p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="saas-heading">Alert Feed</h3>
          <p className="saas-muted mt-1">Prioritized high-risk zones with intervention cues.</p>
        </div>
      </div>

      <div className={`${compact ? "max-h-[340px]" : "max-h-[520px]"} space-y-3 overflow-auto pr-1`}>
        {loading ? (
          [...Array(4)].map((_, index) => <SkeletonBlock key={`alert-skeleton-${index}`} className="h-20 w-full" />)
        ) : alerts.length ? (
          alerts.map((alert, index) => (
            <motion.article
              key={alert._id || alert.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`rounded-2xl border p-3 ${severityClass[alert.severity] || severityClass.medium}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{alert.title || "Risk Alert"}</p>
                  <p className="mt-1 text-xs opacity-90">{alert.message}</p>
                </div>
                <span className="rounded-lg bg-white/80 px-2 py-1 text-[11px] font-bold uppercase dark:bg-slate-900/70">
                  {alert.severity || "medium"}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                <p className="opacity-80">
                  {alert.locationName} · {formatDateTime(alert.createdAt)}
                </p>
                <button
                  type="button"
                  onClick={() => onResolve(alert._id || alert.id)}
                  className="rounded-lg bg-white/92 px-2 py-1 font-semibold text-slate-700 hover:bg-white dark:bg-slate-900/82 dark:text-slate-200"
                >
                  Resolve
                </button>
              </div>
            </motion.article>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">No active alerts right now.</p>
        )}
      </div>
    </aside>
  );
};

export default AlertFeed;
