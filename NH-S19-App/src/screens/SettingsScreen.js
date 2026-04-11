import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { AuthContext } from "../context/AuthContext";
import {
  getAlertToneMode,
  isSoundAlertEnabled,
  playHighAlert,
  setAlertToneMode,
  setSoundAlertEnabled,
  stopAlert,
} from "../services/soundAlertService";
import {
  isMonitoringEnabled,
  setMonitoringEnabled,
  isBatteryOptimized,
  setBatteryOptimized,
} from "../services/dangerZoneMonitoringService";
import {
  getEmailPreferences,
  setEmailPreferences,
} from "../services/emailPreferencesService";

// ─── Small reusable pieces ────────────────────────────────────────────────────

const SectionCard = ({ icon, iconBg, iconColor, title, danger, last, theme, styles, children }) => (
  <View style={[styles.card, danger && { borderColor: theme.danger + "35" }, last && { marginBottom: 0 }]}>
    <View style={styles.cardHead}>
      <View style={[styles.cardIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={[styles.cardTitle, danger && { color: theme.danger }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const SettingRow = ({ label, sub, last, right, theme, styles }) => (
  <View style={[styles.settingRow, last && { borderBottomWidth: 0 }]}>
    <View style={{ flex: 1, marginRight: 12 }}>
      <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
      {sub ? <Text style={[styles.settingSub, { color: theme.textSoft }]}>{sub}</Text> : null}
    </View>
    {right}
  </View>
);

const NavRow = ({ icon, iconBg, iconColor, label, onPress, last, theme, styles }) => (
  <Pressable
    style={[styles.navRow, last && { borderBottomWidth: 0 }]}
    onPress={onPress}
  >
    <View style={[styles.navIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={14} color={iconColor} />
    </View>
    <Text style={[styles.navLabel, { color: theme.text }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={14} color={theme.textSoft} />
  </Pressable>
);

const PermRow = ({ icon, label, sub, granted, onPress, theme, styles }) => {
  const color = granted ? theme.success : theme.danger;
  return (
    <Pressable
      style={[styles.permRow, { borderColor: color + "30", backgroundColor: color + "06" }]}
      onPress={onPress}
    >
      <View style={[styles.permIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={14} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.permLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.permSub, { color: theme.textSoft }]}>{sub}</Text>
      </View>
      <View style={[styles.permChip, { backgroundColor: color + "12", borderColor: color + "35" }]}>
        <Text style={[styles.permChipTxt, { color }]}>{granted ? "Granted" : "Denied"}</Text>
      </View>
    </Pressable>
  );
};

const TONES = [
  { key: "alarm",   label: "Siren",   icon: "warning-outline",         color: (t) => t.danger  },
  { key: "beep",    label: "Beep",    icon: "notifications-outline",   color: (t) => t.warning },
  { key: "vibrate", label: "Vibrate", icon: "phone-portrait-outline",  color: (t) => t.brand   },
];

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen({ theme, isDark, setIsDark, onNavigateToProfile, onNavigateToMyReports, onNavigateToTips, onNavigateToAdmin }) {
  const { user, logout } = useContext(AuthContext);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [logoutModal, setLogoutModal]     = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [permissions, setPermissions]     = useState({ location: null, notifications: null, loading: true });
  const [notifSettings, setNotifSettings] = useState({ alerts: true, reports: true, updates: false });
  const [soundEnabled, setSoundEnabled]   = useState(true);
  const [toneMode, setToneMode]           = useState("alarm");
  const [backgroundMonitoring, setBackgroundMonitoring] = useState(false);
  const [batteryOptimized, setBatteryOptimizedState] = useState(false);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [emailPrefs, setEmailPrefsState] = useState({ reportConfirmations: true, dangerZoneAlerts: true, communityUpdates: false });

  useEffect(() => {
    (async () => {
      try {
        const { status: loc }    = await Location.getForegroundPermissionsAsync();
        const { granted: notif } = await Notifications.getPermissionsAsync();
        setPermissions({ location: loc === "granted", notifications: notif, loading: false });
      } catch {
        setPermissions((p) => ({ ...p, loading: false }));
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setSoundEnabled(await isSoundAlertEnabled());
        setToneMode(await getAlertToneMode());
        setBackgroundMonitoring(await isMonitoringEnabled());
        setBatteryOptimizedState(await isBatteryOptimized());
        const prefs = await getEmailPreferences();
        setEmailPrefsState(prefs);
      } catch {
        setSoundEnabled(true);
        setToneMode("alarm");
      }
    })();
  }, []);

  const handleRequestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissions((p) => ({ ...p, location: status === "granted" }));
    } catch {
      Alert.alert("Error", "Failed to request location permission.");
    }
  }, []);

  const handleRequestNotif = useCallback(async () => {
    try {
      const { granted } = await Notifications.requestPermissionsAsync();
      setPermissions((p) => ({ ...p, notifications: granted }));
    } catch {
      Alert.alert("Error", "Failed to request notification permission.");
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    Platform.OS === "ios" ? Linking.openURL("app-settings:") : Linking.openSettings();
  }, []);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setLogoutModal(false);
    } catch {
      Alert.alert("Error", "Failed to sign out.");
    } finally {
      setLogoutLoading(false);
    }
  }, [logout]);

  const handleSoundToggle = useCallback(async (val) => {
    try {
      setSoundEnabled(val);
      await setSoundAlertEnabled(val);
      if (val) {
        await playHighAlert();
      } else {
        await stopAlert();
      }
    } catch (e) {
      setSoundEnabled((p) => !p);
      Alert.alert("Error", e?.message || "Unable to update sound setting.");
    }
  }, []);

  const handleToneChange = useCallback(async (mode) => {
    try {
      const next = await setAlertToneMode(mode);
      setToneMode(next);
      if (soundEnabled) { await stopAlert(); await playHighAlert(); }
    } catch (e) {
      Alert.alert("Error", e?.message || "Unable to update tone.");
    }
  }, [soundEnabled]);

  const handleBackgroundMonitoringToggle = useCallback(async (val) => {
    setMonitoringLoading(true);
    try {
      const result = await setMonitoringEnabled(val);
      setBackgroundMonitoring(result);
      if (val) {
        // Show demo preview on first enable
        setShowDemoModal(true);
      }
    } catch (e) {
      setBackgroundMonitoring((p) => !p);
      Alert.alert("Error", e?.message || "Unable to update monitoring setting.");
    } finally {
      setMonitoringLoading(false);
    }
  }, []);

  const handleBatteryOptimizedToggle = useCallback(async (val) => {
    try {
      const result = await setBatteryOptimized(val);
      setBatteryOptimizedState(result);
    } catch (e) {
      Alert.alert("Error", "Unable to update battery optimization.");
    }
  }, []);

  const handleEmailPrefToggle = useCallback(async (key, val) => {
    try {
      const updated = await setEmailPreferences({ [key]: val });
      setEmailPrefsState(updated);
    } catch (e) {
      Alert.alert("Error", "Unable to update email preferences.");
    }
  }, []);

  const sw = (key) => (
    <Switch
      value={notifSettings[key]}
      onValueChange={(v) => setNotifSettings((p) => ({ ...p, [key]: v }))}
      trackColor={{ false: theme.line, true: theme.brand + "50" }}
      thumbColor={notifSettings[key] ? theme.brand : theme.textSoft}
    />
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* User card */}
      <View style={[styles.userCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={[styles.userAvatar, { backgroundColor: theme.brand + "15" }]}>
          <Text style={[styles.userInitial, { color: theme.brand }]}>
            {(user?.name || "U").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>{user?.name || "User"}</Text>
          <Text style={[styles.userEmail, { color: theme.textSoft }]} numberOfLines={1}>{user?.email || ""}</Text>
        </View>
        <Pressable
          style={[styles.editBtn, { backgroundColor: theme.brand + "15", borderColor: theme.brand + "30" }]}
          onPress={onNavigateToProfile}
        >
          <Ionicons name="pencil-outline" size={13} color={theme.brand} />
        </Pressable>
      </View>

      {/* Display */}
      <SectionCard icon="contrast-outline" iconBg={theme.brand + "15"} iconColor={theme.brand} title="Display" theme={theme} styles={styles}>
        <SettingRow
          label="Dark Mode" sub={isDark ? "Enabled" : "Disabled"}
          right={
            <Switch
              value={isDark}
              onValueChange={setIsDark}
              trackColor={{ false: theme.line, true: theme.brand + "50" }}
              thumbColor={isDark ? theme.brand : theme.textSoft}
            />
          }
          last theme={theme} styles={styles}
        />
      </SectionCard>

      {/* Permissions */}
      <SectionCard icon="shield-checkmark-outline" iconBg={theme.success + "15"} iconColor={theme.success} title="Permissions" theme={theme} styles={styles}>
        {permissions.loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.brand} />
            <Text style={[styles.settingSub, { color: theme.textSoft }]}>Checking permissions…</Text>
          </View>
        ) : (
          <>
            <PermRow icon="location-outline"      label="Location"      sub="Real-time detection" granted={permissions.location}      onPress={handleRequestLocation} theme={theme} styles={styles} />
            <PermRow icon="notifications-outline" label="Notifications" sub="Danger alerts"       granted={permissions.notifications} onPress={handleRequestNotif}    theme={theme} styles={styles} />
            <Pressable
              style={[styles.outlineBtn, { borderColor: theme.brand + "40", backgroundColor: theme.brand + "08", marginTop: 8 }]}
              onPress={handleOpenSettings}
            >
              <Ionicons name="settings-sharp" size={13} color={theme.brand} />
              <Text style={[styles.outlineBtnTxt, { color: theme.brand }]}>Open Device Settings</Text>
              <Ionicons name="open-outline" size={12} color={theme.brand} />
            </Pressable>
          </>
        )}
      </SectionCard>

      {/* Notifications */}
      <SectionCard icon="notifications-outline" iconBg={theme.brand + "15"} iconColor={theme.brand} title="Notifications" theme={theme} styles={styles}>
        <SettingRow label="Danger Alert Sound" sub="High risk alerts"   right={<Switch value={soundEnabled} onValueChange={handleSoundToggle} trackColor={{ false: theme.line, true: theme.brand + "50" }} thumbColor={soundEnabled ? theme.brand : theme.textSoft} />} theme={theme} styles={styles} />

        <View style={[styles.settingRow, { alignItems: "flex-start" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Alert Tone</Text>
            <Text style={[styles.settingSub, { color: theme.textSoft }]}>Choose alert style</Text>
            <View style={styles.toneRow}>
              {TONES.map((t) => {
                const active = toneMode === t.key;
                const col = t.color(theme);
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => handleToneChange(t.key)}
                    style={[styles.toneChip, { borderColor: active ? col + "60" : theme.line, backgroundColor: active ? col + "12" : theme.cardElevated }]}
                  >
                    <Ionicons name={t.icon} size={12} color={active ? col : theme.textSoft} />
                    <Text style={[styles.toneChipTxt, { color: active ? col : theme.textSoft }]}>{t.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <SettingRow label="Outbreak Alerts" sub="Critical updates"  right={sw("alerts")}  theme={theme} styles={styles} />
        <SettingRow label="Report Comments" sub="Your report status" right={sw("reports")} theme={theme} styles={styles} />
        <SettingRow label="Weekly Updates"  sub="Tips & news"       right={sw("updates")} last theme={theme} styles={styles} />
      </SectionCard>

      {/* Live Monitoring */}
      <SectionCard icon="location-outline" iconBg={theme.success + "15"} iconColor={theme.success} title="Live Monitoring" theme={theme} styles={styles}>
        <SettingRow 
          label="Background Monitoring" 
          sub="Get alerts when you enter high-risk zones"
          right={
            <Switch 
              value={backgroundMonitoring} 
              onValueChange={handleBackgroundMonitoringToggle} 
              trackColor={{ false: theme.line, true: theme.success + "50" }} 
              thumbColor={backgroundMonitoring ? theme.success : theme.textSoft}
              disabled={monitoringLoading}
            />
          } 
          theme={theme} 
          styles={styles} 
        />
        {backgroundMonitoring && (
          <SettingRow 
            label="Battery Optimization" 
            sub={`${batteryOptimized ? "Low power mode" : "Normal mode (higher accuracy)"}`}
            right={
              <Switch 
                value={batteryOptimized} 
                onValueChange={handleBatteryOptimizedToggle} 
                trackColor={{ false: theme.line, true: theme.brand + "50" }} 
                thumbColor={batteryOptimized ? theme.brand : theme.textSoft}
              />
            } 
            last
            theme={theme} 
            styles={styles} 
          />
        )}
      </SectionCard>

      {/* Email Notifications */}
      <SectionCard icon="mail-outline" iconBg={theme.info + "15"} iconColor={theme.info} title="Email Notifications" theme={theme} styles={styles}>
        <SettingRow 
          label="Report Confirmations" 
          sub="Updates when your report is verified"
          right={
            <Switch 
              value={emailPrefs?.reportConfirmations ?? true} 
              onValueChange={(val) => handleEmailPrefToggle("reportConfirmations", val)} 
              trackColor={{ false: theme.line, true: theme.info + "50" }} 
              thumbColor={emailPrefs?.reportConfirmations ? theme.info : theme.textSoft}
            />
          } 
          theme={theme} 
          styles={styles} 
        />
        <SettingRow 
          label="Danger Zone Alerts" 
          sub="Notified of new high-risk zones"
          right={
            <Switch 
              value={emailPrefs?.dangerZoneAlerts ?? true} 
              onValueChange={(val) => handleEmailPrefToggle("dangerZoneAlerts", val)} 
              trackColor={{ false: theme.line, true: theme.info + "50" }} 
              thumbColor={emailPrefs?.dangerZoneAlerts ? theme.info : theme.textSoft}
            />
          } 
          last
          theme={theme} 
          styles={styles} 
        />
      </SectionCard>

      {/* Quick links */}
      <SectionCard icon="apps-outline" iconBg={theme.info + "15"} iconColor={theme.info} title="Quick Access" theme={theme} styles={styles}>
        <NavRow icon="document-text-outline" iconBg={theme.brand + "12"}   iconColor={theme.brand}   label="My Reports & Status" onPress={onNavigateToMyReports} theme={theme} styles={styles} />
        <NavRow icon="bulb-outline"          iconBg={theme.success + "12"} iconColor={theme.success} label="Safety Tips"          onPress={onNavigateToTips}      theme={theme} styles={styles} />
        <NavRow icon="person-outline"        iconBg={theme.info + "12"}    iconColor={theme.info}    label="Edit Profile"         onPress={onNavigateToProfile}   theme={theme} styles={styles} />
        {user?.role === "admin" && (
          <NavRow icon="shield-checkmark-outline" iconBg={theme.danger + "12"} iconColor={theme.danger} label="Admin Panel" onPress={onNavigateToAdmin} theme={theme} styles={styles} />
        )}
        <NavRow icon="mail-outline"          iconBg={theme.warning + "12"} iconColor={theme.warning} label="Contact Support"      onPress={() => Linking.openURL("mailto:support@outbreaksense.ai").catch(() => {})} theme={theme} styles={styles} />
        <NavRow icon="star-outline"          iconBg={theme.brand + "12"}   iconColor={theme.brand}   label="Rate the App"         onPress={() => Alert.alert("Rate App", "Thank you for using OutbreakSense AI!")} last theme={theme} styles={styles} />
      </SectionCard>

      {/* Demo Alert Modal */}
      <Modal
        visible={showDemoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDemoModal(false)}
      >
        <View style={[styles.demoOverlay, { backgroundColor: "#00000080" }]}>
          <View style={[styles.demoContent, { backgroundColor: theme.bg, borderColor: theme.danger + "40", borderRadius: 20 }]}>
            {/* Header */}
            <View style={[styles.demoHeader, { backgroundColor: theme.danger + "15", borderBottomColor: theme.danger + "30" }]}>
              <Ionicons name="alert-circle" size={28} color={theme.danger} />
              <Text style={[styles.demoTitle, { color: theme.danger }]}>Danger Zone Alert Preview</Text>
            </View>

            {/* Content */}
            <ScrollView style={styles.demoBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.demoLabel, { color: theme.textSoft }]}>WHEN YOU ENTER A HIGH-RISK ZONE</Text>
              
              <View style={[styles.alertBox, { backgroundColor: theme.danger + "12", borderColor: theme.danger + "30" }]}>
                <View style={[styles.riskBadge, { backgroundColor: theme.danger }]}>
                  <Text style={[styles.riskValue, { color: "white" }]}>85</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: theme.text }]}>High-Risk Area Detected</Text>
                  <Text style={[styles.alertSub, { color: theme.textSoft }]}>You're in a dengue outbreak zone</Text>
                  <Text style={[styles.alertDistance, { color: theme.text }]}>📍 500m away</Text>
                </View>
              </View>

              <Text style={[styles.demoLabel, { color: theme.textSoft, marginTop: 16 }]}>YOU'LL HEAR</Text>
              <View style={[styles.soundBox, { backgroundColor: theme.warning + "12", borderColor: theme.warning + "30" }]}>
                <Ionicons name="volume-high" size={20} color={theme.warning} />
                <Text style={[styles.soundText, { color: theme.text, marginLeft: 8 }]}>Loud alert sound (configurable in settings)</Text>
              </View>

              <Text style={[styles.demoLabel, { color: theme.textSoft, marginTop: 16 }]}>AND SEE</Text>
              <View style={[styles.mapBox, { backgroundColor: theme.info + "08", borderColor: theme.info + "30" }]}>
                <Ionicons name="map" size={20} color={theme.info} />
                <Text style={[styles.mapText, { color: theme.text, marginLeft: 8 }]}>Interactive map with danger zones</Text>
              </View>

              <Text style={[styles.demoNote, { color: theme.textSoft, marginTop: 16 }]}>
                💡 This feature works even when the app is closed. Location checks happen in the background based on your battery optimization mode.
              </Text>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.demoFooter, { borderTopColor: theme.line }]}>
              <Pressable
                style={[styles.demoCancelBtn, { backgroundColor: theme.line }]}
                onPress={() => setShowDemoModal(false)}
              >
                <Text style={[styles.demoBtnText, { color: theme.textSoft }]}>Got It</Text>
              </Pressable>
              <Pressable
                style={[styles.demoOkBtn, { backgroundColor: theme.success }]}
                onPress={async () => {
                  await playHighAlert();
                  setShowDemoModal(false);
                }}
              >
                <Ionicons name="play" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.demoBtnOkText}>Play Alert Sound</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Danger zone */}
      <SectionCard icon="alert-circle-outline" iconBg={theme.danger + "15"} iconColor={theme.danger} title="Danger Zone" danger theme={theme} styles={styles} last>
        <Pressable
          style={[styles.dangerBtn, { borderColor: theme.danger + "40", backgroundColor: theme.danger + "08" }]}
          onPress={() => setLogoutModal(true)}
        >
          <Ionicons name="log-out-outline" size={15} color={theme.danger} />
          <Text style={[styles.dangerBtnTxt, { color: theme.danger }]}>Sign Out</Text>
        </Pressable>
      </SectionCard>

      <View style={{ height: 20 }} />

      {/* Logout Modal */}
      <Modal visible={logoutModal} transparent animationType="fade" onRequestClose={() => setLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setLogoutModal(false)} />
          <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <View style={[styles.modalDangerIcon, { backgroundColor: theme.danger + "15" }]}>
              <Ionicons name="log-out-outline" size={28} color={theme.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Sign out?</Text>
            <Text style={[styles.modalSub, { color: theme.textSoft }]}>
              You'll be logged out from this device. Your data stays safe.
            </Text>
            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.btn, styles.btnGhost, { borderColor: theme.line, opacity: logoutLoading ? 0.5 : 1 }]}
                onPress={() => setLogoutModal(false)}
                disabled={logoutLoading}
              >
                <Text style={[styles.btnTxt, { color: theme.textSoft }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, { backgroundColor: theme.danger, opacity: logoutLoading ? 0.7 : 1 }]}
                onPress={handleLogout}
                disabled={logoutLoading}
              >
                {logoutLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={[styles.btnTxt, { color: "#fff" }]}>Sign Out</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    root:    { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 12 },

    // User card
    userCard: {
      flexDirection: "row", alignItems: "center", gap: 12,
      borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
      padding: 14,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
        android: { elevation: 3 },
      }),
    },
    userAvatar:  { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
    userInitial: { fontSize: 18, fontWeight: "800" },
    userName:    { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
    userEmail:   { fontSize: 12, fontWeight: "400", marginTop: 2 },
    editBtn:     { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },

    // Section card
    card: {
      backgroundColor: theme.card,
      borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line, padding: 16,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
        android: { elevation: 2 },
      }),
    },
    cardHead:  { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    cardIcon:  { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
    cardTitle: { fontSize: 14, fontWeight: "700", color: theme.text, letterSpacing: -0.2 },

    // Setting row
    settingRow:   { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    settingLabel: { fontSize: 13, fontWeight: "600" },
    settingSub:   { fontSize: 11, fontWeight: "400", marginTop: 2 },

    // Tone chips
    toneRow:     { flexDirection: "row", gap: 7, marginTop: 10 },
    toneChip:    { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6 },
    toneChipTxt: { fontSize: 11, fontWeight: "700" },

    // Loading
    loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },

    // Perm row
    permRow:     { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 11, marginBottom: 8 },
    permIcon:    { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
    permLabel:   { fontSize: 12, fontWeight: "700" },
    permSub:     { fontSize: 10, fontWeight: "400", marginTop: 1 },
    permChip:    { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    permChipTxt: { fontSize: 10, fontWeight: "700" },

    // Nav row
    navRow:    { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
    navIcon:   { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
    navLabel:  { flex: 1, fontSize: 13, fontWeight: "600" },

    // Outline button
    outlineBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11, borderRadius: 12, borderWidth: 1 },
    outlineBtnTxt: { fontSize: 13, fontWeight: "700" },

    // Danger button
    dangerBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
    dangerBtnTxt: { fontSize: 13, fontWeight: "700" },

    // Buttons
    btn:      { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    btnGhost: { borderWidth: 1 },
    btnTxt:   { fontSize: 14, fontWeight: "700" },

    // Modal
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
    modalBox: {
      borderRadius: 22, borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 24, paddingVertical: 26,
      alignItems: "center", marginHorizontal: 32, width: "85%",
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 18 },
        android: { elevation: 16 },
      }),
    },
    modalDangerIcon: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    modalTitle:      { fontSize: 18, fontWeight: "800", letterSpacing: -0.4, marginBottom: 8 },
    modalSub:        { fontSize: 13, fontWeight: "400", textAlign: "center", lineHeight: 19, marginBottom: 24 },
    modalBtns:       { flexDirection: "row", gap: 10, width: "100%" },

    // Demo Modal
    demoOverlay: { flex: 1, justifyContent: "flex-end", padding: 12 },
    demoContent: {
      borderRadius: 20, borderWidth: 1,
      maxHeight: "85%",
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.25, shadowRadius: 16 },
        android: { elevation: 12 },
      }),
    },
    demoHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
    demoTitle: { fontSize: 16, fontWeight: "700" },
    demoBody: { paddingVertical: 20, paddingHorizontal: 16, maxHeight: 400 },
    demoLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginBottom: 10 },
    alertBox: { borderRadius: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12 },
    riskBadge: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
    riskValue: { fontSize: 18, fontWeight: "800" },
    alertTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
    alertSub: { fontSize: 12, fontWeight: "500", marginBottom: 4 },
    alertDistance: { fontSize: 11, fontWeight: "600" },
    soundBox: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" },
    soundText: { fontSize: 13, fontWeight: "600" },
    mapBox: { borderRadius: 12, borderWidth: 1, paddingVertical: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" },
    mapText: { fontSize: 13, fontWeight: "600" },
    demoNote: { fontSize: 12, fontWeight: "500", lineHeight: 17, marginBottom: 8 },
    demoFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
    demoCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    demoOkBtn: { flex: 1.2, flexDirection: "row", paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    demoBtnText: { fontSize: 13, fontWeight: "700" },
    demoBtnOkText: { fontSize: 13, fontWeight: "700", color: "white" },
  });