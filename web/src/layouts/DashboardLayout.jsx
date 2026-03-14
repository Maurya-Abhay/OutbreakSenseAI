import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SidebarNavigation from "../components/dashboard/SidebarNavigation";
import TopNavbar from "../components/dashboard/TopNavbar";
import { useDashboardData } from "../hooks/useDashboardData";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const dashboard = useDashboardData();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const outletContext = useMemo(
    () => ({
      ...dashboard,
      searchQuery,
      setSearchQuery
    }),
    [dashboard, searchQuery]
  );

  return (
    <div className="dashboard-shell min-h-screen transition-colors duration-300">
      <div className="flex h-screen overflow-hidden">
        {/* --- Sidebar Component --- */}
        <SidebarNavigation
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* --- Main Content Wrapper --- */}
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          
          {/* Subtle Background Glow for Main Content */}
          <div className="pointer-events-none absolute top-0 right-0 h-[500px] w-[500px] bg-indigo-500/5 blur-[120px] dark:bg-indigo-600/10" />

          {/* --- Top Header Navigation --- */}
          <TopNavbar
            user={user}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            notifications={dashboard.notifications}
            onClearNotifications={dashboard.clearNotifications}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onMobileMenu={() => setMobileSidebarOpen(true)}
            onLogout={logout}
          />

          {/* --- Main Scrollable Area --- */}
          <main className="relative flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:py-8">
            <div className="mx-auto max-w-[1600px] space-y-6">
              
              {/* --- Top Action/Info Bar --- */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                    dashboard.dataSource === "live-api" 
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${dashboard.dataSource === "live-api" ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    System Status: {dashboard.dataSource === "live-api" ? "Operational" : "Sandbox Mode"}
                  </div>
                  
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Last Sync: {dashboard.lastUpdated ? new Date(dashboard.lastUpdated).toLocaleTimeString() : "Fetching..."}
                  </span>
                </div>

                {/* Optional: Breadcrumbs or Page Quick Links can go here */}
              </div>

              {/* --- Real-time Notifications/Hints --- */}
              <AnimatePresence mode="wait">
                {dashboard.realtimeHint && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="group relative flex items-center justify-between overflow-hidden rounded-[1.25rem] border border-indigo-100 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {dashboard.realtimeHint}
                      </p>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* --- Dynamic Page Content --- */}
              <div className="min-h-[calc(100vh-250px)]">
                <Outlet context={outletContext} />
              </div>
            </div>

            {/* --- Footer Signature --- */}
            <footer className="mt-12 flex items-center justify-center border-t border-slate-100 py-6 dark:border-slate-800/50">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                OutbreakSense AI Intelligence Unit &copy; 2026
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;