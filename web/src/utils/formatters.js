export const formatCompactNumber = (value) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number(value) || 0
  );

export const formatPercent = (value) => `${Math.round((Number(value) || 0) * 100)}%`;

export const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export const formatDateShort = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

export const capitalize = (value) => {
  if (!value) return "";
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

export const classNames = (...values) => values.filter(Boolean).join(" ");
