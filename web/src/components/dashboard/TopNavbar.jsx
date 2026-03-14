import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "../common/SearchBar";
import NotificationDropdown from "../common/NotificationDropdown";

// --- Custom Modern Icons ---
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" />
  </svg>
);

const quickLinks = [
  { label: "Overview", to: "/admin/dashboard" },
  { label: "Risk Map", to: "/admin/risk-map" },
  { label: "Reports", to: "/admin/reports" },
  { label: "Analytics", to: "/admin/analytics" },
  { label: "Alerts", to: "/admin/alerts" }
];

const TopNavbar = ({
  user,
  searchQuery,
  onSearchQueryChange,
  notifications,
  onClearNotifications,
  isDark,
  onToggleTheme,
  onMobileMenu,
  onLogout
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const clickHandler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", clickHandler);
    return () => document.removeEventListener("mousedown", clickHandler);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/70 px-4 py-3 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/70 md:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Search */}
        <div className="flex flex-1 items-center gap-4">
          <button
            type="button"
            onClick={onMobileMenu}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 lg:hidden dark:bg-slate-900 dark:text-slate-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M4 8h16M4 16h16" strokeLinecap="round" />
            </svg>
          </button>

          <div className="max-w-md flex-1">
            <SearchBar value={searchQuery} onChange={onSearchQueryChange} />
          </div>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Quick Links (Hidden on small screens) */}
          <nav className="hidden items-center gap-1.5 border-r border-slate-200/60 pr-4 dark:border-slate-800/60 xl:flex">
            {quickLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-xs font-bold tracking-tight transition-all duration-200 ${
                    isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/50 bg-white text-slate-500 transition-all hover:bg-slate-50 dark:border-slate-800/50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <NotificationDropdown notifications={notifications} onClearAll={onClearNotifications} />

          {/* User Profile Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="group flex items-center gap-2.5 rounded-2xl border border-slate-200/60 bg-white p-1.5 pr-3 transition-all hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50"
            >
              <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500">
                <span className="flex h-full w-full items-center justify-center text-[13px] font-black text-white">
                  {(user?.name || "AD").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="hidden text-left md:block">
                <p className="text-[12px] font-bold leading-none text-slate-900 dark:text-white">
                  {user?.name || "Admin User"}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Manage Account
                </p>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`h-3 w-3 text-slate-400 transition-transform duration-300 ${menuOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-indigo-900/10 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-900 mb-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Account</p>
                    <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{user?.email || "admin@outbreaksense.ai"}</p>
                  </div>
                  
                  <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Logout Session
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </header>
  );
};

export default TopNavbar;