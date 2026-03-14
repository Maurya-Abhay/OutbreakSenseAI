import { useTheme } from "../hooks/useTheme";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";

const SettingsPage = () => {
  const { isDark, toggleTheme } = useTheme();
  const { dataSource, refresh, downloadExport } = useOutletContext();

  const cardVariants = {
    hover: { y: -5, transition: { duration: 0.2 } }
  };

  return (
    <section className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* --- Page Header --- */}
      <header>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          System <span className="text-indigo-600">Preferences</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Configure your workspace, data connectivity, and export protocols.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* --- Theme Control --- */}
        <motion.article 
          variants={cardVariants} whileHover="hover"
          className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
            {isDark ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
          </div>
          
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Interface Mode</h3>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Personalize your viewing experience for day or night.
          </p>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/50">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {isDark ? "Dark Mode" : "Light Mode"}
            </span>
            <button
              onClick={toggleTheme}
              className={`relative h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none ${isDark ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${isDark ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </motion.article>

        {/* --- Data Connectivity --- */}
        <motion.article 
          variants={cardVariants} whileHover="hover"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
          </div>
          
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Intelligence Engine</h3>
          <div className="mt-2 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full animate-pulse ${dataSource === 'live-api' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {dataSource === "live-api" ? "Production API Active" : "Demo Sandbox Mode"}
            </span>
          </div>

          <button 
            onClick={refresh}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-black tracking-widest text-white transition-all hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            RE-SYNC DATA
          </button>
        </motion.article>

        {/* --- Export Protocols --- */}
        <motion.article 
          variants={cardVariants} whileHover="hover"
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2 lg:col-span-1"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" /></svg>
          </div>
          
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">Export Protocols</h3>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Download encrypted intelligence reports for external use.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <button 
              onClick={() => downloadExport("csv")}
              className="rounded-xl border border-slate-200 py-3 text-[11px] font-black tracking-widest text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              CSV FORMAT
            </button>
            <button 
              onClick={() => downloadExport("pdf")}
              className="rounded-xl border border-slate-200 py-3 text-[11px] font-black tracking-widest text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              PDF FORMAT
            </button>
          </div>
        </motion.article>

      </div>

      {/* --- Footer Info --- */}
      <footer className="rounded-[2rem] bg-indigo-600 p-8 text-white dark:bg-indigo-900/40">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-lg font-bold text-white">Advanced System Audit</h4>
            <p className="text-sm text-indigo-100 dark:text-indigo-300">All administrative actions are logged for security compliance.</p>
          </div>
          <button className="rounded-xl bg-white px-6 py-3 text-xs font-black tracking-widest text-indigo-600 transition hover:bg-indigo-50">
            VIEW AUDIT LOGS
          </button>
        </div>
      </footer>
    </section>
  );
};

export default SettingsPage;