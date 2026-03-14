import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { formatDateTime } from "../../utils/formatters";

const BellIcon = ({ hasNew }) => (
  <div className="relative">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M15 17h5l-1.2-1.2a2 2 0 0 1-.6-1.4V10a6.2 6.2 0 1 0-12.4 0v4.4a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </svg>
    {hasNew && (
      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
    )}
  </div>
);

const getStatusStyles = (type) => {
  switch (type) {
    case "danger": return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]";
    case "success": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    default: return "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]";
  }
};

const NotificationDropdown = ({ notifications = [], onClearAll }) => {
  const [open, setOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [readIds, setReadIds] = useState([]);
  const wrapperRef = useRef(null);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !dismissedIds.includes(item.id)),
    [dismissedIds, notifications]
  );

  const unreadCount = useMemo(
    () => visibleNotifications.filter((item) => !readIds.includes(item.id)).length,
    [readIds, visibleNotifications]
  );

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const validIds = notifications.map((item) => item.id);
    setDismissedIds((current) => current.filter((id) => validIds.includes(id)));
    setReadIds((current) => current.filter((id) => validIds.includes(id)));
  }, [notifications]);

  useEffect(() => {
    if (!open || !visibleNotifications.length) {
      return;
    }

    setReadIds((current) => {
      const merged = new Set(current);
      visibleNotifications.forEach((item) => merged.add(item.id));
      return [...merged];
    });
  }, [open, visibleNotifications]);

  const handleClearAll = () => {
    if (visibleNotifications.length) {
      setDismissedIds((current) => {
        const merged = new Set(current);
        visibleNotifications.forEach((item) => merged.add(item.id));
        return [...merged];
      });
    }

    if (typeof onClearAll === "function") {
      onClearAll();
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      {/* --- Toggle Button --- */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Open notifications"
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
          open 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
          : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
        }`}
      >
        <BellIcon hasNew={unreadCount > 0} />
      </button>

      {/* --- Dropdown Menu --- */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute right-0 z-[100] mt-3 w-80 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-slate-800 dark:bg-slate-900/98"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Alerts</h3>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-600 dark:bg-indigo-500/10">
                {unreadCount} New
              </span>
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto p-2 scrollbar-hide">
              {visibleNotifications.length > 0 ? (
                visibleNotifications.map((item, idx) => (
                  <motion.article
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={item.id}
                    className="group relative mb-1 flex flex-col gap-1 rounded-2xl p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full transition-transform group-hover:scale-125 ${getStatusStyles(item.type)}`} />
                      <p className="text-[13px] font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                    </div>
                    <p className="pl-5 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                      {item.message}
                    </p>
                    <time className="pl-5 text-[10px] font-bold uppercase tracking-tight text-slate-400">
                      {formatDateTime(item.createdAt)}
                    </time>
                  </motion.article>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="mb-3 rounded-full bg-slate-50 p-3 dark:bg-slate-800">
                    <svg className="h-6 w-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Alerts</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {visibleNotifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="w-full border-t border-slate-100 bg-slate-50/50 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-800/30"
              >
                Clear All Notifications
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;