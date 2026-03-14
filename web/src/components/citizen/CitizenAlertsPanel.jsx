import { Bell, BellOff, Siren, Radio, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CitizenSkeletonCard from "./CitizenSkeletonCard";

// Refined Severity Styling with subtle glows
const severityStyles = {
  high: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.1)]",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.1)]"
};

const CitizenAlertsPanel = ({
  alerts,
  loading,
  notificationsEnabled,
  notificationPermission,
  onEnableNotifications,
  onDisableNotifications,
  isDark = false
}) => {
  if (loading) {
    return (
      <div className={`rounded-3xl border p-5 backdrop-blur-xl ${isDark ? "border-white/10 bg-slate-900/45" : "border-white/40 bg-white/40"}`}>
        <CitizenSkeletonCard rows={4} isDark={isDark} />
      </div>
    );
  }

  const canEnableNotifications = notificationPermission !== "unsupported";

  return (
    <aside 
      className={`relative h-full flex flex-col overflow-hidden rounded-3xl border p-5 shadow-xl backdrop-blur-2xl transition-all ${
        isDark ? "border-white/10 bg-slate-900/65" : "border-white/40 bg-white/60"
      }`} 
      aria-labelledby="citizen-alerts-heading"
    >
      {/* Background Decorative Glow */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl" />

      {/* Header Section */}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <h2 id="citizen-alerts-heading" className={`flex items-center gap-2 text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            Live Health Alerts
          </h2>
          <p className={`mt-1 text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Real-time neighborhood monitoring
          </p>
        </div>

        {canEnableNotifications && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={notificationsEnabled ? onDisableNotifications : onEnableNotifications}
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
              notificationsEnabled 
                ? isDark
                  ? "bg-white/5 text-slate-300 hover:bg-white/10"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20 shadow-lg"
            }`}
            aria-label={notificationsEnabled ? "Disable browser alerts" : "Enable browser alerts"}
          >
            {notificationsEnabled ? (
              <><BellOff className="h-3.5 w-3.5" /> Mute</>
            ) : (
              <><Bell className="h-3.5 w-3.5" /> Notify Me</>
            )}
          </motion.button>
        )}
      </div>

      {/* Alerts Scroll Area */}
      <div className="relative z-10 mt-6 flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar max-h-[400px]">
        <AnimatePresence mode="popLayout">
          {alerts.length ? (
            alerts.map((alert, index) => (
              <motion.article
                key={alert.id || index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`group relative rounded-2xl border p-4 transition-all hover:shadow-md ${
                  severityStyles[alert.severity] || severityStyles.medium
                }`}
                tabIndex={0}
                aria-label={`${alert.locationName} alert`}
              >
                {/* Visual Indicator Line */}
                <div className={`absolute left-0 top-4 h-8 w-1 rounded-r-full ${
                   alert.severity === 'high' ? 'bg-rose-500' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-sky-500'
                }`} />

                <div className="flex flex-col gap-1 pl-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-black uppercase tracking-tight ${isDark ? "text-slate-100" : "text-slate-800"}`}>{alert.locationName}</span>
                    <Radio className="h-3.5 w-3.5 animate-pulse opacity-50" />
                  </div>
                  <p className={`text-xs font-medium leading-relaxed ${isDark ? "text-slate-200" : "text-slate-700"}`}>{alert.message}</p>
                  
                  <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-2 dark:border-white/5">
                    <span className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                      <Circle className="h-2 w-2 fill-current" />
                      {alert.severity} Risk
                    </span>
                  </div>
                </div>
              </motion.article>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5">
                <Siren className={`h-8 w-8 ${isDark ? "text-slate-500" : "text-slate-300"}`} />
              </div>
              <p className={`mt-4 text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                All clear! No active alerts.
              </p>
              <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-400"}`}>
                Check back later for real-time updates.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Notification Tip */}
      {!notificationsEnabled && canEnableNotifications && (
        <div className={`mt-4 rounded-xl border p-3 ${isDark ? "border-blue-500/20 bg-blue-500/10" : "border-blue-500/10 bg-blue-500/5"}`}>
          <p className={`text-[10px] leading-tight ${isDark ? "text-blue-300" : "text-blue-600/80"}`}>
            <strong>Tip:</strong> Enable alerts to get high-risk neighborhood notifications even when the portal is closed.
           </p>
        </div>
      )}
    </aside>
  );
};

export default CitizenAlertsPanel;