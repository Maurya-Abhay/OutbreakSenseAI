// 🌈 MODERN NEXT-GEN THEME WITH GRADIENTS & ANIMATIONS

export const lightTheme = {
  // 🎨 Background Gradients
  bgGradient: ["#F8FAFC", "#F0F4F9"],
  cardGradient: ["#FFFFFF", "#F8FAFB"],
  
  // Base Colors
  bg: "#F8FAFC",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  sheet: "#FFFFFF",
  line: "#E2E8F0",
  
  // Text Colors (Modern)
  text: "#0F172A",
  textSoft: "#475569",
  textMuted: "#94A3B8",
  
  // Brand Colors (Premium)
  brand: "#F59E0B",
  brandSoft: "#FEF3C7",
  brandGradient: ["#F59E0B", "#D97706"],
  
  // Status Colors (Vibrant)
  success: "#10B981",
  successGradient: ["#10B981", "#059669"],
  warn: "#F59E0B",
  warning: "#F59E0B",
  warnGradient: ["#F59E0B", "#D97706"],
  danger: "#EF4444",
  dangerGradient: ["#EF4444", "#DC2626"],
  
  // Blues & Accents
  blue: "#3B82F6",
  blueGradient: ["#3B82F6", "#1D4ED8"],
  cyan: "#06B6D4",
  purple: "#8B5CF6",
  pink: "#EC4899",
  
  // Special
  infoPanel: "#FBFCFE",
  track: "#E2E8F0",
  softBlue: "#EFF6FF",
  tabBar: "#FFFFFF",
  tabInactive: "#94A3B8",
  inputBg: "#F8FAFC",
  shadow: "#1F293740",
  
  // Overlay
  overlay: "#0F172A80",
  overlayLight: "#0F172A20"
};

export const darkTheme = {
  // 🎨 Background Gradients (Dark)
  bgGradient: ["#0F172A", "#1A2640"],
  cardGradient: ["#1E293B", "#111827"],
  
  // Base Colors
  bg: "#0F172A",
  card: "#1E293B",
  cardElevated: "#293548",
  sheet: "#1A2640",
  line: "#334155",
  
  // Text Colors (Bright for dark)
  text: "#F1F5F9",
  textSoft: "#CBD5E1",
  textMuted: "#94A3B8",
  
  // Brand Colors (Premium)
  brand: "#FBBF24",
  brandSoft: "#1F1508",
  brandGradient: ["#FBBF24", "#F59E0B"],
  
  // Status Colors (Vibrant)
  success: "#34D399",
  successGradient: ["#34D399", "#10B981"],
  warn: "#FBBF24",
  warning: "#FBBF24",
  warnGradient: ["#FBBF24", "#F59E0B"],
  danger: "#F87171",
  dangerGradient: ["#F87171", "#EF4444"],
  
  // Blues & Accents
  blue: "#60A5FA",
  blueGradient: ["#60A5FA", "#3B82F6"],
  cyan: "#22D3EE",
  purple: "#A78BFA",
  pink: "#F472B6",
  
  // Special
  infoPanel: "#111827",
  track: "#334155",
  softBlue: "#1E3A8A",
  tabBar: "#1A2640",
  tabInactive: "#60A5FA",
  inputBg: "#293548",
  shadow: "#00000080",
  
  // Overlay
  overlay: "#00000080",
  overlayLight: "#FFFFFF10"
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

// ✨ MODERN DESIGN UTILITIES

/**
 * Modern shadows for glassmorphism & elevation
 */
export const modernShadows = {
  xs: { shadowColor: "#000000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sm: { shadowColor: "#000000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: "#000000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4 },
  xl: { shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 5 }
};

/**
 * Modern border radius (rounded corners)
 */
export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999
};

/**
 * Animations timing
 */
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800
};

/**
 * Modern button styles with gradients
 */
export const buttonStyles = {
  primary: (theme) => ({
    background: theme.brandGradient || [theme.brand, theme.brand],
    shadow: modernShadows.md,
    border: "none"
  }),
  success: (theme) => ({
    background: theme.successGradient || [theme.success, theme.success],
    shadow: modernShadows.md,
    border: "none"
  }),
  danger: (theme) => ({
    background: theme.dangerGradient || [theme.danger, theme.danger],
    shadow: modernShadows.md,
    border: "none"
  }),
  secondary: (theme) => ({
    background: "transparent",
    border: `1.5px solid ${theme.line}`,
    shadow: "none"
  })
};

/**
 * Card elevation styles for depth
 */
export const cardElevation = {
  base: {
    borderRadius: borderRadius.lg,
    borderWidth: 0.5
  },
  elevated: {
    borderRadius: borderRadius.lg,
    borderWidth: 0.5,
    elevation: 4
  }
};

/**
 * Text styles with modern typography
 */
export const typographyStyles = {
  display: { fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: "800", letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: "800", letterSpacing: 0 },
  subtitle: { fontSize: 16, fontWeight: "600", letterSpacing: 0.2 },
  body: { fontSize: 14, fontWeight: "500", letterSpacing: 0.15 },
  caption: { fontSize: 12, fontWeight: "600", letterSpacing: 0.1 }
};