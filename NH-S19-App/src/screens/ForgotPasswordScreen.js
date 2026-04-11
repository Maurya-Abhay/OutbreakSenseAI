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

export default function ForgotPasswordScreen({ navigation, onSuccess }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/auth/forgot-password", { email: email.toLowerCase() });
      
      Alert.alert("Success", "OTP sent to your email. Check your inbox!");
      if (typeof onSuccess === "function") {
        onSuccess(email.toLowerCase());
      }
    } catch (error) {
      const message = error.payload?.message || error.message || "Failed to send OTP. Please try again.";
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
                Forgot Password?
              </Text>
              <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
                Enter your email address and we'll send you an OTP to reset your password.
              </Text>
            </View>

            {/* Email Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#000", marginBottom: 8 }}>
                Email Address
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: "#000",
                }}
                placeholder="you@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              onPress={handleSendOTP}
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
                  Send OTP
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              onPress={() => navigation.navigate("login")}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text style={{ fontSize: 14, color: "#667eea", fontWeight: "500" }}>
                Back to Login
              </Text>
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
                🔒 Security Notice
              </Text>
              <Text style={{ fontSize: 12, color: "#666", lineHeight: 18 }}>
                • We'll never ask for your password via email{"\n"}
                • OTP is valid for 15 minutes only{"\n"}
                • Keep your OTP private and secure
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
