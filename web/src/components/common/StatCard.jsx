import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const sparkColor = {
  blue: "from-brand-primary/30 to-brand-primary/0",
  teal: "from-brand-teal/30 to-brand-teal/0",
  amber: "from-brand-warning/30 to-brand-warning/0",
  red: "from-brand-danger/30 to-brand-danger/0"
};

const pulseColor = {
  blue: "bg-brand-primary",
  teal: "bg-brand-teal",
  amber: "bg-brand-warning",
  red: "bg-brand-danger"
};

const animateNumber = (target, setDisplayValue) => {
  const toNumber = Number(target);

  if (!Number.isFinite(toNumber)) {
    setDisplayValue(target);
    return () => {};
  }

  const start = performance.now();
  const duration = 750;

  const frame = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    setDisplayValue(Math.round(toNumber * eased));

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  };

  const id = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(id);
};

const StatCard = ({ title, value, subtitle, tone = "blue", suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => animateNumber(value, setDisplayValue), [value]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/85 bg-gradient-to-br from-white/94 to-slate-50/70 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-sky-300/70 dark:border-slate-700/80 dark:from-slate-900/78 dark:to-slate-800/50"
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-gradient-to-br blur-2xl ${
          sparkColor[tone] || sparkColor.blue
        }`}
      />

      <div className="relative flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${pulseColor[tone] || pulseColor.blue}`} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
          {title}
        </p>
      </div>

      <p className="relative mt-3 text-3xl font-bold text-slate-900 dark:text-white">
        {displayValue}
        {suffix}
      </p>

      {subtitle ? (
        <p className="relative mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      ) : null}
    </motion.article>
  );
};

export default StatCard;
