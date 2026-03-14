import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { classNames } from "../../utils/formatters";

const iconClass = "h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3";

// --- Clean & Professional SVG Icons ---
const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const MapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
    <path d="M9 4v16M15 6v16" />
  </svg>
);

const ReportIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={iconClass} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const navigationItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: DashboardIcon },
  { label: "Risk Map", path: "/admin/risk-map", icon: MapIcon },
  { label: "Citizen Reports", path: "/admin/reports", icon: ReportIcon },
  { label: "Analytics", path: "/admin/analytics", icon: AnalyticsIcon },
  { label: "Alerts", path: "/admin/alerts", icon: AlertIcon },
  { label: "Settings", path: "/admin/settings", icon: SettingsIcon }
];

const SidebarNavigation = ({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) => {
  const SidebarContent = (
    <aside
      className={classNames(
        "flex h-full flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "sidebar-glass border-r border-slate-200/50 dark:border-slate-800/50",
        collapsed ? "w-[88px]" : "w-[280px]"
      )}
    >
      {/* --- Brand Header --- */}
      <div className="flex h-20 items-center px-6 mb-4">
        <div className={classNames("flex items-center gap-3", collapsed && "mx-auto")}>
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 opacity-40 blur transition duration-500 group-hover:opacity-100" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-black shadow-xl">
              OS
            </div>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <h1 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight">OutbreakSense AI</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-500 dark:text-indigo-400">Control Center</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* --- Main Navigation --- */}
      <nav className="flex-1 space-y-1.5 px-4 overflow-y-auto custom-scrollbar">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                classNames(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[14px] font-semibold transition-all duration-300",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-white dark:text-slate-950 dark:shadow-white/10"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon />
                  {!collapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}

                  {isActive && !collapsed ? (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute left-0 h-6 w-1 rounded-r-full bg-indigo-500 dark:bg-indigo-400"
                    />
                  ) : null}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* --- Sidebar Footer (Collapse Toggle) --- */}
      <div className="p-4 mt-auto">
        <button
          onClick={onToggleCollapse}
          className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 py-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
        >
          <div className={classNames("transition-transform duration-500", collapsed && "rotate-180")}>
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
             </svg>
          </div>
          {!collapsed && <span className="text-xs font-bold uppercase tracking-widest">Collapse View</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-screen sticky top-0 lg:block overflow-hidden">{SidebarContent}</div>

      {/* Mobile Sidebar with Animation */}
      <AnimatePresence mode="wait">
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex bg-slate-950/40 backdrop-blur-md lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
          >
            <motion.div
              initial={{ x: "-100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {SidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SidebarNavigation;