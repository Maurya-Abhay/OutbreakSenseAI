import SkeletonBlock from "../common/SkeletonBlock";

const CitizenSkeletonCard = ({ rows = 4, className = "", isDark = false }) => {
  return (
    <section 
      className={`relative overflow-hidden rounded-3xl border p-5 backdrop-blur-xl ${
        isDark ? "border-white/10 bg-slate-900/45" : "border-white/40 bg-white/40"
      } ${className}`} 
      aria-live="polite" 
      aria-busy="true"
    >
      {/* Skeleton Header Section */}
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-xl opacity-60" /> {/* Icon placeholder */}
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-48 rounded-lg" />
          <SkeletonBlock className="h-3 w-64 rounded-lg opacity-50" />
        </div>
      </div>

      {/* Skeleton Body Rows */}
      <div className="mt-8 space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={`citizen-skeleton-row-${index}`} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SkeletonBlock 
                className="h-4 rounded-lg" 
                style={{ width: `${Math.floor(Math.random() * (70 - 40 + 1) + 40)}%` }} 
              />
              <SkeletonBlock className="h-6 w-16 rounded-md opacity-40" />
            </div>
            <SkeletonBlock className="h-3 w-full rounded-lg opacity-30" />
            
            {/* Divider line for list items */}
            {index < rows - 1 && (
              <div className={`mt-2 h-px w-full ${isDark ? "bg-white/10" : "bg-slate-200/50"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Subtle Shimmer Overlay (Optional: If your SkeletonBlock doesn't handle it) */}
      <div
        className={`absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent to-transparent ${
          isDark ? "via-white/8" : "via-white/10"
        }`}
      />
    </section>
  );
};

export default CitizenSkeletonCard;