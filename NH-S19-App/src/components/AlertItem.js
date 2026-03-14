import { memo, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { resolveRiskColor } from "../theme/palette";

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  
  return date.toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit",
    hour12: true 
  });
};

const AlertItem = ({ theme, alert, isLast }) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const levelLower = String(alert?.level || "low").toLowerCase();
  const levelColor = resolveRiskColor(levelLower, theme);

  // Status based icons
  const iconConfig = useMemo(() => {
    switch(levelLower) {
      case 'high': return { name: "flame", size: 16 };
      case 'medium': return { name: "alert-circle", size: 16 };
      default: return { name: "information-circle", size: 16 };
    }
  }, [levelLower]);

  return (
    <View style={[styles.container, isLast && styles.noBorder]}>
      {/* 🔴 Unread Dot Indicator */}
      {!alert?.read && <View style={[styles.unreadDot, { backgroundColor: theme.blue || '#007AFF' }]} />}

      <View style={[styles.iconWrap, { backgroundColor: `${levelColor}15` }]}>
        <Ionicons name={iconConfig.name} size={iconConfig.size} color={levelColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{alert?.title || "Health Signal"}</Text>
          <Text style={styles.time}>{formatTime(alert?.createdAt)}</Text>
        </View>

        <Text style={styles.message} numberOfLines={2}>
          {alert?.message || "No specific details provided for this alert."}
        </Text>

        {alert?.locationName && (
          <View style={styles.locationTag}>
            <Ionicons name="location-sharp" size={10} color={theme.textMuted} />
            <Text style={styles.locationText}>{alert.locationName}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.line,
      gap: 12,
      position: 'relative'
    },
    noBorder: {
      borderBottomWidth: 0
    },
    unreadDot: {
      position: 'absolute',
      left: -8,
      top: '55%',
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2
    },
    content: {
      flex: 1,
      justifyContent: 'center'
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 2
    },
    title: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
      flex: 1,
      marginRight: 8
    },
    time: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "600"
    },
    message: {
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500"
    },
    locationTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6
    },
    locationText: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "700",
      textTransform: 'uppercase',
      letterSpacing: 0.3
    }
  });

export default memo(AlertItem);