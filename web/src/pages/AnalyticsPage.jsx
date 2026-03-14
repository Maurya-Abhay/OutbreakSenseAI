import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import PredictionChart from "../components/dashboard/PredictionChart";
import { formatPercent } from "../utils/formatters";

const includesTerm = (value, searchQuery) =>
  String(value || "").toLowerCase().includes(String(searchQuery || "").toLowerCase());

const AnalyticsPage = () => {
  const { trendsWeekly, trendsMonthly, locationBreakdown, loading, searchQuery } = useOutletContext();

  const topLocations = useMemo(() => {
    const source = locationBreakdown || [];
    const filtered = searchQuery
      ? source.filter((item) => includesTerm(item.locationName, searchQuery))
      : source;

    return [...filtered].sort((a, b) => b.avgRiskScore - a.avgRiskScore);
  }, [locationBreakdown, searchQuery]);

  return (
    <section className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* --- Prediction Chart Section --- */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950"
      >
        <PredictionChart
          weeklyData={trendsWeekly}
          monthlyData={trendsMonthly}
          locationData={locationBreakdown}
          loading={loading}
        />
      </motion.div>

      {/* --- Regional Breakdown Table --- */}
      <section className="rounded-[2.5rem] border border-slate-200 bg-white/50 p-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/50 shadow-sm">
        <header className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Regional Risk Ranking</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Prioritizing intervention zones based on AI risk modeling.</p>
          </div>
          <div className="mt-2 sm:mt-0">
             <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-black text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 uppercase tracking-widest">
               Sorted by Risk Score
             </span>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:border-slate-800">
                <th className="pb-4 px-2">Zone / Location</th>
                <th className="pb-4 px-2">Reports</th>
                <th className="pb-4 px-2">Risk Intensity</th>
                <th className="pb-4 px-2">Priority Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {topLocations.length ? (
                topLocations.map((location) => {
                  const riskValue = location.avgRiskScore * 100;
                  const priority =
                    location.avgRiskScore >= 0.7 ? "Critical" : location.avgRiskScore >= 0.5 ? "Elevated" : "Stable";

                  return (
                    <tr key={location.locationName} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-5 px-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{location.locationName}</span>
                      </td>
                      <td className="py-5 px-2">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {location.totalReports}
                        </span>
                      </td>
                      <td className="py-5 px-2 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${riskValue}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                priority === 'Critical' ? 'bg-red-500' : priority === 'Elevated' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <span className="text-xs font-black text-slate-500 dark:text-slate-400 min-w-[40px]">
                            {formatPercent(location.avgRiskScore)}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-2">
                        <div className="flex">
                          <span
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                              priority === "Critical"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : priority === "Elevated"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                               priority === "Critical" ? "bg-red-500" : priority === "Elevated" ? "bg-amber-500" : "bg-emerald-500"
                            }`} />
                            {priority}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <p className="text-sm font-medium text-slate-400">No regional intelligence data found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
};

export default AnalyticsPage;