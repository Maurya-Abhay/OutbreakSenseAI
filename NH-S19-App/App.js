import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import AlertsScreen   from "./src/screens/AlertsScreen";
import HomeScreen     from "./src/screens/HomeScreen";
import MapScreen      from "./src/screens/MapScreen";
import ReportScreen   from "./src/screens/ReportScreen";
import TipsScreen     from "./src/screens/TipsScreen";
import { LoginScreen }  from "./src/screens/LoginScreen";
import { SignupScreen } from "./src/screens/SignupScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import OTPVerificationScreen from "./src/screens/OTPVerificationScreen";
import PasswordResetScreen from "./src/screens/PasswordResetScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import AdminSettingsScreen from "./src/screens/AdminSettingsScreen";
import MyReportsScreen from "./src/screens/MyReportsScreen";
import AdminScreen from "./src/screens/AdminScreen";
import AdminDashboardScreen from "./src/screens/AdminDashboardScreen";
import AdminReportVerificationScreen from "./src/screens/AdminReportVerificationScreen";
import AdminDangerZoneScreen from "./src/screens/AdminDangerZoneScreen";
import DangerZoneAlertScreen from "./src/screens/DangerZoneAlertScreen";
import AlertItem from "./src/components/AlertItem";
import DangerZoneAlert from "./src/components/DangerZoneAlert";
import ErrorBoundary from "./src/components/ErrorBoundary";

import { useCitizenData }      from "./src/hooks/useCitizenData";
import { useGeolocation }      from "./src/hooks/useGeolocation";
import { useRiskPrediction }   from "./src/hooks/useRiskPrediction";
import { initializeNotifications } from "./src/services/notificationService";
import {
  cleanupAudioSystem,
  initializeAudioSystem,
} from "./src/services/soundAlertService";
import {
  startBackgroundMonitoring,
  stopBackgroundMonitoring,
  getCurrentDangerZoneInfo,
  clearDangerZoneAlert,
} from "./src/services/dangerZoneMonitoringService";
import { darkTheme, lightTheme } from "./src/theme/palette";
import { AuthContext } from "./src/context/AuthContext";

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const CITIZEN_TABS = [
  { key: "Home",   icon: "home-outline",          activeIcon: "home"          },
  { key: "Map",    icon: "map-outline",            activeIcon: "map"           },
  { key: "Report", icon: "scan-outline",           activeIcon: "scan"          },
  { key: "Alerts", icon: "notifications-outline",  activeIcon: "notifications" },
];

const ADMIN_TABS = [
  { key: "Dashboard", icon: "grid-outline",        activeIcon: "grid"        },
  { key: "Reports",   icon: "document-outline",    activeIcon: "document"    },
  { key: "Zones",     icon: "map-outline",         activeIcon: "map"         },
  { key: "Panel",     icon: "settings-outline",    activeIcon: "settings"    },
];

const FALLBACK_LOCATION = {
  locationName: "Dhaka Central",
  latitude: 23.8103,
  longitude: 90.4125,
  source: "fallback",
};

// ─── TabButton ────────────────────────────────────────────────────────────────

const TabButton = memo(({ theme, tab, active, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(active ? 1.1 : 1)).current;
  const bgAnim    = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: active ? 1.1 : 1,
        useNativeDriver: false,
        friction: 8,
        tension: 120,
      }),
      Animated.timing(bgAnim, {
        toValue: active ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start();
  }, [active]);

  // Derive rgb from brand for interpolation
  const isDarkBrand = theme.brand === "#FBBF24";
  const brandRGB    = isDarkBrand ? "251,191,36" : "49,130,206";

  const bgColor = bgAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [`rgba(${brandRGB},0)`, `rgba(${brandRGB},0.12)`],
  });

  return (
    <Pressable
      onPress={onPress}
      style={styles.tabButton}
      android_ripple={{ color: `rgba(${brandRGB},0.15)`, borderless: true, radius: 28 }}
    >
      <Animated.View
        style={[
          styles.tabIconWrap,
          { backgroundColor: bgColor, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Ionicons
          name={active ? tab.activeIcon : tab.icon}
          size={22}
          color={active ? theme.brand : theme.tabInactive}
        />
      </Animated.View>
      <Animated.View style={[styles.activeDot, { backgroundColor: theme.brand, opacity: bgAnim }]} />
    </Pressable>
  );
});

// ─── NotificationHeader ───────────────────────────────────────────────────────

const NotificationHeader = memo(({ theme, count, onClose, onClear }) => (
  <View style={[styles.sheetHeaderRow, { borderBottomColor: theme.line }]}>
    <View>
      <Text style={[styles.sheetTitle, { color: theme.text }]}>Notifications</Text>
      {count > 0 && (
        <Text style={[styles.sheetCount, { color: theme.textSoft }]}>
          {count} new alert{count > 1 ? "s" : ""}
        </Text>
      )}
    </View>
    <View style={styles.sheetActions}>
      {count > 0 && (
        <Pressable onPress={onClear} style={[styles.sheetClearBtn, { borderColor: theme.line }]}>
          <Text style={[styles.sheetClearText, { color: theme.textSoft }]}>Clear all</Text>
        </Pressable>
      )}
      <Pressable onPress={onClose} style={styles.sheetCloseBtn} hitSlop={8}>
        <Ionicons name="close" size={18} color={theme.textSoft} />
      </Pressable>
    </View>
  </View>
));

// ─── Auth Switch Screen ───────────────────────────────────────────────────────

const AuthSwitch = ({ show, setShow, isDark, setIsDark, insets }) => {
  const theme = isDark ? darkTheme : lightTheme;
  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" translucent />

      {show === "login" ? (
        <LoginScreen theme={theme} navigation={{ navigate: setShow }} onSuccess={() => {}} />
      ) : show === "signup" ? (
        <SignupScreen theme={theme} onSuccess={() => {}} />
      ) : show === "forgot-password" ? (
        <ForgotPasswordScreen
          navigation={{ navigate: setShow }}
          onSuccess={(email) => setShow({ screen: "otp-verification", email })}
        />
      ) : show?.screen === "otp-verification" ? (
        <OTPVerificationScreen
          email={show.email}
          navigation={{ navigate: setShow }}
          onBack={() => setShow("forgot-password")}
          onVerified={(email, otp) => setShow({ screen: "reset-password", email, otp })}
        />
      ) : show?.screen === "reset-password" ? (
        <PasswordResetScreen
          email={show.email}
          otp={show.otp}
          navigation={{ navigate: setShow }}
          onDone={() => setShow("login")}
        />
      ) : (
        <SignupScreen theme={theme} onSuccess={() => {}} />
      )}

      {/* Toggle dark mode */}
      <Pressable
        style={[
          styles.authDarkBtn,
          {
            top: insets.top + 14,
            backgroundColor: theme.cardElevated,
            borderColor: theme.line,
          },
        ]}
        onPress={() => setIsDark((d) => !d)}
      >
        <Ionicons name={isDark ? "sunny" : "moon-outline"} size={17} color={theme.brand} />
      </Pressable>

      {/* Switch link */}
      {(show === "login" || show === "signup") && (
        <View style={[styles.authSwitchRow, { bottom: insets.bottom + 24 }]}>
          <Text style={[styles.authSwitchText, { color: theme.textSoft }]}>
            {show === "login" ? "Don't have an account?" : "Already have an account?"}
          </Text>
          <Pressable onPress={() => setShow(show === "login" ? "signup" : "login")}>
            <Text style={[styles.authSwitchLink, { color: theme.brand }]}>
              {show === "login" ? "Create one" : "Login here"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary onNavigateHome={() => {}}>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { isAuthenticated, restoreToken, user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  const [authRestored, setAuthRestored]   = useState(false);
  const [authScreen, setAuthScreen]       = useState("login");
  const [activeTab, setActiveTab]         = useState("Home");
  const [showSheet, setShowSheet]         = useState(false);
  const [isDark, setIsDark]               = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [dangerZoneInfo, setDangerZoneInfo] = useState(null);
  const [showDangerZoneModal, setShowDangerZoneModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsView, setSettingsView]   = useState("settings");

  const dangerTimerRef   = useRef(null);
  const dangerIntervalRef = useRef(null);
  const autoDetectRef    = useRef(null);
  const bootstrapped     = useRef(false);
  const wasOfflineRef    = useRef(false);
  const sheetAnim        = useRef(new Animated.Value(0)).current;

  const insets      = useSafeAreaInsets();
  const theme       = useMemo(() => isDark ? darkTheme : lightTheme, [isDark]);
  const visibleTabs = isAdmin ? ADMIN_TABS : CITIZEN_TABS;
  const headerTopPad = Platform.OS === "android"
    ? Math.max(14, (RNStatusBar.currentHeight || 0) + 4)
    : 14;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const defaultTab = isAdmin ? "Dashboard" : "Home";
    setActiveTab((current) =>
      visibleTabs.some((tab) => tab.key === current) ? current : defaultTab
    );
  }, [isAuthenticated, isAdmin, visibleTabs]);

  // ── Restore auth ─────────────────────────────────────────────────────────────
  useEffect(() => {
    restoreToken().finally(() => setAuthRestored(true));
  }, [restoreToken]);

  // ── Audio + background monitoring ────────────────────────────────────────────
  useEffect(() => {
    if (!authRestored || !isAuthenticated) return;
    let alive = true;

    (async () => {
      await initializeAudioSystem();
      const result = await startBackgroundMonitoring();
      console.log("Background monitoring started", result);
    })();

    dangerIntervalRef.current = setInterval(async () => {
      if (!alive) return;
      const dangerInfo = await getCurrentDangerZoneInfo();
      if (dangerInfo && !showDangerZoneModal) {
        setDangerZoneInfo(dangerInfo);
        setShowDangerZoneModal(true);
      }
    }, 3000);

    return () => {
      alive = false;
      clearInterval(dangerIntervalRef.current);
      stopBackgroundMonitoring();
    };
  }, [authRestored, isAuthenticated]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      autoDetectRef.current?.();
      stopBackgroundMonitoring();
      cleanupAudioSystem();
      clearInterval(dangerIntervalRef.current);
    };
  }, []);

  // ── Stop monitoring on logout ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated && authRestored) {
      autoDetectRef.current?.();
      autoDetectRef.current = null;
      stopBackgroundMonitoring();
      cleanupAudioSystem();
    }
  }, [isAuthenticated, authRestored]);

  // ── Geolocation ──────────────────────────────────────────────────────────────
  const {
    location,
    requestPermission,
    detectLocation,
    setManualLocation,
    startAutoLocationDetection,
  } = useGeolocation();

  // ── Citizen data ─────────────────────────────────────────────────────────────
  const {
    isOffline, usingCachedData, tips, tipsLoading,
    mapPoints, trends, mapLoading, alertsFeed, unreadAlerts,
    lastSyncAt, refreshAll, loadTips, loadMapData,
    appendAlert, markAllAlertsRead, clearAlerts,
    nearbyCasesCount, communityRiskLevel, weeklyPeak, highRiskZones,
  } = useCitizenData({ currentLocation: location });

  // ── Risk prediction ──────────────────────────────────────────────────────────
  const onHighRiskDetected = useCallback(
    (payload, locationName) => {
      appendAlert({
        title: "High Risk Detected",
        message: `${locationName || "Nearby area"} predicted HIGH risk by AI.`,
        level: payload?.risk_level || "high",
        locationName,
        source: "prediction",
      });
    },
    [appendAlert],
  );

  const {
    riskResult, riskLoading, weatherSnapshot,
    isOfflineResult, lastCheckedAt, runRiskCheck,
  } = useRiskPrediction({ onHighRiskDetected });

  // ── Boot location ────────────────────────────────────────────────────────────
  useEffect(() => { initializeNotifications().catch(() => {}); }, []);

  useEffect(() => {
    if (bootstrapped.current || !isAuthenticated) return;
    bootstrapped.current = true;
    let alive = true;

    (async () => {
      try {
        const perm = await requestPermission({ requestIfNeeded: true });
        if (perm.status !== "granted") {
          appendAlert({ title: "Location Needed", message: "Enable location for real-time risk data.", level: "medium", source: "gps" });
          return;
        }
        const next = await detectLocation({ requestIfNeeded: false });
        if (!alive || !next) return;
        autoDetectRef.current = startAutoLocationDetection({ intervalMs: 300000 });
        await runRiskCheck({ location: next });
      } catch {}
    })();

    return () => { alive = false; };
  }, [isAuthenticated, appendAlert, detectLocation, requestPermission, runRiskCheck, startAutoLocationDetection]);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const effectiveOffline  = isOffline;
  const effectiveLocation = useMemo(() => location || FALLBACK_LOCATION, [location]);

  // Detect network recovery → re-detect location
  useEffect(() => {
    if (wasOfflineRef.current && !effectiveOffline) {
      detectLocation({ requestIfNeeded: false }).catch(() => {});
    }
    wasOfflineRef.current = effectiveOffline;
  }, [effectiveOffline, detectLocation]);

  // ── Sheet helpers ────────────────────────────────────────────────────────────
  const openSheet = useCallback(() => {
    setShowSheet(true);
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, friction: 10, tension: 80 }).start();
  }, [sheetAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true })
      .start(() => setShowSheet(false));
  }, [sheetAnim]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleDetectLocation = useCallback(async () => {
    try   { return await detectLocation(); }
    catch (e) { Alert.alert("GPS Error", e?.message || "Unable to detect location."); return null; }
  }, [detectLocation]);

  const handleManualLocationPick = useCallback(
    ({ latitude, longitude, locationName }) => {
      setManualLocation({
        latitude, longitude,
        locationName: locationName || `Pinned ${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`,
      });
    },
    [setManualLocation],
  );

  const handleRiskCheck = useCallback(async () => {
    try   { await runRiskCheck({ location: effectiveLocation }); }
    catch (e) { Alert.alert("Risk Check Failed", e?.message || "Unable to fetch prediction."); }
  }, [effectiveLocation, runRiskCheck]);

  const handleRefreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAll();
      if (location) {
        try   { await runRiskCheck({ location }); }
        catch { appendAlert({ title: "Risk check pending", message: "Synced. Retrying on reconnect.", level: "low", source: "risk" }); }
      }
    } catch (e) {
      Alert.alert("Refresh Failed", e?.message || "Unable to sync.");
    } finally {
      setRefreshing(false);
    }
  }, [appendAlert, location, refreshAll, runRiskCheck]);

  const handleNotifToggle = useCallback(() => {
    if (!showSheet) { markAllAlertsRead(); openSheet(); }
    else            { closeSheet(); }
  }, [showSheet, markAllAlertsRead, openSheet, closeSheet]);

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (!authRestored) {
    return (
      <View style={[styles.root, { backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }]}>
        <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" translucent />
        <View style={[styles.splashIcon, { backgroundColor: theme.brand + "18", borderColor: theme.brand + "30" }]}>
          <Ionicons name="shield-checkmark" size={32} color={theme.brand} />
        </View>
        <ActivityIndicator size="large" color={theme.brand} style={{ marginTop: 20 }} />
        <Text style={[styles.splashText, { color: theme.textSoft }]}>Opening OutbreakSense…</Text>
      </View>
    );
  }

  // ── Auth screens ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <AuthSwitch
        show={authScreen}
        setShow={setAuthScreen}
        isDark={isDark}
        setIsDark={setIsDark}
        insets={insets}
      />
    );
  }

  // ── Tab bar dimensions ───────────────────────────────────────────────────────
  const TAB_BOTTOM = insets.bottom + 10;

  // ── Sheet slide ──────────────────────────────────────────────────────────────
  const sheetTranslateY = sheetAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [600, 0],
  });

  // ── Shared screen props ───────────────────────────────────────────────────────
  const shared = {
    theme,
    isOffline: effectiveOffline,
    usingCachedData,
    currentLocation: effectiveLocation,
    onDetectLocation: handleDetectLocation,
  };

  const settingsViewTitle = {
    settings: "Settings",
    profile:  "Profile",
    reports:  "My Reports",
    tips:     "Safety Tips",
    admin:    "Admin Panel",
  }[settingsView] || "Settings";

  const effectiveSettingsTitle = isAdmin ? "Admin Panel" : settingsViewTitle;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" translucent />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.card, paddingTop: headerTopPad, borderBottomColor: theme.line }]}>
        <View style={styles.headerTopRow}>
          <View style={styles.brandRow}>
            <View style={[styles.brandIconWrap, { backgroundColor: theme.brand + "18", borderColor: theme.brand + "30" }]}>
              <Ionicons name="shield-checkmark" size={15} color={theme.brand} />
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: theme.text }]}>OutbreakSense AI</Text>
              <Text style={[styles.brandSub,   { color: theme.textSoft }]}>{activeTab}</Text>
            </View>
          </View>

          <View style={styles.headerActionsRow}>
            <Pressable
              style={[styles.headerBtn, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}
              onPress={handleNotifToggle}
            >
              <Ionicons name="notifications-outline" size={17} color={theme.brand} />
              {unreadAlerts > 0 && (
                <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.card }]}>
                  <Text style={styles.badgeText}>{unreadAlerts > 9 ? "9+" : String(unreadAlerts)}</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[styles.headerBtn, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}
              onPress={() => {
                setSettingsView("settings");
                setShowSettingsModal(true);
              }}
            >
              <Ionicons name="settings-outline" size={17} color={theme.brand} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.metaRow, { borderTopColor: theme.line }]}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={theme.textSoft} />
            <Text style={[styles.metaText, { color: theme.textSoft }]} numberOfLines={2}>
              {effectiveLocation.locationName}
            </Text>
          </View>
          <View style={[styles.livePill, {
            backgroundColor: effectiveOffline ? theme.danger + "18" : theme.brand + "18",
            borderColor:     effectiveOffline ? theme.danger + "40" : theme.brand + "40",
          }]}>
            <View style={[styles.liveDot, { backgroundColor: effectiveOffline ? theme.danger : theme.brand }]} />
            <Text style={[styles.liveText, { color: effectiveOffline ? theme.danger : theme.brand }]}>
              {effectiveOffline ? "Offline" : "Live"}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <View style={styles.content}>
        {(() => {
          switch (activeTab) {
            case "Dashboard":
              return <AdminDashboardScreen theme={theme} onNavigate={setActiveTab} />;
            case "Reports":
              return <AdminReportVerificationScreen theme={theme} />;
            case "Zones":
              return <AdminDangerZoneScreen theme={theme} />;
            case "Panel":
              return <AdminScreen theme={theme} isDark={isDark} />;
            case "Home":
              return <HomeScreen {...shared} riskResult={riskResult} riskLoading={riskLoading} onRiskCheck={handleRiskCheck} nearbyCasesCount={nearbyCasesCount} communityRiskLevel={communityRiskLevel} highRiskZones={highRiskZones} weeklyPeak={weeklyPeak} trends={trends} alertsFeed={alertsFeed} lastCheckedAt={lastCheckedAt} />;
            case "Map":
              return <MapScreen {...shared} mapPoints={mapPoints} mapLoading={mapLoading} onRefreshMap={() => loadMapData({ manual: true })} lastSyncAt={lastSyncAt} onPickManualLocation={handleManualLocationPick} />;
            case "Report":
              return <ReportScreen {...shared} mapPoints={mapPoints} onPickManualLocation={handleManualLocationPick} appendAlert={appendAlert} onSubmitted={() => loadMapData({ manual: true })} fallbackWeather={weatherSnapshot} />;
            case "Alerts":
              return <AlertsScreen {...shared} alertsFeed={alertsFeed} unreadAlerts={unreadAlerts} mapLoading={mapLoading} onMarkAllRead={markAllAlertsRead} onClearAlerts={clearAlerts} onRefreshAlerts={() => loadMapData({ manual: true })} />;
            default:
              return null;
          }
        })()}
      </View>

      {/* ── Notification Sheet ──────────────────────────────────────────────── */}
      {showSheet && (
        <View style={styles.sheetOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          <Animated.View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line, transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.line }]} />
            <NotificationHeader
              theme={theme}
              count={unreadAlerts}
              onClose={closeSheet}
              onClear={() => { clearAlerts(); closeSheet(); }}
            />
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              {alertsFeed.length === 0 ? (
                <View style={styles.sheetEmpty}>
                  <Ionicons name="notifications-off-outline" size={36} color={theme.textSoft} />
                  <Text style={[styles.sheetEmptyText, { color: theme.textSoft }]}>No recent notifications</Text>
                </View>
              ) : (
                alertsFeed.slice(0, 10).map((item) => (
                  <AlertItem key={item.id} theme={theme} alert={item} />
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      )}

      {/* ── Settings Modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => { setSettingsView("settings"); setShowSettingsModal(false); }}
      >
        <View style={[styles.root, { backgroundColor: theme.bg }]}>
          <StatusBar style={isDark ? "light" : "dark"} backgroundColor="transparent" translucent />

          {/* Settings header */}
          <View style={[styles.settingsHeader, { backgroundColor: theme.card, paddingTop: Math.max(6, insets.top - 14), borderBottomColor: theme.line }]}>
            <Pressable
              onPress={() => {
                if (settingsView === "settings") {
                  setShowSettingsModal(false);
                } else {
                  setSettingsView("settings");
                }
              }}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.settingsHeaderTitle, { color: theme.text }]}>{effectiveSettingsTitle}</Text>
            <View style={{ width: 20 }} />
          </View>

          {!isAdmin && settingsView === "settings" && (
            <SettingsScreen
              theme={theme}
              isDark={isDark}
              setIsDark={setIsDark}
              onNavigateToProfile={()   => setSettingsView("profile")}
              onNavigateToTips={()      => setSettingsView("tips")}
              onNavigateToMyReports={()  => setSettingsView("reports")}
              onNavigateToAdmin={() => user?.role === "admin" ? setSettingsView("admin") : null}
            />
          )}
          {!isAdmin && settingsView === "profile" && <ProfileScreen theme={theme} />}
          {!isAdmin && settingsView === "tips"    && (
            <TipsScreen
              theme={theme}
              tips={tips}
              tipsLoading={tipsLoading}
              onRefreshTips={() => loadTips({ manual: true })}
              isOffline={effectiveOffline}
              usingCachedData={usingCachedData}
            />
          )}
          {!isAdmin && settingsView === "reports" && <MyReportsScreen theme={theme} />}
          {isAdmin && settingsView === "settings" && <AdminSettingsScreen theme={theme} isDark={isDark} setIsDark={setIsDark} />}
          {settingsView === "admin" && <AdminScreen theme={theme} isDark={isDark} />}
        </View>
      </Modal>

      {/* ── Danger Zone Alert Modal ─────────────────────────────────────────── */}
      <Modal
        visible={showDangerZoneModal && !!dangerZoneInfo}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowDangerZoneModal(false);
          clearDangerZoneAlert();
        }}
      >
        <DangerZoneAlertScreen
          theme={theme}
          onDismiss={() => {
            setShowDangerZoneModal(false);
            clearDangerZoneAlert();
          }}
        />
      </Modal>

      {/* ── Floating Tab Bar ────────────────────────────────────────────────── */}
      <View style={[styles.tabBarFloat, { bottom: TAB_BOTTOM }]}>
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderColor: theme.line }]}>
          {visibleTabs.map((tab) => (
            <TabButton
              key={tab.key}
              tab={tab}
              active={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}
              theme={theme}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Splash
  splashIcon: { width: 72, height: 72, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  splashText: { fontSize: 14, fontWeight: "500", marginTop: 12 },

  // Auth
  authDarkBtn: {
    position: "absolute",
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  authSwitchRow: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 4,
  },
  authSwitchText: { fontSize: 14, fontWeight: "400" },
  authSwitchLink: { fontSize: 14, fontWeight: "700" },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  headerTopRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brandRow:         { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIconWrap:    { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  brandTitle:       { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  brandSub:         { fontSize: 11, fontWeight: "500", marginTop: 1 },
  headerActionsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4, right: -4,
    minWidth: 15, height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    paddingHorizontal: 2,
  },
  badgeText:  { color: "#fff", fontSize: 8, fontWeight: "800" },
  metaRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  metaItem:   { flexDirection: "row", alignItems: "center", gap: 4, flex: 1, marginRight: 8 },
  metaText:   { fontSize: 12, fontWeight: "500" },
  livePill:   { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  liveDot:    { width: 5, height: 5, borderRadius: 3 },
  liveText:   { fontSize: 10, fontWeight: "700", letterSpacing: 0.3 },

  // Content
  content: { flex: 1 },

  // Notification sheet
  sheetOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: "82%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.15, shadowRadius: 24 },
      android: { elevation: 24 },
    }),
  },
  sheetHandle:    { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 12 },
  sheetTitle:     { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  sheetCount:     { fontSize: 12, fontWeight: "500", marginTop: 2 },
  sheetActions:   { flexDirection: "row", alignItems: "center", gap: 8 },
  sheetClearBtn:  { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  sheetClearText: { fontSize: 12, fontWeight: "600" },
  sheetCloseBtn:  { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  sheetScroll:    { maxHeight: 420 },
  sheetEmpty:     { alignItems: "center", paddingVertical: 40, gap: 10 },
  sheetEmptyText: { fontSize: 14, fontWeight: "500" },

  // Settings modal header
  settingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    zIndex: 20,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 4 },
    }),
  },
  settingsHeaderTitle: { fontSize: 17, fontWeight: "700" },

  // Floating tab bar
  tabBarFloat: {
    position: "absolute",
    left: 14, right: 14,
    zIndex: 50,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "space-around",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 20 },
      android: { elevation: 18 },
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    gap: 4,
  },
  tabIconWrap: {
    width: 48, height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: {
    position: "absolute",
    bottom: -2,
    width: 4, height: 4, borderRadius: 2,
  },
});