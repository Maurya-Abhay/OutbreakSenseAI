import { memo } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RiskCard from "../components/RiskCard";
import TrendChart from "../components/TrendChart";
import { toScorePercent } from "../theme/palette";

const HomeScreen = ({
  theme,
  riskResult,
  riskLoading,
  onRiskCheck,
  onDetectLocation,
  currentLocation,
  nearbyCasesCount,
  communityRiskLevel,
  highRiskZones,
  weeklyPeak,
  trends,
  alertsFeed,
  isOffline,
  usingCachedData,
  lastCheckedAt
}) => {
  const styles = createStyles(theme);

  // Fallback icon color logic to ensure it adapts to theme
  const primaryColor = theme.blue || theme.brand || "#007AFF";

  return (
    <ScrollView 
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      {/* Native System Status Banners */}
      {isOffline && (
        <View style={styles.bannerOffline}>
          <View style={styles.bannerIconWrapWarning}>
            <Ionicons name="cloud-offline" size={16} color={theme.warn || "#FF9500"} />
          </View>
          <Text style={styles.bannerText}>Offline mode active. Showing cached data.</Text>
        </View>
      )}

      {usingCachedData && !isOffline && (
        <View style={styles.bannerCached}>
          <View style={styles.bannerIconWrapInfo}>
            <Ionicons name="server" size={16} color={primaryColor} />
          </View>
          <Text style={styles.bannerText}>Some sections loaded from recent cache.</Text>
        </View>
      )}

      {/* Premium Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: primaryColor }]}>LIVE COMMUNITY STATUS</Text>
            <Text style={styles.heroTitle}>Neighborhood Watch</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={theme.textSoft} />
              <Text style={styles.heroSubtitle}>
                {currentLocation?.locationName || "Current Area"}
              </Text>
            </View>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: primaryColor + '15', borderColor: primaryColor + '30' }]}>
            <Ionicons name="shield-checkmark" size={24} color={primaryColor} />
          </View>
        </View>

        {/* Enhanced Metrics Grid with Icons */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Ionicons name="pulse" size={16} color={theme.danger || "#FF3B30"} style={styles.metricIcon} />
            <Text style={styles.metricLabel}>Dengue Risk</Text>
            <Text style={styles.metricValue}>{toScorePercent(riskResult?.risk_score)}</Text>
          </View>
          
          <View style={styles.metricCard}>
            <Ionicons name="people" size={16} color={primaryColor} style={styles.metricIcon} />
            <Text style={styles.metricLabel}>Nearby Cases</Text>
            <Text style={styles.metricValue}>{nearbyCasesCount}</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="map" size={16} color={theme.warn || "#FF9500"} style={styles.metricIcon} />
            <Text style={styles.metricLabel}>High Zones</Text>
            <Text style={styles.metricValue}>{highRiskZones}</Text>
          </View>

          <View style={styles.metricCard}>
            <Ionicons name="trending-up" size={16} color={theme.success || "#34C759"} style={styles.metricIcon} />
            <Text style={styles.metricLabel}>Forecast Peak</Text>
            <Text style={styles.metricValue}>{Math.round(Number(weeklyPeak || 0) * 100)}%</Text>
          </View>
        </View>

        {/* Premium Native Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable onPress={onDetectLocation} style={[styles.btn, styles.btnGhost]}>
            <Ionicons name="navigate" size={16} color={theme.text} style={{ marginRight: 6 }} />
            <Text style={styles.btnGhostText}>Detect GPS</Text>
          </Pressable>
          <Pressable onPress={onRiskCheck} style={[styles.btn, styles.btnSolid, { backgroundColor: primaryColor }]}>
            {riskLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="scan" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.btnSolidText}>Check Risk</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={styles.lastChecked}>
          Last checked: {lastCheckedAt ? new Date(lastCheckedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "--"}
        </Text>
      </View>

      <RiskCard
        theme={theme}
        riskResult={riskResult}
        nearbyCasesCount={nearbyCasesCount}
        communityRiskLevel={communityRiskLevel}
        highRiskZones={highRiskZones}
      />

      <TrendChart theme={theme} trends={trends} />

      {/* Refined Quick Alerts List */}
      <View style={styles.quickAlertsCard}>
        <View style={styles.quickHeaderWrap}>
          <Text style={styles.quickTitle}>Quick Notifications</Text>
          <Pressable>
            <Text style={[styles.seeAllText, { color: primaryColor }]}>See All</Text>
          </Pressable>
        </View>
        <Text style={styles.quickSubtitle}>Recent citizen updates and risk warnings</Text>

        {!alertsFeed.length ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={32} color={theme.textMuted} />
            <Text style={styles.empty}>All clear. No updates yet.</Text>
          </View>
        ) : null}

        {alertsFeed.slice(0, 3).map((item, index) => (
          <View key={item.id} style={[styles.quickItem, index === 0 && { borderTopWidth: 0, marginTop: 0 }]}>
            <View style={styles.quickItemDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.quickItemTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.quickItemText} numberOfLines={2}>{item.message}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.line} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: 16, // Slightly wider margins for premium feel
      paddingTop: 16,
      paddingBottom: 120, // Enough space for the App.js floating tab bar
      gap: 16 // Increased gap for better breathing room
    },
    
    // Smooth System Banners
    bannerOffline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.warn || "#FF9500",
      ...Platform.select({
        ios: { shadowColor: theme.warn || "#FF9500", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
        android: { elevation: 2 }
      })
    },
    bannerCached: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.blue || theme.brand || "#007AFF",
      ...Platform.select({
        ios: { shadowColor: theme.blue || "#007AFF", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
        android: { elevation: 2 }
      })
    },
    bannerIconWrapWarning: {
      backgroundColor: (theme.warn || "#FF9500") + '20',
      padding: 6,
      borderRadius: 8
    },
    bannerIconWrapInfo: {
      backgroundColor: (theme.blue || theme.brand || "#007AFF") + '20',
      padding: 6,
      borderRadius: 8
    },
    bannerText: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      fontWeight: "600"
    },

    // Main Dashboard Hero
    heroCard: {
      borderRadius: 24, // Premium rounded corners
      backgroundColor: theme.card,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
        android: { elevation: 4 }
      })
    },
    heroHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start"
    },
    kicker: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 4
    },
    heroTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4
    },
    heroSubtitle: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: "500"
    },
    heroBadge: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },

    // Inner Grid Metrics
    metricsGrid: {
      marginTop: 20,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10
    },
    metricCard: {
      width: "48%", // 2x2 Grid
      backgroundColor: theme.bg, // Pops against the card background
      borderRadius: 16,
      padding: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
    },
    metricIcon: {
      marginBottom: 6
    },
    metricLabel: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "600"
    },
    metricValue: {
      marginTop: 2,
      color: theme.text,
      fontSize: 20,
      fontWeight: "800"
    },

    // Native Buttons
    actionRow: {
      marginTop: 20,
      flexDirection: "row",
      gap: 12
    },
    btn: {
      flex: 1,
      minHeight: 48, // Bigger touch target
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: "center"
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.bg
    },
    btnSolid: {
      // Color defined dynamically inline
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3
    },
    btnGhostText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700"
    },
    btnSolidText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700"
    },
    lastChecked: {
      marginTop: 16,
      color: theme.textMuted,
      fontSize: 11,
      textAlign: "center",
      fontWeight: "500"
    },

    // Quick Alerts Section
    quickAlertsCard: {
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      borderRadius: 24,
      padding: 16,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
        android: { elevation: 2 }
      })
    },
    quickHeaderWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    quickTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: "700"
    },
    quickSubtitle: {
      marginTop: 2,
      marginBottom: 16,
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: "500"
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 20,
      gap: 8
    },
    empty: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: "500"
    },
    quickItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.line,
      paddingVertical: 12,
      gap: 12
    },
    quickItemDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.warn || "#FF9500"
    },
    quickItemTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700"
    },
    quickItemText: {
      marginTop: 2,
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 18
    }
  });

export default memo(HomeScreen);