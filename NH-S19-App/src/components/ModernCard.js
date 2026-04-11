import { memo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Modern Card component with gradient background and shadows
 * Supports glassmorphism effect
 */
const ModernCard = memo(({ 
  theme, 
  children, 
  gradient = null,
  shadow = "md",
  border = true,
  padding = 20,
  borderRadius = 18,
  style = {}
}) => {
  const shadowMap = {
    xs: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    sm: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2
    },
    md: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3
    },
    lg: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4
    }
  };

  const shadowStyle = shadowMap[shadow] || shadowMap.md;

  // Use gradient if provided, otherwise use theme card
  const colors = gradient || [theme.card, theme.card];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          borderRadius,
          padding,
          ...shadowStyle,
          borderWidth: border ? 0.5 : 0,
          borderColor: theme.line
        },
        style
      ]}
    >
      {children}
    </LinearGradient>
  );
});

ModernCard.displayName = "ModernCard";

export default ModernCard;
