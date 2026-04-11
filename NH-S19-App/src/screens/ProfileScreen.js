import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { request } from "../services/apiClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Small reusable pieces ────────────────────────────────────────────────────

const InfoRow = ({ label, value, last, theme, styles }) => (
  <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "Not set"}</Text>
  </View>
);

const SectionCard = ({ icon, iconBg, iconColor, title, children, danger, theme, styles }) => (
  <View style={[styles.sectionCard, danger && { borderColor: theme.danger + "35" }]}>
    <View style={styles.secHead}>
      <View style={[styles.secIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={[styles.secTitle, danger && { color: theme.danger }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const FieldInput = ({ label, value, onChangeText, editable, keyboardType, autoCapitalize, placeholder, theme, styles }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldWrap, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
      <TextInput
        style={[styles.fieldInput, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || "none"}
        placeholder={placeholder}
        placeholderTextColor={theme.textSoft}
      />
    </View>
  </View>
);

const PwdField = ({ label, value, onChangeText, visible, onToggle, loading, theme, styles }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.fieldWrap, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
      <TextInput
        style={[styles.fieldInput, { color: theme.text }]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        editable={!loading}
        autoCapitalize="none"
        placeholder="••••••••"
        placeholderTextColor={theme.textSoft}
      />
      <Pressable onPress={onToggle} hitSlop={8}>
        <Ionicons name={visible ? "eye-outline" : "eye-off-outline"} size={16} color={theme.textSoft} />
      </Pressable>
    </View>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen({ theme }) {
  const { user, getAuthHeaders, updateUser } = useContext(AuthContext);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [editMode, setEditMode]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [editName, setEditName]     = useState("");
  const [editEmail, setEditEmail]   = useState("");
  const [editPhone, setEditPhone]   = useState("");

  const [pwdModal, setPwdModal]         = useState(false);
  const [curPwd, setCurPwd]             = useState("");
  const [newPwd, setNewPwd]             = useState("");
  const [confirmPwd, setConfirmPwd]     = useState("");
  const [pwdVisible, setPwdVisible]     = useState({ cur: false, new: false, confirm: false });
  const [pwdLoading, setPwdLoading]     = useState(false);

  useEffect(() => {
    setEditName(user?.name   || "");
    setEditEmail(user?.email || "");
    setEditPhone(user?.phone || "");
  }, [user]);

  const memberSince = useMemo(() => {
    if (!user?.createdAt) return "N/A";
    try { return new Date(user.createdAt).toLocaleDateString(); } catch { return "N/A"; }
  }, [user]);

  const handleCancel = useCallback(() => {
    setEditName(user?.name   || "");
    setEditEmail(user?.email || "");
    setEditPhone(user?.phone || "");
    setEditMode(false);
  }, [user]);

  const handleUpdateProfile = useCallback(async () => {
    const name  = editName.trim();
    const email = editEmail.trim().toLowerCase();
    const phone = editPhone.trim();

    if (!name || !email) { Alert.alert("Validation", "Name and email are required."); return; }
    if (!EMAIL_REGEX.test(email)) { Alert.alert("Validation", "Enter a valid email address."); return; }

    setLoading(true);
    try {
      const res = await request("/citizen/profile", {
        method: "PUT",
        body: { name, email, phone },
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        timeoutMs: 7000,
      });
      if (res?.user) await updateUser(res.user);
      Alert.alert("Success", res?.message || "Profile updated.");
      setEditMode(false);
    } catch (e) {
      Alert.alert("Update Failed", e?.payload?.message || e?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  }, [editName, editEmail, editPhone, getAuthHeaders, updateUser]);

  const handleResetPassword = useCallback(async () => {
    if (!curPwd || !newPwd || !confirmPwd) { Alert.alert("Validation", "All fields are required."); return; }
    if (newPwd !== confirmPwd)             { Alert.alert("Validation", "Passwords do not match."); return; }
    if (newPwd.length < 8)                { Alert.alert("Validation", "Password must be at least 8 characters."); return; }

    setPwdLoading(true);
    try {
      const res = await request("/citizen/password-reset", {
        method: "POST",
        body: { currentPassword: curPwd, newPassword: newPwd, confirmPassword: confirmPwd },
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        timeoutMs: 7000,
      });
      Alert.alert("Success", res?.message || "Password updated.");
      setCurPwd(""); setNewPwd(""); setConfirmPwd("");
      setPwdModal(false);
    } catch (e) {
      Alert.alert("Failed", e?.payload?.message || e?.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  }, [curPwd, newPwd, confirmPwd, getAuthHeaders]);

  const togglePwd = (key) => setPwdVisible((p) => ({ ...p, [key]: !p[key] }));

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar card */}
      <SectionCard icon="person-outline" iconBg={theme.brand + "15"} iconColor={theme.brand} title="Account" theme={theme} styles={styles}>
        <View style={[styles.avatarRow, { borderBottomColor: theme.line }]}>
          <View style={[styles.avatar, { backgroundColor: theme.brand + "15" }]}>
            <Text style={[styles.avatarInitials, { color: theme.brand }]}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.avatarName, { color: theme.text }]}>{user?.name || "User"}</Text>
            <Text style={[styles.avatarEmail, { color: theme.textSoft }]}>{user?.email || "No email"}</Text>
          </View>
          <View style={[styles.activeBadge, { backgroundColor: theme.success + "12", borderColor: theme.success + "30" }]}>
            <View style={[styles.activeDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.activeTxt, { color: theme.success }]}>Active</Text>
          </View>
        </View>

        <InfoRow label="Phone"        value={user?.phone}     theme={theme} styles={styles} />
        <InfoRow label="Member since" value={memberSince}     theme={theme} styles={styles} />
        <InfoRow label="User ID" value={(user?.id || user?._id || "").slice(-8) || "N/A"} last theme={theme} styles={styles} />

        <Pressable
          style={[styles.outlineBtn, { borderColor: theme.brand + "40", backgroundColor: theme.brand + "10" }]}
          onPress={() => setEditMode(true)}
        >
          <Ionicons name="create-outline" size={13} color={theme.brand} />
          <Text style={[styles.outlineBtnTxt, { color: theme.brand }]}>Edit Profile</Text>
        </Pressable>
      </SectionCard>

      {/* Edit form */}
      {editMode && (
        <SectionCard icon="pencil-outline" iconBg={theme.brand + "15"} iconColor={theme.brand} title="Edit Details" theme={theme} styles={styles}>
          <FieldInput label="Name"  value={editName}  onChangeText={setEditName}  editable={!loading} autoCapitalize="words" placeholder="Full name"       theme={theme} styles={styles} />
          <FieldInput label="Email" value={editEmail} onChangeText={setEditEmail} editable={!loading} keyboardType="email-address" placeholder="you@example.com" theme={theme} styles={styles} />
          <FieldInput label="Phone" value={editPhone} onChangeText={setEditPhone} editable={!loading} keyboardType="phone-pad" placeholder="+91 XXXXX XXXXX" theme={theme} styles={styles} />
          <View style={styles.btnRow}>
            <Pressable
              style={[styles.btn, styles.btnGhost, { borderColor: theme.line, opacity: loading ? 0.5 : 1 }]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.btnTxt, { color: theme.textSoft }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: theme.brand, opacity: loading ? 0.7 : 1 }]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={[styles.btnTxt, { color: "#fff" }]}>Save Changes</Text>}
            </Pressable>
          </View>
        </SectionCard>
      )}

      {/* Security */}
      <SectionCard icon="lock-closed-outline" iconBg={theme.danger + "15"} iconColor={theme.danger} title="Security" theme={theme} styles={styles}>
        <Pressable
          style={[styles.outlineBtn, { borderColor: theme.danger + "35", backgroundColor: theme.danger + "08" }]}
          onPress={() => setPwdModal(true)}
        >
          <Ionicons name="key-outline" size={13} color={theme.danger} />
          <Text style={[styles.outlineBtnTxt, { color: theme.danger }]}>Change Password</Text>
        </Pressable>
      </SectionCard>

      {/* Account details */}
      <SectionCard icon="information-circle-outline" iconBg={theme.info + "15"} iconColor={theme.info} title="Account Details" theme={theme} styles={styles}>
        <InfoRow label="App version" value="1.0.0"     theme={theme} styles={styles} />
        <InfoRow label="Build"       value="001"       theme={theme} styles={styles} />
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={[styles.activeBadge, { backgroundColor: theme.success + "12", borderColor: theme.success + "30" }]}>
            <View style={[styles.activeDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.activeTxt, { color: theme.success }]}>Active</Text>
          </View>
        </View>
      </SectionCard>

      <View style={{ height: 20 }} />

      {/* Password Modal */}
      <Modal visible={pwdModal} transparent animationType="slide" onRequestClose={() => setPwdModal(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPwdModal(false)} />
          <View style={[styles.modalSheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.line }]} />

            <View style={[styles.modalHead, { borderBottomColor: theme.line }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Change Password</Text>
              <Pressable onPress={() => setPwdModal(false)} hitSlop={8}>
                <Ionicons name="close" size={20} color={theme.textSoft} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <PwdField label="Current password" value={curPwd}     onChangeText={setCurPwd}     visible={pwdVisible.cur}     onToggle={() => togglePwd("cur")}     loading={pwdLoading} theme={theme} styles={styles} />
              <PwdField label="New password"     value={newPwd}     onChangeText={setNewPwd}     visible={pwdVisible.new}     onToggle={() => togglePwd("new")}     loading={pwdLoading} theme={theme} styles={styles} />
              <PwdField label="Confirm password" value={confirmPwd} onChangeText={setConfirmPwd} visible={pwdVisible.confirm} onToggle={() => togglePwd("confirm")} loading={pwdLoading} theme={theme} styles={styles} />

              <View style={[styles.infoBox, { backgroundColor: theme.info + "12", borderColor: theme.info + "30" }]}>
                <Ionicons name="information-circle-outline" size={14} color={theme.info} />
                <Text style={[styles.infoBoxTxt, { color: theme.info }]}>
                  Use 8+ characters with uppercase, lowercase, number and special character.
                </Text>
              </View>
            </ScrollView>

            <View style={[styles.modalFoot, { borderTopColor: theme.line }]}>
              <Pressable
                style={[styles.btn, styles.btnGhost, { borderColor: theme.line, opacity: pwdLoading ? 0.5 : 1 }]}
                onPress={() => setPwdModal(false)}
                disabled={pwdLoading}
              >
                <Text style={[styles.btnTxt, { color: theme.textSoft }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, { backgroundColor: theme.brand, opacity: pwdLoading ? 0.7 : 1 }]}
                onPress={handleResetPassword}
                disabled={pwdLoading}
              >
                {pwdLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={[styles.btnTxt, { color: "#fff" }]}>Update</Text>}
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

    // Section card
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      padding: 14,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 },
        android: { elevation: 3 },
      }),
    },
    secHead:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
    secIconWrap:{ width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
    secTitle:   { fontSize: 14, fontWeight: "700", color: theme.text, letterSpacing: -0.2 },

    // Avatar row
    avatarRow:   { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
    avatar:      { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    avatarInitials:{ fontSize: 18, fontWeight: "800" },
    avatarName:  { fontSize: 15, fontWeight: "700", letterSpacing: -0.2 },
    avatarEmail: { fontSize: 12, fontWeight: "400", marginTop: 2 },
    activeBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
    activeDot:   { width: 5, height: 5, borderRadius: 3 },
    activeTxt:   { fontSize: 10, fontWeight: "700" },

    // Info row
    infoRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.line },
    infoLabel:  { fontSize: 12, fontWeight: "500", color: theme.textSoft },
    infoValue:  { fontSize: 12, fontWeight: "600", color: theme.text, maxWidth: "60%" },

    // Outline button
    outlineBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 12, paddingVertical: 10, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
    outlineBtnTxt: { fontSize: 13, fontWeight: "700" },

    // Form fields
    fieldGroup: { marginBottom: 12 },
    fieldLabel: { fontSize: 11, fontWeight: "600", color: theme.textSoft, marginBottom: 6, letterSpacing: 0.3 },
    fieldWrap:  { flexDirection: "row", alignItems: "center", gap: 10, height: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 13 },
    fieldInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

    // Buttons
    btnRow:   { flexDirection: "row", gap: 10, marginTop: 4 },
    btn:      { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    btnGhost: { borderWidth: StyleSheet.hairlineWidth },
    btnTxt:   { fontSize: 14, fontWeight: "700" },

    // Modal
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
    modalSheet: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderWidth: StyleSheet.hairlineWidth,
      paddingTop: 12,
      maxHeight: "85%",
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 20 },
        android: { elevation: 20 },
      }),
    },
    modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
    modalHead:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
    modalTitle:  { fontSize: 16, fontWeight: "700" },
    modalBody:   { padding: 20, maxHeight: "70%" },
    modalFoot:   { flexDirection: "row", gap: 10, borderTopWidth: StyleSheet.hairlineWidth, padding: 16 },

    // Info box
    infoBox:    { flexDirection: "row", alignItems: "flex-start", gap: 8, borderWidth: StyleSheet.hairlineWidth, borderRadius: 11, padding: 11, marginTop: 4 },
    infoBoxTxt: { fontSize: 12, fontWeight: "500", flex: 1, lineHeight: 17 },
  });