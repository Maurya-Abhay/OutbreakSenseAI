import { BellRing, Mail, MapPin, Sparkles, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const CitizenSubscriptionPanel = ({
  register,
  errors,
  onSubmit,
  loading,
  isDark = false
}) => {
  return (
    <section 
      className={`relative overflow-hidden rounded-3xl border p-5 shadow-xl backdrop-blur-2xl md:p-6 ${
        isDark ? "border-white/10 bg-slate-900/65" : "border-white/40 bg-white/60"
      }`} 
      aria-labelledby="citizen-subscription-heading"
    >
      {/* Background Decorative Element */}
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-indigo-500/5 blur-3xl dark:bg-indigo-500/10" />

      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <h3 id="citizen-subscription-heading" className={`flex items-center gap-2 text-lg font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <BellRing className="h-4 w-4" />
            </div>
            Smart Area Alerts
          </h3>
          <p className={`mt-1 text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Get instant AI-driven notifications when risk levels shift in your neighborhood.
          </p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-3 sm:flex-row lg:max-w-2xl">
          {/* Email Input Group */}
          <div className="flex-1 space-y-1">
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                aria-label="Subscription email"
                {...register("email")}
                className={`w-full rounded-2xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                  isDark
                    ? "border-white/15 bg-slate-800/80 text-white placeholder:text-slate-500 focus:border-indigo-400"
                    : "border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500"
                }`}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2 text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                {errors.email.message}
              </motion.span>
            )}
          </div>

          {/* Location Input Group */}
          <div className="flex-1 space-y-1">
            <div className="relative flex items-center">
              <MapPin className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                aria-label="Subscription location"
                {...register("locationName")}
                className={`w-full rounded-2xl border py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 ${
                  isDark
                    ? "border-white/15 bg-slate-800/80 text-white placeholder:text-slate-500 focus:border-indigo-400"
                    : "border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500"
                }`}
                placeholder="Area (e.g. Uttara)"
              />
            </div>
            {errors.locationName && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-2 text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                {errors.locationName.message}
              </motion.span>
            )}
          </div>

          {/* Submit Button */}
          <div className="sm:w-32">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Join
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Trust Badge Footer */}
      <div className={`mt-4 flex items-center gap-4 border-t pt-3 ${isDark ? "border-white/10" : "border-slate-200/50"}`}>
        <div className="flex items-center gap-1.5 opacity-60">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className={`text-[10px] font-bold uppercase tracking-tighter ${isDark ? "text-slate-400" : "text-slate-500"}`}>Verified AI Analysis</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-60">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className={`text-[10px] font-bold uppercase tracking-tighter ${isDark ? "text-slate-400" : "text-slate-500"}`}>Zero-Spam Policy</span>
        </div>
      </div>
    </section>
  );
};

export default CitizenSubscriptionPanel;