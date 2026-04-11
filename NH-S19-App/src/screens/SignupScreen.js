import { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const REQ_LIST = [
  { key: "hasUppercase",  label: "Uppercase letter (A-Z)",    test: (p) => /[A-Z]/.test(p)       },
  { key: "hasLowercase",  label: "Lowercase letter (a-z)",    test: (p) => /[a-z]/.test(p)       },
  { key: "hasNumber",     label: "Number (0-9)",              test: (p) => /\d/.test(p)          },
  { key: "hasSpecial",    label: "Special character (!@#$%)", test: (p) => /[^a-zA-Z0-9]/.test(p) },
  { key: "isLongEnough",  label: "At least 8 characters",     test: (p) => p.length >= 8         },
];

const InputField = ({ label, icon, error, optional, children, styles }) => (
  <View style={styles.inputGroup}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {optional && <Text style={styles.optionalTag}>optional</Text>}
    </View>
    <View style={[styles.inputWrap, error && styles.inputWrapError]}>
      <Ionicons name={icon} size={18} color="rgba(148,163,184,0.8)" />
      {children}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const ReqRow = ({ met, label, styles }) => (
  <View style={styles.reqRow}>
    <Ionicons
      name={met ? "checkmark-circle" : "ellipse-outline"}
      size={16}
      color={met ? "#10B981" : "rgba(148,163,184,0.6)"}
    />
    <Text style={[styles.reqText, met && styles.reqTextMet]}>{label}</Text>
  </View>
);

export const SignupScreen = ({ onSuccess, onSwitchToLogin, theme }) => {
  const insets = useSafeAreaInsets();
  const { register, loading } = useContext(AuthContext);
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [phone, setPhone]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]         = useState({});

  const reqs   = REQ_LIST.map((r) => ({ ...r, met: r.test(password) }));
  const allMet = reqs.every((r) => r.met);

  const clearErr = (field) => setErrors((p) => ({ ...p, [field]: undefined }));

  const validate = () => {
    const e = {};
    const n = name.trim();
    
    if (!n) e.name = "Name is required.";
    else if (n.length < 2 || n.length > 50) e.name = "Name must be 2–50 characters.";
    
    if (!email.trim()) e.email = "Email is required.";
    else if (!EMAIL_REGEX.test(email)) e.email = "Enter a valid email.";
    
    if (!password) e.password = "Password is required.";
    else if (!allMet) e.password = "Password does not meet all requirements.";
    
    if (!confirmPwd) e.confirmPwd = "Please confirm your password.";
    else if (password !== confirmPwd) e.confirmPwd = "Passwords do not match.";
    
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    const result = await register(name.trim(), email.trim(), password, confirmPwd, phone.trim());
    if (result.success) {
      onSuccess?.();
    } else {
      setErrors({ form: result.message || "Signup failed. Please try again." });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.root, { backgroundColor: theme.bg }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: theme.brand + "18", borderColor: theme.brand + "30" }]}>
            <Ionicons name="person-add-outline" size={28} color={theme.brand} />
          </View>
          <Text style={[styles.appName, { color: theme.brand }]}>OutbreakSense AI</Text>
          <Text style={[styles.title, { color: theme.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: theme.textSoft }]}>
            Join the community — help track outbreaks
          </Text>
        </View>

        {/* Card Form */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
          {errors.form ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.errorBannerText}>{errors.form}</Text>
            </View>
          ) : null}

          <InputField label="Full name" icon="person-outline" error={errors.name} styles={styles}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Your full name"
              placeholderTextColor={theme.textSoft}
              value={name}
              onChangeText={(v) => { setName(v); clearErr("name"); }}
              editable={!loading}
              autoCorrect={false}
            />
          </InputField>

          <InputField label="Email address" icon="mail-outline" error={errors.email} styles={styles}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="your@email.com"
              placeholderTextColor={theme.textSoft}
              value={email}
              onChangeText={(v) => { setEmail(v); clearErr("email"); }}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </InputField>

          <InputField label="Phone number" icon="call-outline" optional styles={styles}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="+880 1XXX XXXXXX"
              placeholderTextColor={theme.textSoft}
              value={phone}
              onChangeText={setPhone}
              editable={!loading}
              keyboardType="phone-pad"
            />
          </InputField>

          <InputField label="Password" icon="lock-closed-outline" error={errors.password} styles={styles}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor={theme.textSoft}
              value={password}
              onChangeText={(v) => { setPassword(v); clearErr("password"); }}
              editable={!loading}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPwd((p) => !p)} hitSlop={12}>
              <Ionicons name={showPwd ? "eye-outline" : "eye-off-outline"} size={20} color={theme.textSoft} />
            </Pressable>
          </InputField>

          {password.length > 0 && (
            <View style={[styles.reqBox, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
              <Text style={[styles.reqTitle, { color: theme.textSoft }]}>Password Requirements</Text>
              {reqs.map((r) => (
                <ReqRow key={r.key} met={r.met} label={r.label} styles={styles} />
              ))}
            </View>
          )}

          <InputField label="Confirm password" icon="lock-closed-outline" error={errors.confirmPwd} styles={styles}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor={theme.textSoft}
              value={confirmPwd}
              onChangeText={(v) => { setConfirmPwd(v); clearErr("confirmPwd"); }}
              editable={!loading}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowConfirm((p) => !p)} hitSlop={12}>
              <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={20} color={theme.textSoft} />
            </Pressable>
          </InputField>

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.brand, opacity: pressed || loading || !allMet ? 0.75 : 1 },
            ]}
            onPress={handleSignup}
            disabled={loading || !allMet}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.btnText}>Create Account</Text>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme, insets) =>
  StyleSheet.create({
    root: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 },
    header: { alignItems: "center", marginBottom: 24 },
    iconWrap: { width: 64, height: 64, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    appName: { fontSize: 12, fontWeight: "700", letterSpacing: 1.4, marginBottom: 8, textTransform: "uppercase" },
    title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 },
    subtitle: { fontSize: 14, fontWeight: "500", textAlign: "center" },
    card: {
      borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 20, gap: 16, marginBottom: 24,
      ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14 }, android: { elevation: 4 } }),
    },
    errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEE2E2", borderLeftWidth: 4, borderLeftColor: "#EF4444", padding: 12, borderRadius: 10 },
    errorBannerText: { color: "#DC2626", fontSize: 14, fontWeight: "600", flex: 1 },
    inputGroup: { gap: 8 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    label: { fontSize: 14, fontWeight: "600", color: theme.text },
    optionalTag: { fontSize: 12, fontWeight: "600", color: theme.textSoft },
    inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, borderWidth: 1, borderColor: theme.line, borderRadius: 14, paddingHorizontal: 16, backgroundColor: theme.cardElevated },
    inputWrapError: { borderColor: "#EF4444", borderWidth: 1.5 },
    input: { flex: 1, fontSize: 15, paddingVertical: 0 },
    errorText: { fontSize: 13, color: "#EF4444", fontWeight: "600" },
    reqBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
    reqTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" },
    reqRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    reqText: { fontSize: 13, fontWeight: "500", color: theme.textSoft },
    reqTextMet: { color: "#10B981", fontWeight: "700" },
    btn: { height: 52, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
    btnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
    loginPrompt: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
    loginText: { fontSize: 14, fontWeight: "500" },
    loginLink: { fontSize: 14, fontWeight: "700" },
  });

export default SignupScreen;