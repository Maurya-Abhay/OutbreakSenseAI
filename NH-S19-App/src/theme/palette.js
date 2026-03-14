export const lightTheme = {
  bg: "#F5F6F8",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  sheet: "#FFFFFF",
  line: "#E6E9EF",
  text: "#1A2433",
  textSoft: "#6B7280",
  textMuted: "#9CA3AF",
  brand: "#F5A300",
  brandSoft: "#FFF5D8",
  success: "#14965A",
  warn: "#D97A00",
  danger: "#C73B2A",
  blue: "#2876B7",
  infoPanel: "#FBFCFE",
  track: "#EDF0F5",
  softBlue: "#EAF2FF",
  tabBar: "#FFFFFF",
  inputBg: "#FFFFFF",
  shadow: "#000000"
};

export const darkTheme = {
  bg: "#0C1118",
  card: "#141B24",
  cardElevated: "#1A2430",
  sheet: "#151E29",
  line: "#273243",
  text: "#E7EEF7",
  textSoft: "#9FB0C4",
  textMuted: "#7C8CA0",
  brand: "#F5A300",
  brandSoft: "#2C2412",
  success: "#34D399",
  warn: "#F59E0B",
  danger: "#F87171",
  blue: "#4D9DF5",
  infoPanel: "#101824",
  track: "#2D394A",
  softBlue: "#1F3048",
  tabBar: "#101722",
  inputBg: "#1A2430",
  shadow: "#000000"
};

/**
 * Level ke basis par color aur background color (alpha) dono return karta hai
 * Taaki aap badges/chips design kar sako.
 */
export const resolveRiskTheme = (level, theme) => {
  const normalized = String(level || "").toLowerCase();
  
  const mapping = {
    high: { main: theme.danger, surface: `${theme.danger}15` }, // 15% opacity
    medium: { main: theme.warn, surface: `${theme.warn}15` },
    low: { main: theme.success, surface: `${theme.success}15` },
    default: { main: theme.textSoft, surface: theme.track }
  };

  if (normalized.includes("high") || normalized.includes("critical")) return mapping.high;
  if (normalized.includes("medium") || normalized.includes("warn")) return mapping.medium;
  if (normalized.includes("low") || normalized.includes("safe")) return mapping.low;

  return mapping.default;
};

/**
 * Score ke base par text color decide karne ke liye
 */
export const getScoreColor = (score, theme) => {
  const val = Number(score);
  if (val >= 0.7) return theme.danger;
  if (val >= 0.4) return theme.warn;
  return theme.success;
};

export const toScorePercent = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return `${Math.round(parsed * 100)}%`;
};

// Quick fix for resolveRiskColor to keep backward compatibility
export const resolveRiskColor = (level, theme) => resolveRiskTheme(level, theme).main;