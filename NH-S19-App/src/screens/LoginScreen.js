import { useContext, useState, useMemo } from "react";
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

const InputField = ({ label, icon, error, children, styles }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrap, error && styles.inputWrapError]}>
      <Ionicons name={icon} size={17} color="rgba(148,163,184,0.8)" />
      {children}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

export const LoginScreen = ({ onSuccess, onSwitchToSignup, theme, navigation }) => {
  const insets = useSafeAreaInsets();
  const { login, loading, error: authError } = useContext(AuthContext);
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPwd, setShowPwd]           = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [errors, setErrors]             = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim())              e.email    = "Email is required.";
    else if (!EMAIL_REGEX.test(email)) e.email = "Enter a valid email.";
    if (!password)                  e.password = "Password is required.";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await login(email, password);
    if (!result.success) {
      setErrors({ form: result.message || "Login failed. Please try again." });
    } else {
      onSuccess?.();
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
        {/* Header - Enhanced */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: theme.brand + "18", borderColor: theme.brand + "30" }]}>
            <Ionicons name="shield-checkmark" size={32} color={theme.brand} />
          </View>
          <Text style={[styles.appName, { color: theme.brand }]}>OutbreakSense AI</Text>
          <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: theme.textSoft }]}>
            Monitor outbreak threats in your area
          </Text>
        </View>

        {/* Features Box - New */}
        <View style={[styles.featuresBox, { backgroundColor: theme.brand + "08", borderColor: theme.brand + "20" }]}>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={theme.brand} />
            <Text style={[styles.featureText, { color: theme.text }]}>Get real-time alerts</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={theme.brand} />
            <Text style={[styles.featureText, { color: theme.text }]}>Share health reports</Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={theme.brand} />
            <Text style={[styles.featureText, { color: theme.text }]}>AI risk prediction</Text>
          </View>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>

          {/* Auth error banner */}
          {(authError || errors.form) ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
              <Text style={styles.errorBannerText}>{authError || errors.form}</Text>
            </View>
          ) : null}

          {/* Email */}
          <InputField label="Email Address" icon="mail-outline" error={errors.email} styles={styles}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="your@email.com"
              placeholderTextColor={theme.textSoft}
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors((p) => ({ ...p, email: undefined, form: undefined })); }}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </InputField>

          {/* Password */}
          <InputField label="Password" icon="lock-closed-outline" error={errors.password} styles={styles}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor={theme.textSoft}
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((p) => ({ ...p, password: undefined, form: undefined })); }}
              editable={!loading}
              secureTextEntry={!showPwd}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPwd((p) => !p)} hitSlop={8}>
              <Ionicons
                name={showPwd ? "eye-outline" : "eye-off-outline"}
                size={17}
                color={theme.textSoft}
              />
            </Pressable>
          </InputField>

          {/* Remember Me & Forgot Password - New */}
          <View style={styles.optionsRow}>
            <Pressable style={styles.rememberMeWrap} onPress={() => setRememberMe(!rememberMe)}>
              <Ionicons 
                name={rememberMe ? "checkbox" : "checkbox-outline"} 
                size={18} 
                color={rememberMe ? theme.brand : theme.textSoft}
              />
              <Text style={[styles.rememberText, { color: theme.textSoft }]}>Remember me</Text>
            </Pressable>
            <Pressable onPress={() => navigation?.navigate("forgot-password")} hitSlop={8}>
              <Text style={[styles.forgotText, { color: theme.brand }]}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* Submit Button - Enhanced */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: theme.brand, opacity: pressed || loading ? 0.85 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.btnText}>Sign In</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
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
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingTop: insets.top + 24,
      paddingBottom: insets.bottom + 32,
    },

    // Header
    header:   { alignItems: "center", marginBottom: 24 },
    iconWrap: { width: 70, height: 70, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    appName:  { fontSize: 11, fontWeight: "700", letterSpacing: 1.6, marginBottom: 12, textTransform: "uppercase" },
    title:    { fontSize: 28, fontWeight: "800", letterSpacing: -0.6, marginBottom: 6 },
    subtitle: { fontSize: 14, fontWeight: "500", textAlign: "center" },

    // Features Box
    featuresBox: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      gap: 10,
      marginBottom: 20,
    },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    featureText: { fontSize: 13, fontWeight: "600" },

    // Card
    card: {
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 20,
      gap: 16,
      marginBottom: 16,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.09, shadowRadius: 14 },
        android: { elevation: 4 },
      }),
    },

    // Error banner
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#FEE2E2",
      borderLeftWidth: 3,
      borderLeftColor: "#EF4444",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
    },
    errorBannerText: { color: "#DC2626", fontSize: 13, fontWeight: "500", flex: 1 },

    // Input
    inputGroup: { gap: 6 },
    label:      { fontSize: 13, fontWeight: "600" },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      height: 48,
      borderWidth: 1,
      borderColor: theme.line,
      borderRadius: 13,
      paddingHorizontal: 13,
      backgroundColor: theme.cardElevated,
    },
    inputWrapError: { borderColor: "#EF4444" },
    input:     { flex: 1, fontSize: 15, paddingVertical: 0 },
    errorText: { fontSize: 12, color: "#EF4444", fontWeight: "500" },

    // Options Row
    optionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rememberMeWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
    rememberText: { fontSize: 13, fontWeight: "500" },
    forgotText: { fontSize: 13, fontWeight: "600" },

    // Button
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 50,
      borderRadius: 13,
      marginTop: 8,
    },
    btnText: { fontSize: 15, fontWeight: "700", color: "#fff" },

    // Signup Prompt
    signupPrompt: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 8 },
    signupText: { fontSize: 13, fontWeight: "500" },
    signupLink: { fontSize: 13, fontWeight: "700" },
  });

export default LoginScreen;