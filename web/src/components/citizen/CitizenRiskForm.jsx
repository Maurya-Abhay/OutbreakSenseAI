import { AlertTriangle, CloudRain, LocateFixed, MapPinned, Thermometer, Waves, Info, ShieldAlert, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CitizenSkeletonCard from "./CitizenSkeletonCard";

const riskLabelClass = {
  Low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
  High: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
};

const riskBarClass = {
  Low: "bg-gradient-to-r from-emerald-400 to-emerald-600",
  Medium: "bg-gradient-to-r from-amber-400 to-amber-600",
  High: "bg-gradient-to-r from-rose-400 to-rose-600"
};

const RecommendationSection = ({ riskLevel, recommendations, isDark = false }) => (
  <div
    className={`mt-6 overflow-hidden rounded-2xl border ${
      isDark ? "border-white/10 bg-slate-900/55" : "border-white/20 bg-white/40"
    }`}
  >
    <div
      className={`flex items-center gap-2 border-b px-4 py-2 ${
        isDark ? "border-white/10 bg-slate-800/55" : "border-white/20 bg-white/40"
      }`}
    >
      <ShieldAlert className="h-4 w-4 text-blue-500" />
      <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        Safety Protocol ({riskLevel})
      </p>
    </div>
    <ul className="space-y-2 p-4">
      {recommendations.map((item) => (
        <li key={item} className={`flex items-start gap-3 text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
          <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const CitizenRiskForm = ({
  register,
  watch,
  errors,
  onDetectLocation,
  onCheckRisk,
  loading,
  weatherLoading,
  riskResult,
  riskLevel,
  recommendations,
  onPickFromMap,
  dataLoading,
  offlineResult,
  isDark = false
}) => {
  const riskScorePercent = Math.round((Number(riskResult?.risk_score) || 0) * 100);
  const latitude = watch("latitude");
  const longitude = watch("longitude");
  const panelClass = isDark
    ? "border-white/10 bg-slate-900/72"
    : "border-white/40 bg-white/60";
  const fieldLabelClass = `text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`;
  const resultSurfaceClass = isDark ? "border-white/10 bg-slate-900/78" : "border-white/20 bg-white/50";

  if (dataLoading) {
    return <CitizenSkeletonCard rows={6} className="xl:col-span-2" isDark={isDark} />;
  }

  const inputStyles = `w-full rounded-xl border px-3 py-2 text-sm outline-none transition-all focus:ring-4 focus:ring-blue-500/10 ${
    isDark
      ? "border-white/15 bg-slate-800/80 text-white placeholder:text-slate-500 focus:border-blue-400"
      : "border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
  }`;

  return (
    <section 
      className={`relative overflow-hidden rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl md:p-8 xl:col-span-2 ${panelClass}`} 
      aria-labelledby="citizen-risk-form-heading"
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] transition-colors duration-1000 ${
        riskLevel === 'High' ? 'bg-rose-500/10' : riskLevel === 'Medium' ? 'bg-amber-500/10' : 'bg-blue-500/10'
      }`} />

      <header className="relative z-10">
        <h2 id="citizen-risk-form-heading" className={`flex items-center gap-2 text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          Disease Risk Assessment
        </h2>
        <p className={`mt-1 text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Neural engine analysis based on climatology and geospatial data.
        </p>
      </header>

      {/* Input Grid */}
      <div className="relative z-10 mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <label className={fieldLabelClass}>Latitude</label>
          <input {...register("latitude")} className={inputStyles} placeholder="23.8103" />
        </div>
        <div className="space-y-1.5">
          <label className={fieldLabelClass}>Longitude</label>
          <input {...register("longitude")} className={inputStyles} placeholder="90.4125" />
        </div>
        <div className="space-y-1.5">
          <label className={fieldLabelClass}>Temp (°C)</label>
          <div className="relative">
            <Thermometer className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input {...register("temperature")} type="number" className={inputStyles} placeholder="30" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={fieldLabelClass}>Rain (mm)</label>
          <div className="relative">
            <CloudRain className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input {...register("rainfall")} type="number" className={inputStyles} placeholder="150" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={fieldLabelClass}>Humidity (%)</label>
          <div className="relative">
            <Waves className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input {...register("humidity")} type="number" className={inputStyles} placeholder="72" />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 mt-6 flex flex-wrap gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="button" onClick={onDetectLocation}
          className="flex items-center gap-2 rounded-xl bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-600 transition-all hover:bg-blue-500/20 dark:text-blue-400"
        >
          <LocateFixed className={`h-4 w-4 ${weatherLoading ? "animate-spin" : ""}`} />
          {weatherLoading ? "Syncing..." : "Auto-Sync Weather"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          type="button" onClick={() => onPickFromMap({ latitude, longitude })}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
            isDark
              ? "bg-white/5 text-slate-300 hover:bg-white/10"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <MapPinned className="h-4 w-4" /> Map Picker
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }} whileTap={{ scale: 0.98 }}
          type="button" onClick={onCheckRisk} disabled={loading}
          className="ml-auto flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {loading ? "Calculating..." : "Analyze Risk"}
        </motion.button>
      </div>

      {/* Analysis Result Card */}
      <AnimatePresence>
        {riskResult && (
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative z-10 mt-8 rounded-3xl border p-6 shadow-inner ${resultSurfaceClass}`}
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>Analysis Result</p>
                <h3 className={`text-4xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>
                  {riskScorePercent}% <span className="text-sm font-medium opacity-40 italic">Probability</span>
                </h3>
              </div>
              <div className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-tighter ${riskLabelClass[riskLevel] || riskLabelClass.Low}`}>
                <Cpu className="h-3.5 w-3.5" />
                {riskLevel} Risk Level
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className={`h-3 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-200/50"}`}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(5, riskScorePercent)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full shadow-[0_0_15px_rgba(0,0,0,0.1)] ${riskBarClass[riskLevel] || riskBarClass.Low}`}
                />
              </div>
            </div>

            {/* Factor Explainability */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`rounded-2xl p-4 ${isDark ? "bg-white/8" : "bg-white/40"}`}>
                <p className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  <Info className="h-3 w-3" /> Primary Drivers
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {riskResult.explainability?.top_factors?.map((f, i) => (
                    <span key={i} className={`rounded-lg px-2 py-1 text-[11px] font-bold shadow-sm ${isDark ? "bg-slate-800/85 text-slate-200" : "bg-white text-slate-700"}`}>
                      {f.factor} <span className="text-blue-500">+{Math.round(f.contribution * 100)}%</span>
                    </span>
                  )) || "Data unavailable"}
                </div>
              </div>

              <div className="flex flex-col justify-center px-2">
                <p className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>DATA SOURCE</p>
                <p className={`text-xs font-mono uppercase ${isDark ? "text-slate-300" : "text-slate-600"}`}>{riskResult.source || "ai-predict-v2.0"}</p>
                {offlineResult && (
                  <p className="mt-1 text-[10px] font-bold text-amber-500 uppercase tracking-tighter italic">Offline Cache Mode Active</p>
                )}
              </div>
            </div>

            <RecommendationSection riskLevel={riskLevel} recommendations={recommendations} isDark={isDark} />

          </motion.article>
        )}
      </AnimatePresence>
    </section>
  );
};

export default CitizenRiskForm;