import { ShieldCheck, CheckCircle2, Lightbulb, Info } from "lucide-react";
import { motion } from "framer-motion";
import CitizenSkeletonCard from "./CitizenSkeletonCard";

const CitizenTipsPanel = ({ tips, loading, isDark = false }) => {
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
      aria-labelledby="citizen-tips-heading"
    >
      {/* Dynamic Background Glow */}
      <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

      <header className="relative z-10 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 id="citizen-tips-heading" className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Health Defense Tips
            </h3>
            <p className={`text-[11px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Community-driven prevention strategies
            </p>
          </div>
        </div>
      </header>

      <ul className="relative z-10 space-y-3">
        {tips.length ? (
          tips.map((tip, index) => (
            <motion.li
              key={tip}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 5 }}
              className={`group flex items-start gap-3 rounded-2xl border p-3.5 transition-all ${
                isDark
                  ? "border-emerald-500/20 bg-emerald-500/12 hover:bg-emerald-500/18"
                  : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
              }`}
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <p className={`text-sm font-medium leading-relaxed ${isDark ? "text-emerald-100/95" : "text-slate-700"}`}>
                {tip}
              </p>
            </motion.li>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className={`mb-3 rounded-full p-3 ${isDark ? "bg-white/8" : "bg-slate-100"}`}>
              <Info className={`h-6 w-6 ${isDark ? "text-slate-400" : "text-slate-400"}`} />
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-400"}`}>
              Syncing latest insights...
            </p>
          </div>
        )}
      </ul>

      {/* Pro-Tip Footer */}
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 shadow-lg shadow-emerald-500/20">
        <div className="flex items-center gap-2 text-white">
          <Lightbulb className="h-4 w-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Community Impact</span>
        </div>
        <p className="mt-2 text-xs font-medium leading-snug text-emerald-50">
          Following these daily steps can reduce local transmission risk by up to 40%.
        </p>
      </div>
    </section>
  );
};

export default CitizenTipsPanel;