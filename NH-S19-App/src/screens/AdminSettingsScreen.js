import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { request } from "../services/apiClient";

const SectionCard = ({ theme, title, icon, children }) => (
  <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.line }]}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: theme.brand + "15" }]}>
        <Ionicons name={icon} size={20} color={theme.brand} />
      </View>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

const SettingRow = ({ theme, label, value, onPress, isLast = false }) => (
  <Pressable 
    style={[
      styles.settingRow, 
      !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line }
    ]} 
    onPress={onPress} 
    disabled={!onPress}
  >
    <Text style={[styles.settingLabel, { color: theme.textSoft }]}>{label}</Text>
    <View style={styles.settingValueWrap}>
      <Text style={[styles.settingValue, { color: theme.text }]} numberOfLines={1}>
        {value}
      </Text>
      {onPress && <Ionicons name="chevron-forward" size={16} color={theme.textSoft} />}
    </View>
  </Pressable>
);

const ToggleRow = ({ theme, label, value, onToggle }) => (
  <View style={styles.toggleRow}>
    <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
    <Switch
      trackColor={{ false: theme.line, true: theme.brand + "80" }}
      thumbColor={value ? theme.brand : "#f4f3f4"}
      ios_backgroundColor={theme.line}
      onValueChange={onToggle}
      value={value}
    />
  </View>
);

const StatBadge = ({ theme, icon, label, value }) => (
  <View style={[styles.statBadge, { backgroundColor: theme.bg, borderColor: theme.line }]}>
    <Ionicons name={icon} size={22} color={theme.brand} />
    <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: theme.textSoft }]}>{label}</Text>
  </View>
);

export default function AdminSettingsScreen({ theme, isDark, setIsDark, userStats = null }) {
  const { user, logout, getAuthHeaders } = useContext(AuthContext);
  const [stats, setStats] = useState(userStats);
  const [loading, setLoading] = useState(!userStats);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Modal States
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...getAuthHeaders()
    }),
    [getAuthHeaders]
  );

  const loadAdminStats = useCallback(async () => {
    try {
      const data = await request("/admin/system/stats", {
        method: "GET",
        headers,
        timeoutMs: 8000,
        maxCandidates: 2
      });
      setStats(data);
    } catch (error) {
      console.log("Could not load admin stats");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (!userStats) loadAdminStats();
    else setLoading(false);
  }, [userStats, loadAdminStats]);

  const handleChangePassword = useCallback(async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Missing Fields", "Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Password Mismatch", "New password and confirmation do not match.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Weak Password", "Password must be at least 8 characters long.");
      return;
    }

    setUpdatingPassword(true);
    try {
      await request("/auth/change-password", {
        method: "POST",
        headers,
        body: { oldPassword, newPassword }
      });
      Alert.alert("Success", "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setChangePasswordModal(false);
    } catch (error) {
      Alert.alert("Failed", error?.payload?.message || "Could not change password.");
    } finally {
      setUpdatingPassword(false);
    }
  }, [oldPassword, newPassword, confirmPassword, headers]);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout }
    ]);
  }, [logout]);

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Tab Bar */}
        <View style={[styles.tabRow, { backgroundColor: theme.card, borderColor: theme.line }]}>
          {["profile", "preferences", "account"].map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: theme.brand }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText, 
                { color: activeTab === tab ? "#fff" : theme.textSoft }
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <View style={styles.tabContent}>
            <SectionCard theme={theme} title="Admin Profile" icon="person-circle-outline">
              <SettingRow theme={theme} label="Name" value={user?.name || "Unknown"} />
              <SettingRow theme={theme} label="Email" value={user?.email || "Unknown"} />
              <SettingRow theme={theme} label="Role" value={user?.role === "admin" ? "Administrator" : "Citizen"} />
              <SettingRow theme={theme} label="Status" value={user?.isBanned ? "🔴 Banned" : "🟢 Active"} />
              <SettingRow theme={theme} label="Member Since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"} isLast />
            </SectionCard>

            {stats && (
              <SectionCard theme={theme} title="Your Authority" icon="shield-checkmark-outline">
                <View style={styles.statsGrid}>
                  <StatBadge theme={theme} icon="people-outline" label="Users" value={stats.users?.total || 0} />
                  <StatBadge theme={theme} icon="document-text-outline" label="Reports" value={stats.reports?.total || 0} />
                  <StatBadge theme={theme} icon="alert-circle-outline" label="Alerts" value={stats.alerts?.active || 0} />
                  <StatBadge 
                    theme={theme} 
                    icon="checkmark-done-outline" 
                    label="Verified" 
                    value={(stats.reports?.total || 0) - (stats.reports?.pendingVerification || 0)} 
                  />
                </View>
              </SectionCard>
            )}
          </View>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <View style={styles.tabContent}>
            <SectionCard theme={theme} title="Display Settings" icon="color-palette-outline">
              <ToggleRow
                theme={theme}
                label="Dark Mode"
                value={isDark}
                onToggle={() => setIsDark(!isDark)}
              />
              <Text style={[styles.preferenceInfo, { color: theme.textSoft }]}>
                {isDark ? "🌙 Night vision is currently active for reduced eye strain." : "☀️ Light mode is currently active."}
              </Text>
            </SectionCard>

            <SectionCard theme={theme} title="Data Management" icon="cloud-download-outline">
              <Pressable style={[styles.actionBtn, { backgroundColor: theme.brand + "10", borderColor: theme.brand }]}>
                <Ionicons name="document-text-outline" size={18} color={theme.brand} />
                <Text style={[styles.actionBtnText, { color: theme.brand }]}>Export Reports (CSV)</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, { backgroundColor: theme.brand + "10", borderColor: theme.brand, marginTop: 12 }]}>
                <Ionicons name="document-outline" size={18} color={theme.brand} />
                <Text style={[styles.actionBtnText, { color: theme.brand }]}>Export Reports (PDF)</Text>
              </Pressable>
            </SectionCard>
          </View>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <View style={styles.tabContent}>
            <SectionCard theme={theme} title="Security & Authentication" icon="shield-half-outline">
              <Pressable
                style={[styles.securityBtn, { backgroundColor: theme.warning + "15", borderColor: theme.warning }]}
                onPress={() => setChangePasswordModal(true)}
              >
                <Ionicons name="lock-closed-outline" size={18} color={theme.warning} />
                <Text style={[styles.securityBtnText, { color: theme.warning }]}>Change Password</Text>
              </Pressable>
              
              <View style={styles.infoBox}>
                <Text style={[styles.infoText, { color: theme.textSoft }]}>
                  <Text style={{fontWeight: "bold"}}>Last Login:</Text> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Unknown"}
                </Text>
              </View>
            </SectionCard>

            <SectionCard theme={theme} title="Danger Zone" icon="warning-outline">
              <Text style={[styles.dangerWarning, { color: theme.textSoft }]}>
                Logging out will terminate your current administrative session.
              </Text>
              <Pressable
                style={[styles.dangerBtn, { backgroundColor: theme.danger + "15", borderColor: theme.danger }]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={18} color={theme.danger} />
                <Text style={[styles.dangerBtnText, { color: theme.danger }]}>Secure Logout</Text>
              </Pressable>
            </SectionCard>
          </View>
        )}
      </ScrollView>

      {/* Modern Modal for Password Change */}
      <Modal visible={changePasswordModal} transparent={true} animationType="fade">
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalBackdrop, { backgroundColor: "#00000099" }]} />
          
          <View style={[styles.modalContent, { backgroundColor: theme.card, shadowColor: "#000" }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={[styles.modalIconWrap, { backgroundColor: theme.brand + "15" }]}>
                  <Ionicons name="key-outline" size={20} color={theme.brand} />
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Update Password</Text>
              </View>
              <Pressable onPress={() => setChangePasswordModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.textSoft} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.line, backgroundColor: theme.bg }]}
                placeholder="Current Password"
                placeholderTextColor={theme.textSoft}
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                editable={!updatingPassword}
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.line, backgroundColor: theme.bg }]}
                placeholder="New Password (min 8 chars)"
                placeholderTextColor={theme.textSoft}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!updatingPassword}
              />
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.line, backgroundColor: theme.bg }]}
                placeholder="Confirm New Password"
                placeholderTextColor={theme.textSoft}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!updatingPassword}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.bg, borderColor: theme.line, borderWidth: 1 }]}
                onPress={() => setChangePasswordModal(false)}
                disabled={updatingPassword}
              >
                <Text style={[styles.modalBtnText, { color: theme.textSoft }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: theme.brand, flex: 1.5 }]}
                onPress={handleChangePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: "#fff" }]}>Update Password</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  
  tabRow: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 2 }
    })
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center"
  },
  tabText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  tabContent: { gap: 16 },

  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 }
    })
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  sectionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  sectionContent: { gap: 4 },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLabel: { fontSize: 14, fontWeight: "600" },
  settingValueWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingValue: { fontSize: 14, fontWeight: "700", maxWidth: 140 },

  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  toggleLabel: { fontSize: 14, fontWeight: "600" },
  preferenceInfo: { fontSize: 12, marginTop: 8, lineHeight: 18 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  statBadge: { 
    flex: 1, 
    minWidth: "45%", 
    borderRadius: 16, 
    borderWidth: 1, 
    alignItems: "center", 
    paddingVertical: 16,
    paddingHorizontal: 12
  },
  statValue: { fontSize: 20, fontWeight: "800", marginTop: 8, marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: "600" },

  actionBtn: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center"
  },
  actionBtnText: { fontSize: 14, fontWeight: "700" },

  securityBtn: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16
  },
  securityBtnText: { fontSize: 14, fontWeight: "700" },
  infoBox: { padding: 12, borderRadius: 8, backgroundColor: "#00000008" },
  infoText: { fontSize: 13, lineHeight: 20 },

  dangerWarning: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  dangerBtn: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center"
  },
  dangerBtnText: { fontSize: 14, fontWeight: "800" },

  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject },
  modalContent: {
    width: "90%",
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  closeBtn: { padding: 4 },
  
  modalBody: { gap: 12, marginBottom: 24 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: "500"
  },

  modalActions: { flexDirection: "row", gap: 12 },
  modalBtn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontSize: 14, fontWeight: "800" }
});