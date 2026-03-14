import { History, RefreshCw, MapPin, Activity, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CitizenSkeletonCard from "./CitizenSkeletonCard";

const CitizenHistoryPanel = ({
  history,
  areaHistory,
  locationName,
  loading,
  refreshing,
  onRefresh,
  isDark = false
}) => {
  if (loading) {
    return (
      <div className={`rounded-3xl border p-5 backdrop-blur-xl ${isDark ? "border-white/10 bg-slate-900/45" : "border-white/40 bg-white/40"}`}>
        <CitizenSkeletonCard rows={5} isDark={isDark} />
      </div>
    );
  }

  return (
    <section 
      className={`relative flex flex-col rounded-3xl border p-5 shadow-xl backdrop-blur-2xl transition-all ${
        isDark ? "border-white/10 bg-slate-900/65" : "border-white/40 bg-white/60"
      }`} 
      aria-labelledby="citizen-history-heading"
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b pb-4 ${isDark ? "border-white/10" : "border-slate-200/50"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 id="citizen-history-heading" className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Report Activity
            </h3>
            <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Your recent submissions & local trends</p>
          </div>
        </div>

        <motion.button
          whileHover={{ rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRefresh}
          disabled={refreshing}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-50 ${
            isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </motion.button>
      </div>

      {/* Main History Feed */}
      <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {history.length ? (
            history.map((item, index) => (
              <motion.article
                key={item.id || item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-2xl border p-3.5 transition-all hover:border-indigo-500/30 hover:shadow-md ${
                  isDark ? "border-white/10 bg-slate-800/65" : "border-slate-200/60 bg-white/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    <div>
                      <p className={`text-sm font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.locationName}</p>
                      <div className={`mt-1 flex items-center gap-2 text-[10px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Risk Badge */}
                  <div className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
                    String(item.aiRiskLevel || "").toLowerCase().includes("high")
                      ? "bg-rose-500/10 text-rose-600"
                      : String(item.aiRiskLevel || "").toLowerCase().includes("med")
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-emerald-500/10 text-emerald-600"
                  }`}>
                    {Math.round(item.aiRiskScore * 100)}% Risk
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-40">
              <Activity className="h-10 w-10" />
              <p className="mt-2 text-xs font-medium">No history recorded yet</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Area Intelligence Footer */}
      {areaHistory.length > 0 && (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 p-4 text-white shadow-lg shadow-indigo-500/20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Area Insight</span>
          </div>
          <p className="mt-2 text-sm font-medium leading-tight">
            Pattern detected in <span className="underline decoration-indigo-300 underline-offset-2">{locationName || "Selected Area"}</span>
          </p>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
            <div className="text-[10px] text-indigo-100">
              <span className="block opacity-70">Recent Cases</span>
              <span className="font-bold">{areaHistory.length} Reports</span>
            </div>
            <div className="text-right text-[10px] text-indigo-100">
              <span className="block opacity-70">Current Trend</span>
              <span className="font-bold capitalize">{areaHistory[0]?.riskLevel || "Stable"}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CitizenHistoryPanel;