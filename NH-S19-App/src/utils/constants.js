// Shared utility functions and constants for the app

export const debounce = (func, delay = 300) => {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function throttled(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Design system constants
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24
};

export const fontSize = {
  h1: 28,
  h2: 22,
  h3: 18,
  subtitle: 13,
  body: 14,
  caption: 11
};

export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extraBold: '800',
  black: '900'
};

// Disease configuration with icons and colors
export const diseaseConfig = {
  "Dengue": {
    icon: "alert-circle-outline",
    color: "#FF3B30", // danger red
    emoji: "🦟"
  },
  "Malaria": {
    icon: "flask-outline",
    color: "#FF9500", // orange
    emoji: "🧪"
  },
  "COVID-19": {
    icon: "shield-checkmark-outline",
    color: "#5B5BFF", // blue
    emoji: "🦠"
  },
  "Chikungunya": {
    icon: "warning-outline",
    color: "#FFB000", // yellow
    emoji: "⚠️"
  },
  "Flu": {
    icon: "thermometer-outline",
    color: "#00C7BE", // teal
    emoji: "🤒"
  },
  "Unknown": {
    icon: "help-circle-outline",
    color: "#9FB0C4", // gray
    emoji: "❓"
  }
};

// Severity configuration
export const severityConfig = {
  "low": {
    label: "Low",
    icon: "checkmark-circle-outline",
    color: "#34C759" // success green
  },
  "medium": {
    label: "Medium", 
    icon: "alert-circle-outline",
    color: "#FF9500" // warning orange
  },
  "high": {
    label: "High",
    icon: "close-circle-outline",
    color: "#FF3B30" // danger red
  }
};

export const textStyles = {
  h1: { fontSize: fontSize.h1, fontWeight: fontWeights.black, letterSpacing: -0.5 },
  h2: { fontSize: fontSize.h2, fontWeight: fontWeights.black, letterSpacing: -0.5 },
  h3: { fontSize: fontSize.h3, fontWeight: fontWeights.bold },
  subtitle: { fontSize: fontSize.subtitle, fontWeight: fontWeights.medium },
  body: { fontSize: fontSize.body, fontWeight: fontWeights.regular },
  caption: { fontSize: fontSize.caption, fontWeight: fontWeights.medium }
};
