import { memo, useMemo, useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RiskCard from "../components/RiskCard";
import TrendChart from "../components/TrendChart";
import { toScorePercent } from "../theme/palette";

const MetricCard = ({ icon, iconColor, label, value, theme, styles }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIconWrap, { backgroundColor: iconColor + "18" }]}>
      <Ionicons name={icon} size={15} color={iconColor} />
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

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
  lastCheckedAt,
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const brand = theme.brand || "#3182ce";
  const warn  = theme.warning || "#dd6b20";
  const danger= theme.danger  || "#e53e3e";
  const success=theme.success || "#2f855a";

  // State Declarations (Duplicates Removed)
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const autoRefreshRef = useRef(null);

  // Auto-refresh every 30 seconds for LIVE feel
  useEffect(() => {
    setIsLiveMonitoring(true);
    const scheduleAutoRefresh = () => {
      autoRefreshRef.current = setInterval(() => {
        if (onRiskCheck && currentLocation) {
          onRiskCheck({ skipCache: true });
        }
      }, 30000); // Reduced from 60s to 30s for true "live" updates
    };
    
    scheduleAutoRefresh();
    
    return () => {
      setIsLiveMonitoring(false);
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [onRiskCheck, currentLocation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRiskCheck) {
        await onRiskCheck();
      }
    } finally {
      setRefreshing(false);
    }
  };

  const metrics = [
    { icon: "pulse",       iconColor: danger,  label: "Dengue Risk",   value: toScorePercent(riskResult?.risk_score) },
    { icon: "people",      iconColor: brand,   label: "Nearby Cases",  value: String(nearbyCasesCount ?? 0) },
    { icon: "map",         iconColor: warn,    label: "High Zones",    value: String(highRiskZones ?? 0) },
    { icon: "trending-up", iconColor: success, label: "Forecast Peak", value: `${Math.round(Number(weeklyPeak || 0) * 100)}%` },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={brand}
          colors={[brand]}
        />
      }
    >
      {/* Status Banners */}
      {isOffline && (
        <View style={[styles.banner, { borderColor: warn + "50" }]}>
          <View style={[styles.bannerIconWrap, { backgroundColor: warn + "18" }]}>
            <Ionicons name="cloud-offline-outline" size={15} color={warn} />
          </View>
          <Text style={styles.bannerText}>Offline mode — showing cached data.</Text>
        </View>
      )}
      {usingCachedData && !isOffline && (
        <View style={[styles.banner, { borderColor: brand + "40" }]}>
          <View style={[styles.bannerIconWrap, { backgroundColor: brand + "15" }]}>
            <Ionicons name="server-outline" size={15} color={brand} />
          </View>
          <Text style={styles.bannerText}>Some data loaded from recent cache.</Text>
        </View>
      )}

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHead}>
          <View style={{ flex: 1 }}>
            <View style={styles.kickerRow}>
              <Text style={[styles.kicker, { color: brand }]}>LIVE STATUS</Text>
              {isLiveMonitoring && (
                <View style={[styles.liveIndicator, { backgroundColor: theme.success }]}>
                  <View style={styles.livePulse} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroTitle}>Neighborhood Watch</Text>
            <View style={[styles.locationPill, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
              <Ionicons name="location-outline" size={12} color={theme.textSoft} />
              <Text style={[styles.locationText, { color: theme.textSoft }]} numberOfLines={2}>
                {currentLocation?.locationName || "Current Area"}
              </Text>
            </View>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: brand + "15", borderColor: brand + "30" }]}>
            <Ionicons name="shield-checkmark" size={22} color={brand} />
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((m) => (
            <MetricCard key={m.label} {...m} theme={theme} styles={styles} />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={onDetectLocation}
            style={[styles.btn, styles.btnGhost]}
          >
            <Ionicons name="navigate-outline" size={15} color={theme.text} />
            <Text style={[styles.btnText, { color: theme.text }]}>Detect GPS</Text>
          </Pressable>
          <Pressable
            onPress={onRiskCheck}
            style={[styles.btn, styles.btnSolid, { backgroundColor: brand }]}
          >
            {riskLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="scan-outline" size={15} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>Check Risk</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={[styles.lastChecked, { color: theme.textSoft }]}>
          Last checked:{" "}
          {lastCheckedAt
            ? new Date(lastCheckedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—"}
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

      {/* Quick Alerts */}
      <View style={styles.alertsCard}>
        <View style={styles.alertsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Notifications</Text>
          <Pressable>
            <Text style={[styles.seeAll, { color: brand }]}>See All</Text>
          </Pressable>
        </View>
        <Text style={[styles.sectionSub, { color: theme.textSoft }]}>
          Recent citizen updates and risk warnings
        </Text>

        {(!alertsFeed || alertsFeed.length === 0) ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={32} color={theme.textSoft} />
            <Text style={[styles.emptyText, { color: theme.textSoft }]}>
              All clear. No updates yet.
            </Text>
          </View>
        ) : (
          alertsFeed.slice(0, 3).map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.alertRow,
                { borderTopColor: theme.line },
                index === 0 && { borderTopWidth: 0, marginTop: 0 },
              ]}
            >
              <View style={[styles.alertDot, { backgroundColor: warn }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: theme.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.alertMsg, { color: theme.textSoft }]} numberOfLines={2}>
                  {item.message}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.textSoft} />
            </View>
          ))
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 0,
      gap: 16,
    },

    // Banner
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    bannerIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    bannerText: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      fontWeight: "500",
    },

    // Hero Card
    heroCard: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
        android: { elevation: 4 },
      }),
    },
    heroHead: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    kickerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    kicker: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.5,
    },
    liveIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    livePulse: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#fff",
    },
    liveText: {
      fontSize: 9,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.5,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    locationPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
    },
    locationText: {
      fontSize: 12,
      fontWeight: "500",
      maxWidth: 180,
    },
    heroBadge: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      marginLeft: 12,
    },

    // Metrics
    metricsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 16,
    },
    metricCard: {
      width: "48%",
      backgroundColor: theme.cardElevated,
      borderRadius: 14,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      gap: 4,
    },
    metricIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    metricLabel: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    metricValue: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.3,
      marginTop: 2,
    },

    // Buttons
    actionRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 16,
    },
    btn: {
      flex: 1,
      height: 48,
      borderRadius: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.cardElevated,
    },
    btnSolid: {
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
        android: { elevation: 4 },
      }),
    },
    btnText: {
      fontSize: 14,
      fontWeight: "700",
    },
    lastChecked: {
      marginTop: 12,
      fontSize: 11,
      textAlign: "center",
      fontWeight: "500",
    },

    // Alerts Card
    alertsCard: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
        android: { elevation: 3 },
      }),
    },
    alertsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    seeAll: {
      fontSize: 13,
      fontWeight: "600",
    },
    sectionSub: {
      fontSize: 13,
      fontWeight: "400",
      lineHeight: 18,
      marginBottom: 12,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 24,
      gap: 8,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: "500",
    },
    alertRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderTopWidth: StyleSheet.hairlineWidth,
      paddingVertical: 12,
      gap: 10,
    },
    alertDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
      flexShrink: 0,
    },
    alertTitle: {
      fontSize: 14,
      fontWeight: "700",
    },
    alertMsg: {
      fontSize: 12,
      lineHeight: 17,
      marginTop: 2,
    },
  });

export default memo(HomeScreen);