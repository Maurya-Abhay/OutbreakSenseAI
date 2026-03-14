import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HeatmapMap = ({ theme, points, onPickLocation, enableLocationPicker = false, currentLocation }) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryColor = theme.blue || "#007AFF";
  
  // Top 4 critical points dikhayenge as a summary
  const previewPoints = Array.isArray(points) ? points.slice(0, 4) : [];

  return (
    <View style={styles.wrap}>
      {/* ⚠️ Non-Native Platform Notice */}
      <View style={styles.platformNotice}>
        <View style={styles.iconCircle}>
          <Ionicons name="map-outline" size={20} color={primaryColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Map View Unavailable</Text>
          <Text style={styles.subtitle}>
            Interactive heatmaps require a physical device or Expo Go. Showing live data snapshot instead.
          </Text>
        </View>
      </View>

      {/* 📊 Fast Stats Card */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TRACKED ZONES</Text>
          <Text style={styles.statValue}>{points?.length || 0}</Text>
        </View>
        <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: theme.line }]}>
          <Text style={styles.statLabel}>ACCURACY</Text>
          <Text style={styles.statValue}>GPS-Sync</Text>
        </View>
      </View>

      {/* 📍 Selection Assistant */}
      {enableLocationPicker && (
        <Pressable
          style={({ pressed }) => [
            styles.pickBtn,
            { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={() => {
            const first = previewPoints[0];
            const coords = first?.latitude ? 
              { latitude: Number(first.latitude), longitude: Number(first.longitude) } : 
              { latitude: 23.8103, longitude: 90.4125 };
            onPickLocation?.(coords);
          }}
        >
          <Ionicons name="location" size={16} color="#FFF" />
          <Text style={styles.pickBtnText}>Use Suggested Coordinates</Text>
        </Pressable>
      )}

      {/* 📝 Point Inspector List */}
      <View style={styles.listSection}>
        <Text style={styles.listHeader}>ACTIVE RISK HOTSPOTS</Text>
        {previewPoints.map((point, idx) => (
          <View key={`${point.locationName}-${idx}`} style={styles.row}>
            <View style={[styles.riskIndicator, { backgroundColor: theme.danger || '#FF3B30' }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{point.locationName || "Unnamed Zone"}</Text>
              <Text style={styles.rowMeta}>
                Intensity: {Math.round(Number(point.averageRisk || 0) * 100)}% • {String(point.riskLevel).toUpperCase()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
          </View>
        ))}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Current Focus: {currentLocation?.locationName || "Global Feed"}</Text>
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: theme.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.line,
      overflow: "hidden",
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
        android: { elevation: 4 }
      })
    },
    platformNotice: {
      flexDirection: 'row',
      padding: 16,
      backgroundColor: theme.cardElevated || theme.bg,
      gap: 12,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: theme.line
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.line
    },
    title: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "800"
    },
    subtitle: {
      color: theme.textSoft,
      fontSize: 11,
      lineHeight: 15,
      marginTop: 2
    },
    statsContainer: {
      flexDirection: 'row',
      paddingVertical: 12,
      backgroundColor: theme.card,
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2
    },
    statLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.textMuted,
      letterSpacing: 0.5
    },
    statValue: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text
    },
    pickBtn: {
      marginHorizontal: 16,
      marginVertical: 8,
      height: 44,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    pickBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700"
    },
    listSection: {
      padding: 16,
      gap: 12
    },
    listHeader: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.textMuted,
      letterSpacing: 1,
      marginBottom: 4
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 8,
    },
    riskIndicator: {
      width: 4,
      height: 24,
      borderRadius: 2
    },
    rowTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
    },
    rowMeta: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "600",
      marginTop: 1
    },
    footer: {
      padding: 12,
      backgroundColor: theme.bg,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.line
    },
    footerText: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '700'
    }
  });

export default memo(HeatmapMap);