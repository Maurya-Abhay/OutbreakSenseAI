import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  Animated,
  Easing,
  Vibration,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { stopAlert } from "../services/soundAlertService";
import { clearDangerAlert } from "../services/backgroundLocationService";

export const DangerZoneAlert = ({ visible, theme, onDismiss, dangerInfo }) => {
  const insets = useSafeAreaInsets();
  const [pulse] = useState(new Animated.Value(1));

  // Pulsing animation
  useEffect(() => {
    if (visible) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();

      return () => animation.stop();
    }
  }, [visible, pulse]);

  const handleDismiss = async () => {
    await stopAlert();
    await clearDangerAlert();
    onDismiss();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    container: {
      backgroundColor: theme.card,
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 28,
      alignItems: "center",
      width: "100%",
      maxWidth: 320,
      borderWidth: 3,
      borderColor: "#EF4444",
      shadowColor: "#EF4444",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 20,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#FEE2E2",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      color: "#DC2626",
      marginBottom: 12,
      textAlign: "center",
      letterSpacing: 0.5,
    },
    message: {
      fontSize: 16,
      color: theme.text,
      textAlign: "center",
      marginBottom: 8,
      lineHeight: 24,
      fontWeight: "600",
    },
    details: {
      fontSize: 13,
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 20,
      lineHeight: 20,
    },
    badge: {
      backgroundColor: "#FEE2E2",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "center",
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#DC2626",
    },
    buttonRow: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    dismissButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: "#EF4444",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: 8,
    },
    dismissButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    vibrationButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: theme.brand + "20",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: theme.brand,
    },
    vibrationButtonText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.brand,
    },
    timestamp: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 12,
      fontStyle: "italic",
    },
  });

  const zone = dangerInfo?.zone || "Unknown Zone";
  const distance = dangerInfo?.distance || "N/A";
  const timestamp = dangerInfo?.timestamp || new Date().toLocaleTimeString();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: pulse }],
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="warning" size={48} color="#DC2626" />
          </View>

          {/* Title */}
          <Text style={styles.title}>🚨 DANGER ZONE</Text>

          {/* Zone Badge */}
          <View style={styles.badge}>
            <Ionicons name="location" size={14} color="#DC2626" />
            <Text style={styles.badgeText}>{zone}</Text>
          </View>

          {/* Main Message */}
          <Text style={styles.message}>
            High dengue risk detected nearby!
          </Text>

          {/* Details */}
          <Text style={styles.details}>
            {distance} km from your current location{"\n"}
            Take precautions immediately
          </Text>

          {/* Timestamp */}
          <Text style={styles.timestamp}>Detected: {timestamp}</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.dismissButton}
              onPress={handleDismiss}
              android_ripple={{ color: "#DC2626", radius: 50 }}
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
              <Text style={styles.dismissButtonText}>Dismiss</Text>
            </Pressable>

            <Pressable
              style={styles.vibrationButton}
              onPress={() => {
                if (Platform.OS === "android") {
                  Vibration.vibrate([0, 200, 100, 200, 100, 200]);
                } else {
                  Vibration.vibrate();
                }
              }}
            >
              <Ionicons name="alert-circle" size={16} color={theme.brand} />
            </Pressable>
          </View>

          {/* Additional Info */}
          <View style={{ marginTop: 16, width: "100%", opacity: 0.6 }}>
            <Text
              style={{
                fontSize: 11,
                color: theme.textSecondary,
                textAlign: "center",
              }}
            >
              Alert will auto-dismiss in 30 seconds
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default DangerZoneAlert;
