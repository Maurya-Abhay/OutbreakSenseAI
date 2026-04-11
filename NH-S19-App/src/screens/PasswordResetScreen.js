import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { apiClient } from "../services/apiClient";

export default function PasswordResetScreen({ navigation, email, otp, onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[a-z]/.test(pwd)) return "Password must contain lowercase letters";
    if (!/[A-Z]/.test(pwd)) return "Password must contain uppercase letters";
    if (!/\d/.test(pwd)) return "Password must contain numbers";
    if (!/[^a-zA-Z0-9]/.test(pwd)) return "Password must contain special characters";
    return null;
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const validation = validatePassword(password);
    if (validation) {
      Alert.alert("Weak Password", validation);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/auth/reset-password", { email, otp, newPassword: password });
      
      Alert.alert(
        "Success",
        "Your password has been reset successfully. Please login with your new password.",
        [{ text: "OK", onPress: () => (typeof onDone === "function" ? onDone() : navigation.navigate("login")) }]
      );
    } catch (error) {
      const message = error.payload?.message || error.message || "Failed to reset password. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
            {/* Header */}
            <View style={{ marginBottom: 40 }}>
              <Text style={{ fontSize: 28, fontWeight: "bold", color: "#000", marginBottom: 8 }}>
                Set New Password
              </Text>
              <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
                Create a strong password for your account
              </Text>
            </View>

            {/* Password Strength Requirements */}
            <View
              style={{
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
                padding: 12,
                marginBottom: 24,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#333", marginBottom: 8 }}>
                Password Requirements:
              </Text>
              <Text style={{ fontSize: 11, color: "#666", lineHeight: 16 }}>
                ✓ At least 8 characters{"\n"}
                ✓ Uppercase letter (A-Z){"\n"}
                ✓ Lowercase letter (a-z){"\n"}
                ✓ Number (0-9){"\n"}
                ✓ Special character (!@#$%)
              </Text>
            </View>

            {/* New Password */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#000", marginBottom: 8 }}>
                New Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  paddingRight: 12,
                  alignItems: "center",
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: 16,
                    color: "#000",
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  editable={!loading}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={{ fontSize: 18, color: "#667eea" }}>
                    {showPassword ? "👁" : "👁‍🗨"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#000", marginBottom: 8 }}>
                Confirm Password
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  paddingRight: 12,
                  alignItems: "center",
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    padding: 12,
                    fontSize: 16,
                    color: "#000",
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Text style={{ fontSize: 18, color: "#667eea" }}>
                    {showConfirmPassword ? "👁" : "👁‍🗨"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Reset Password Button */}
            <TouchableOpacity
              onPress={handleResetPassword}
              disabled={loading}
              style={{
                backgroundColor: loading ? "#ccc" : "#667eea",
                padding: 14,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>

            {/* Security Notice */}
            <View
              style={{
                backgroundColor: "#f0f0f0",
                borderRadius: 8,
                padding: 12,
                marginTop: 30,
              }}
            >
              <Text style={{ fontSize: 12, color: "#666", fontWeight: "600", marginBottom: 6 }}>
                🔒 Security Tips
              </Text>
              <Text style={{ fontSize: 12, color: "#666", lineHeight: 18 }}>
                • Use a unique password{"\n"}
                • Don't share with anyone{"\n"}
                • Use a mix of character types{"\n"}
                • Consider using a password manager
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
