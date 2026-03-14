import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
  Animated
} from "react-native";

import AlertsScreen from "./src/screens/AlertsScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MapScreen from "./src/screens/MapScreen";
import ReportScreen from "./src/screens/ReportScreen";
import TipsScreen from "./src/screens/TipsScreen";
import AlertItem from "./src/components/AlertItem";

import { useCitizenData } from "./src/hooks/useCitizenData";
import { useGeolocation } from "./src/hooks/useGeolocation";
import { useRiskPrediction } from "./src/hooks/useRiskPrediction";
import { initializeNotifications } from "./src/services/notificationService";
import { darkTheme, lightTheme } from "./src/theme/palette";

const TABS = [
  { key: "Home", icon: "home-outline", activeIcon: "home" },
  { key: "Map", icon: "map-outline", activeIcon: "map" },
  { key: "Report", icon: "scan-outline", activeIcon: "scan" },
  { key: "Alerts", icon: "notifications-outline", activeIcon: "notifications" },
  { key: "Tips", icon: "bulb-outline", activeIcon: "bulb" }
];

const fallbackLocation = {
  locationName: "Dhaka Central",
  latitude: 23.8103,
  longitude: 90.4125,
  source: "fallback"
};

// 🌟 Premium Animated Tab Button (Floating Pill Style)
const TabButton = memo(({ theme, styles, tab, active, onPress, isDark }) => {
  const scaleValue = useRef(new Animated.Value(active ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: active ? 1.15 : 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  }, [active]);

  const activeColor = theme.brand;
  const inactiveColor = theme.textSoft;

  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Animated.View style={[
        styles.tabIconContainer, 
        active && { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
        { transform: [{ scale: scaleValue }] }
      ]}>
        <Ionicons 
          name={active ? tab.activeIcon : tab.icon} 
          size={22} 
          color={active ? activeColor : inactiveColor} 
        />
      </Animated.View>
      {active && <View style={[styles.activeDot, { backgroundColor: activeColor }]} />}
    </Pressable>
  );
});

export default function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [isDark, setIsDark] = useState(false); // Default to Light Mode
  const [refreshingHeader, setRefreshingHeader] = useState(false);

  const theme = isDark ? darkTheme : lightTheme;
  const headerTopInset = Platform.OS === "android" ? Math.max(12, (RNStatusBar.currentHeight || 0) + 4) : 12;
  const styles = useMemo(() => createStyles(theme, headerTopInset, isDark), [theme, headerTopInset, isDark]);

  const {
    location: currentLocation,
    loading: locationLoading,
    error: locationError,
    requestPermission,
    detectLocation,
    setManualLocation
  } = useGeolocation();

  const bootstrappedLocationRef = useRef(false);

  const {
    isOffline,
    usingCachedData,
    tips,
    tipsLoading,
    mapPoints,
    trends,
    mapLoading,
    alertsFeed,
    unreadAlerts,
    lastSyncAt,
    refreshAll,
    loadTips,
    loadMapData,
    appendAlert,
    markAllAlertsRead,
    clearAlerts,
    nearbyCasesCount,
    communityRiskLevel,
    weeklyPeak,
    highRiskZones
  } = useCitizenData({ currentLocation });

  const onHighRiskDetected = useCallback(
    (payload, locationName) => {
      appendAlert({
        title: "High Risk Detected",
        message: `${locationName || "Nearby area"} predicted HIGH risk by AI.`,
        level: payload?.risk_level || "high",
        locationName,
        source: "prediction"
      });
    },
    [appendAlert]
  );

  const { riskResult, riskLoading, riskError, weatherSnapshot, isOfflineResult, lastCheckedAt, runRiskCheck } =
    useRiskPrediction({ onHighRiskDetected });

  useEffect(() => {
    initializeNotifications().catch(() => {});
  }, []);

  useEffect(() => {
    if (bootstrappedLocationRef.current) return;
    bootstrappedLocationRef.current = true;
    let active = true;

    const bootstrapLocation = async () => {
      try {
        const permission = await requestPermission({ requestIfNeeded: true });
        if (permission.status !== "granted") {
          appendAlert({ title: "Location Needed", message: "Enable location for real-time risk data.", level: "medium", source: "gps" });
          return;
        }

        const next = await detectLocation({ requestIfNeeded: false });
        if (!active || !next) return;

        await runRiskCheck({ location: next });
      } catch {}
    };

    bootstrapLocation();
    return () => { active = false; };
  }, [appendAlert, detectLocation, requestPermission, runRiskCheck]);

  const effectiveOffline = isOffline || isOfflineResult;
  const effectiveLocation = currentLocation || fallbackLocation;

  const handleDetectLocation = useCallback(async () => {
    try {
      const next = await detectLocation();
      return next;
    } catch (error) {
      Alert.alert("GPS Error", error?.message || "Unable to detect location.");
      return null;
    }
  }, [detectLocation]);

  const handleManualLocationPick = useCallback(
    ({ latitude, longitude, locationName }) => {
      const safeLabel = locationName || `Pinned ${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`;
      setManualLocation({ latitude, longitude, locationName: safeLabel });
    },
    [setManualLocation]
  );

  const handleRiskCheck = useCallback(async () => {
    try {
      await runRiskCheck({ location: effectiveLocation });
    } catch (error) {
      Alert.alert("Risk Check Failed", error?.message || "Unable to fetch prediction.");
    }
  }, [effectiveLocation, runRiskCheck]);

  const handleRefreshAll = useCallback(async () => {
    setRefreshingHeader(true);

    try {
      await refreshAll();

      if (currentLocation) {
        try {
          await runRiskCheck({ location: currentLocation });
        } catch {
          appendAlert({
            title: "Risk check pending",
            message: "Latest map/tips synced. Risk check will retry when network stabilizes.",
            level: "low",
            source: "risk"
          });
        }
      }
    } catch (error) {
      Alert.alert("Refresh Failed", error?.message || "Unable to sync dashboard.");
    } finally {
      setRefreshingHeader(false);
    }
  }, [appendAlert, currentLocation, refreshAll, runRiskCheck]);

  const toggleNotifications = () => {
    setShowNotificationSheet((prev) => {
      const next = !prev;
      if (next) markAllAlertsRead();
      return next;
    });
  };

  // 🌟 Native App Header (Edge-to-Edge)
  const renderHeader = () => (
    <View style={styles.nativeHeader}>
      <View style={styles.headerTopRow}>
        <View style={styles.brandWrap}>
          <View style={[styles.brandIcon, { backgroundColor: theme.brand + '20' }]}>
            <Ionicons name="shield-checkmark" size={16} color={theme.brand} />
          </View>
          <View>
            <Text style={styles.brandTitle}>OutbreakSense AI</Text>
            <Text style={styles.brandSubtitle}>{activeTab} Dashboard</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => setIsDark((prev) => !prev)}>
            <Ionicons name={isDark ? "sunny" : "moon"} size={22} color={theme.text} />
          </Pressable>

          <Pressable style={styles.iconBtn} onPress={toggleNotifications}>
            <Ionicons name="notifications-outline" size={22} color={theme.text} />
            {unreadAlerts > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.danger }]}>
                <Text style={styles.badgeText}>{unreadAlerts > 9 ? "9+" : String(unreadAlerts)}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.iconBtn, refreshingHeader && { opacity: 0.5 }]}
            onPress={handleRefreshAll}
            disabled={refreshingHeader}
          >
            {refreshingHeader ? (
              <ActivityIndicator color={theme.brand} size="small" />
            ) : (
              <Ionicons name="sync" size={22} color={theme.text} />
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="location" size={12} color={theme.textSoft} />
          <Text style={styles.headerMeta} numberOfLines={1}>
            {effectiveLocation.locationName}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <View style={[styles.statusDot, { backgroundColor: effectiveOffline ? theme.danger : theme.brand }]} />
          <Text style={styles.headerMetaSmall}>{effectiveOffline ? "Offline" : "Live"}</Text>
        </View>
      </View>
    </View>
  );

  // 🌟 Clean Native Overlay for Notifications
  const renderNotificationSheet = () => {
    if (!showNotificationSheet) return null;

    return (
      <View style={styles.notificationOverlay}>
        <View style={styles.notificationSheet}>
          <View style={styles.notificationHead}>
            <Text style={styles.notificationTitle}>Notifications</Text>
            <Pressable style={styles.closeBtn} onPress={() => setShowNotificationSheet(false)}>
              <Ionicons name="close-circle" size={26} color={theme.textSoft} />
            </Pressable>
          </View>

          <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
            {!alertsFeed.length ? <Text style={styles.emptyText}>No recent notifications.</Text> : null}
            {alertsFeed.slice(0, 8).map((item) => (
              <AlertItem key={item.id} theme={theme} alert={item} />
            ))}
          </ScrollView>

          <View style={styles.notificationActions}>
            <Pressable onPress={clearAlerts} style={styles.sheetBtn}>
              <Text style={styles.sheetBtnText}>Clear All</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    const commonProps = {
      theme, isOffline: effectiveOffline, usingCachedData, currentLocation: effectiveLocation, onDetectLocation: handleDetectLocation
    };

    switch(activeTab) {
      case "Home":
        return <HomeScreen {...commonProps} riskResult={riskResult} riskLoading={riskLoading} onRiskCheck={handleRiskCheck} nearbyCasesCount={nearbyCasesCount} communityRiskLevel={communityRiskLevel} highRiskZones={highRiskZones} weeklyPeak={weeklyPeak} trends={trends} alertsFeed={alertsFeed} lastCheckedAt={lastCheckedAt} />;
      case "Map":
        return <MapScreen {...commonProps} mapPoints={mapPoints} mapLoading={mapLoading} onRefreshMap={() => loadMapData({ manual: true })} lastSyncAt={lastSyncAt} onPickManualLocation={handleManualLocationPick} />;
      case "Report":
        return <ReportScreen {...commonProps} mapPoints={mapPoints} onPickManualLocation={handleManualLocationPick} appendAlert={appendAlert} onSubmitted={() => loadMapData({ manual: true })} fallbackWeather={weatherSnapshot} />;
      case "Alerts":
        return <AlertsScreen {...commonProps} alertsFeed={alertsFeed} unreadAlerts={unreadAlerts} mapLoading={mapLoading} onMarkAllRead={markAllAlertsRead} onClearAlerts={clearAlerts} onRefreshAlerts={() => loadMapData({ manual: true })} />;
      case "Tips":
      default:
        return <TipsScreen {...commonProps} tips={tips} tipsLoading={tipsLoading} onRefreshTips={() => loadTips({ manual: true })} />;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={theme.card} />

      {/* Edge to Edge Native Header */}
      {renderHeader()}

      <View style={styles.contentWrap}>{renderTabContent()}</View>

      {renderNotificationSheet()}

      {/* Floating Premium Tab Bar (The one you liked!) */}
      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TabButton key={tab.key} tab={tab} active={activeTab === tab.key} onPress={() => setActiveTab(tab.key)} theme={theme} styles={styles} isDark={isDark} />
          ))}
        </View>
      </View>
    </View>
  );
}

// 🌟 App Styling (Native & Clean)
const createStyles = (theme, headerTopInset, isDark) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bg
    },
    // 📱 Native Header (Attached to top)
    nativeHeader: {
      backgroundColor: theme.card,
      paddingTop: headerTopInset,
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.line,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
        android: { elevation: 3 }
      }),
      zIndex: 10
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between"
    },
    brandWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    brandIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center"
    },
    brandTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.5
    },
    brandSubtitle: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "500",
      marginTop: 2
    },
    headerActions: {
      flexDirection: "row",
      gap: 16
    },
    iconBtn: {
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      right: -6,
      top: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: theme.card
    },
    badgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800"
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.line,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      maxWidth: '70%'
    },
    headerMeta: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "600",
    },
    headerMetaSmall: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700"
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    
    // Notifications Modal Native Look
    notificationOverlay: {
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end', // Slid up from bottom natively
      zIndex: 100
    },
    notificationSheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 40 : 20,
      maxHeight: '80%',
    },
    notificationHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16
    },
    notificationTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "800",
    },
    closeBtn: {
      opacity: 0.8
    },
    notificationList: {
      maxHeight: 400,
    },
    notificationActions: {
      marginTop: 16,
      paddingTop: 16,
    },
    sheetBtn: {
      width: '100%',
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.cardElevated || (isDark ? '#222' : '#f0f0f0'),
      alignItems: "center",
      justifyContent: "center",
    },
    sheetBtnText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
    emptyText: {
      color: theme.textSoft,
      fontSize: 14,
      textAlign: 'center',
      paddingVertical: 20
    },
    
    // Content Wrap (padding bottom to avoid hiding behind floating tab bar)
    contentWrap: {
      flex: 1,
      paddingBottom: 90 
    },

    // 🌟 Floating Pill Tab Bar
    tabBarContainer: {
      position: 'absolute',
      bottom: Platform.OS === 'ios' ? 24 : 16,
      left: 20,
      right: 20,
      alignItems: 'center'
    },
    tabBar: {
      flexDirection: "row",
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)', // Adapts perfectly to theme
      borderRadius: 100,
      paddingHorizontal: 8,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      justifyContent: "space-between",
      width: '100%',
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 15 },
        android: { elevation: 10 }
      })
    },
    tabButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: 48
    },
    tabIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center"
    },
    activeDot: {
      position: 'absolute',
      bottom: -4,
      width: 5,
      height: 5,
      borderRadius: 2.5,
    }
  });