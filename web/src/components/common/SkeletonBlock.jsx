const SkeletonBlock = ({ className = "h-4 w-full" }) => {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/70 ${className}`} />;
};

export default SkeletonBlock;
