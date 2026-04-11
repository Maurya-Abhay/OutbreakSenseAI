import React, { useState, useEffect } from "react";
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

export default function OTPVerificationScreen({ navigation, email, onBack, onVerified }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert("Error", "Please enter the 6-digit OTP");
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      Alert.alert("Error", "OTP must be exactly 6 digits");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/auth/verify-otp", { email, otp });
      
      Alert.alert("Success", "OTP verified! Now set your new password.");
      if (typeof onVerified === "function") {
        onVerified(email, otp);
      }
    } catch (error) {
      const message = error.payload?.message || error.message || "Invalid OTP. Please try again.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      await apiClient.post("/auth/forgot-password", { email });
      
      Alert.alert("Success", "New OTP sent to your email!");
      setOtp("");
      setTimeLeft(60);
    } catch (error) {
      const message = error.payload?.message || error.message || "Failed to resend OTP";
      Alert.alert("Error", message);
    } finally {
      setResendLoading(false);
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
                Verify OTP
              </Text>
              <Text style={{ fontSize: 14, color: "#666", lineHeight: 20 }}>
                We've sent a 6-digit code to your email
              </Text>
            </View>

            {/* OTP Input */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#000", marginBottom: 8 }}>
                One-Time Password (OTP)
              </Text>
              <TextInput
                style={{
                  borderWidth: 2,
                  borderColor: "#667eea",
                  borderRadius: 8,
                  padding: 16,
                  fontSize: 24,
                  textAlign: "center",
                  color: "#000",
                  letterSpacing: 8,
                  fontWeight: "600",
                }}
                placeholder="000000"
                placeholderTextColor="#ccc"
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleVerifyOTP}
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
                  Verify OTP
                </Text>
              )}
            </TouchableOpacity>

            {/* Resend OTP */}
            <View style={{ alignItems: "center", paddingVertical: 12 }}>
              {timeLeft > 0 ? (
                <Text style={{ fontSize: 14, color: "#999" }}>
                  Resend in {timeLeft}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOTP} disabled={resendLoading}>
                  <Text style={{ fontSize: 14, color: "#667eea", fontWeight: "500" }}>
                    {resendLoading ? "Sending..." : "Didn't receive the code? Resend OTP"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => {
                if (typeof onBack === "function") {
                  onBack();
                } else {
                  navigation?.navigate?.("forgot-password");
                }
              }}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text style={{ fontSize: 14, color: "#666" }}>
                Back to Email Entry
              </Text>
            </TouchableOpacity>

            {/* Info Box */}
            <View
              style={{
                backgroundColor: "#f0f0f0",
                borderRadius: 8,
                padding: 12,
                marginTop: 30,
              }}
            >
              <Text style={{ fontSize: 12, color: "#666", lineHeight: 18 }}>
                • OTP is valid for 15 minutes{"\n"}
                • Check spam folder if you don't see the email{"\n"}
                • Each OTP can only be used once
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
