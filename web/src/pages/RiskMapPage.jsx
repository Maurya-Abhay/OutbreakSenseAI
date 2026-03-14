import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import RiskHeatmapMap from "../components/dashboard/RiskHeatmapMap";
import { formatPercent } from "../utils/formatters";

const includesTerm = (value, searchQuery) =>
  String(value || "").toLowerCase().includes(String(searchQuery || "").toLowerCase());

const RiskMapPage = () => {
  const { heatPoints, loading, searchQuery } = useOutletContext();

  const visiblePoints = useMemo(() => {
    if (!searchQuery) return heatPoints;
    return heatPoints.filter((point) => includesTerm(point.locationName, searchQuery));
  }, [heatPoints, searchQuery]);

  // Risk buckets for high-level summary
  const criticalZones = visiblePoints.filter(p => p.averageRisk >= 0.7).length;

  return (
    <section className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* --- Map Section with Glass Header --- */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="absolute top-6 left-6 z-[10] hidden md:block">
          <div className="rounded-2xl border border-white/20 bg-slate-900/80 p-4 backdrop-blur-md dark:bg-black/60">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Map Legend</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <span className="text-[11px] font-bold text-white">Critical Risk (&gt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-[11px] font-bold text-white">Warning (40-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[11px] font-bold text-white">Stable Zone</span>
              </div>
            </div>
          </div>
        </div>

        <RiskHeatmapMap
          points={visiblePoints}
          loading={loading}
          title="Geospatial Risk Intelligence"
          subtitle="Real-time heatmap based on citizen reports and AI analysis."
        />
      </div>

      {/* --- Region Insights Grid --- */}
      <section className="space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Zonal Intelligence</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Granular breakdown of reported risk vectors by neighborhood.</p>
          </div>
          {criticalZones > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              <span className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">{criticalZones} High Priority Zones</span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiblePoints.length ? (
            visiblePoints.map((point, index) => {
              const isHigh = point.averageRisk >= 0.7;
              const trendText = String(point.predictionTrend || "").trim();
              const trendIsRising = trendText.startsWith("+") || /rise|up/i.test(trendText);
              return (
                <motion.article 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  key={`${point.locationName}-${point.latitude}-${point.longitude}`} 
                  className={`group relative overflow-hidden rounded-3xl border p-5 transition-all hover:shadow-xl dark:bg-slate-900/50 ${
                    isHigh 
                      ? "border-red-100 bg-red-50/30 dark:border-red-900/20 shadow-red-100/50" 
                      : "border-slate-200 bg-white dark:border-slate-800 shadow-slate-100/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{point.locationName}</p>
                      <h4 className={`mt-1 text-lg font-black ${isHigh ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {formatPercent(point.averageRisk)}
                      </h4>
                    </div>
                    <div className={`rounded-xl p-2 ${isHigh ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-slate-400">Reports</p>
                      <p className="text-sm font-bold dark:text-white">{point.totalReports}</p>
                    </div>
                    <div className="text-center border-l border-slate-100 px-4 dark:border-slate-800">
                      <p className="text-[10px] font-black uppercase text-slate-400">Trend</p>
                      <p className={`text-sm font-bold ${trendIsRising ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {point.predictionTrend || "Stable"}
                      </p>
                    </div>
                    <div className="text-right">
                       <div className={`h-1.5 w-8 rounded-full ${isHigh ? 'bg-red-500' : 'bg-indigo-500'}`} />
                    </div>
                  </div>
                </motion.article>
              );
            })
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
              <p className="text-sm font-medium text-slate-500">No spatial intelligence for the current search query.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
};

export default RiskMapPage;