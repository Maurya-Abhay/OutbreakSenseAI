import { FilePlus2, MapPin, Send, User, Mail, Activity, MessageSquare, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import CitizenSkeletonCard from "./CitizenSkeletonCard";

const CitizenReportForm = ({
  register,
  errors,
  loading,
  onSubmit,
  onUseCurrentGps,
  dataLoading,
  isDark = false
}) => {
  if (dataLoading) {
    return (
      <div className={`rounded-3xl border p-6 backdrop-blur-xl ${isDark ? "border-white/10 bg-slate-900/45" : "border-white/40 bg-white/40"}`}>
        <CitizenSkeletonCard rows={8} isDark={isDark} />
      </div>
    );
  }

  // Common Input Styles for reuse
  const inputBaseClass = `w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition-all focus:ring-4 focus:ring-blue-500/10 ${
    isDark
      ? "border-white/15 bg-slate-800/80 text-white placeholder:text-slate-500 focus:border-blue-400"
      : "border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500"
  }`;
  const labelClass = `flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
    isDark ? "text-slate-400" : "text-slate-600"
  }`;

  return (
    <section 
      className={`relative rounded-3xl border p-5 shadow-2xl backdrop-blur-2xl md:p-8 ${
        isDark ? "border-white/10 bg-slate-900/72" : "border-white/40 bg-white/60"
      }`} 
      aria-labelledby="citizen-report-heading"
    >
      {/* Aesthetic Background Glow */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-[100px]" />

      <header className="relative z-10 flex flex-col gap-1">
        <h2 id="citizen-report-heading" className={`flex items-center gap-2 text-xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <FilePlus2 className="h-5 w-5" />
          </div>
          Submit Clinical Case
        </h2>
        <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Your data helps AI models predict and mitigate local outbreaks.
        </p>
      </header>

      <form className="relative z-10 mt-8 grid grid-cols-1 gap-5 md:grid-cols-2" onSubmit={onSubmit}>
        
        {/* Reporter Name */}
        <div className="space-y-1.5">
          <label className={labelClass}>
            <User className="h-3.5 w-3.5" /> Full Name
          </label>
          <input {...register("reporterName")} className={inputBaseClass} placeholder="Full Name" />
          {errors.reporterName && <p className="flex items-center gap-1 text-[11px] font-bold text-rose-500"><AlertCircle className="h-3 w-3" /> {errors.reporterName.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className={labelClass}>
            <Mail className="h-3.5 w-3.5" /> Contact Email
          </label>
          <input {...register("reporterEmail")} type="email" className={inputBaseClass} placeholder="name@example.com" />
          {errors.reporterEmail && <p className="flex items-center gap-1 text-[11px] font-bold text-rose-500"><AlertCircle className="h-3 w-3" /> {errors.reporterEmail.message}</p>}
        </div>

        {/* Age */}
        <div className="space-y-1.5">
          <label className={labelClass}>
            <Activity className="h-3.5 w-3.5" /> Patient Age
          </label>
          <input {...register("age")} type="number" className={inputBaseClass} placeholder="Ex: 28" />
          {errors.age && <p className="flex items-center gap-1 text-[11px] font-bold text-rose-500"><AlertCircle className="h-3 w-3" /> {errors.age.message}</p>}
        </div>

        {/* Area Name */}
        <div className="space-y-1.5">
          <label className={labelClass}>
            <MapPin className="h-3.5 w-3.5" /> Neighborhood/Area
          </label>
          <input {...register("locationName")} className={inputBaseClass} placeholder="Ex: Sector 4, Dhaka" />
          {errors.locationName && <p className="flex items-center gap-1 text-[11px] font-bold text-rose-500"><AlertCircle className="h-3 w-3" /> {errors.locationName.message}</p>}
        </div>

        {/* Symptoms */}
        <div className="space-y-1.5 md:col-span-2">
          <label className={labelClass}>
             Primary Symptoms
          </label>
          <input {...register("symptoms")} className={inputBaseClass} placeholder="Fever, Joint Pain, Rash..." />
          {errors.symptoms && <p className="flex items-center gap-1 text-[11px] font-bold text-rose-500"><AlertCircle className="h-3 w-3" /> {errors.symptoms.message}</p>}
        </div>

        {/* Disease Type */}
        <div className="space-y-1.5">
          <label className={labelClass}>Disease Type</label>
          <select {...register("diseaseType")} className={`${inputBaseClass} appearance-none bg-no-repeat`}>
            <option value="Dengue">Dengue</option>
            <option value="Malaria">Malaria</option>
            <option value="COVID-19">COVID-19</option>
            <option value="Chikungunya">Chikungunya</option>
            <option value="Flu">Flu</option>
            <option value="Unknown">Unknown</option>
          </select>
          {errors.diseaseType && (
            <p className="flex items-center gap-1 text-[11px] font-bold text-rose-500">
              <AlertCircle className="h-3 w-3" /> {errors.diseaseType.message}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5 md:col-span-2">
          <label className={labelClass}>
            <MessageSquare className="h-3.5 w-3.5" /> Detailed Observations
          </label>
          <textarea {...register("notes")} rows={3} className={`${inputBaseClass} h-auto resize-none`} placeholder="Any specific travel history or onset details..." />
          {errors.notes && <p className="flex items-center gap-1 text-[11px] font-bold text-rose-500"><AlertCircle className="h-3 w-3" /> {errors.notes.message}</p>}
        </div>

        {/* Severity */}
        <div className="space-y-1.5">
          <label className={labelClass}>
            Self-Assessed Severity
          </label>
          <select {...register("severity")} className={`${inputBaseClass} appearance-none bg-no-repeat`}>
            <option value="low">🟢 Low (Stable)</option>
            <option value="medium">🟡 Medium (Requires Monitoring)</option>
            <option value="high">🔴 High (Emergency Attention)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2 md:flex-row md:items-end md:justify-end">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button" 
            onClick={onUseCurrentGps} 
            className={`flex h-11 items-center justify-center gap-2 rounded-2xl px-6 text-sm font-bold transition-colors ${
              isDark ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <MapPin className="h-4 w-4 text-blue-500" />
            GPS Locate
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading} 
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 text-sm font-black text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-700 disabled:opacity-50 md:flex-none"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Case File
              </>
            )}
          </motion.button>
        </div>
      </form>
    </section>
  );
};

export default CitizenReportForm;