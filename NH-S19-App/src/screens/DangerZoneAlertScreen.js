import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// import MapView, { Circle, Marker } from "react-native-maps";  // Commented: Temporarily disabled react-native-maps
import { clearDangerZoneAlert, getCurrentDangerZoneInfo, stopAlert } from "../services/dangerZoneMonitoringService";

export default function DangerZoneAlertScreen({ theme, onDismiss }) {
  const [dangerInfo, setDangerInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const loadDangerZone = async () => {
      const info = await getCurrentDangerZoneInfo();
      if (info) {
        setDangerInfo(info);
      }
    };
    loadDangerZone();
  }, []);

  const handleDismiss = useCallback(async () => {
    // Stop the alert sound immediately
    await stopAlert();
    // Clear the alert from storage
    await clearDangerZoneAlert();
    setDismissed(true);
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  if (!dangerInfo || dismissed) {
    return null;
  }

  const riskColor =
    dangerInfo.riskScore >= 80 ? theme.danger :
    dangerInfo.riskScore >= 60 ? theme.warning :
    theme.warning;

  const mapRegion = {
    latitude: parseFloat(dangerInfo.lat),
    longitude: parseFloat(dangerInfo.lon),
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const userMarker = {
    latitude: parseFloat(dangerInfo.userLat),
    longitude: parseFloat(dangerInfo.userLon),
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Map Background */}
      <View style={styles.mapContainer}>
        {/* MapView temporarily disabled */}
        <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.line }]}>
          <Text style={{ color: theme.textSoft }}>Danger Zone Alert</Text>
          <Text style={{ color: theme.textSoft, fontSize: 12, marginTop: 5 }}>
            Map View Disabled
          </Text>
        </View>

        {/* Overlay Gradient Dim */}
        <View style={[styles.mapOverlay, { backgroundColor: "rgba(0,0,0,0.4)" }]} />
      </View>

      {/* Alert Content */}
      <View style={[styles.content, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {/* Warning Icon */}
        <View style={[styles.iconBg, { backgroundColor: riskColor + "20" }]}>
          <Ionicons name="alert-circle" size={48} color={riskColor} />
        </View>

        {/* Alert Title */}
        <Text style={[styles.title, { color: theme.text }]}>
          ⚠️ Danger Zone Alert
        </Text>

        {/* Zone Info */}
        <View style={[styles.infoBox, { backgroundColor: riskColor + "08", borderColor: riskColor + "30" }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSoft }]}>Location</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{dangerInfo.zone}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: riskColor + "20" }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSoft }]}>Risk Level</Text>
            <View style={styles.riskBadge}>
              <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
              <Text style={[styles.riskText, { color: riskColor }]}>
                {dangerInfo.riskScore}/100
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: riskColor + "20" }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSoft }]}>Distance</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {parseFloat(dangerInfo.distance) > 0.1 ? `${dangerInfo.distance} km` : "Inside zone"}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: riskColor + "20" }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSoft }]}>Time</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {new Date(dangerInfo.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Warning Message */}
        <Text style={[styles.message, { color: theme.textSoft }]}>
          📍 You have entered a high-risk dengue zone. Please take precautions and consider avoiding this area.
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.btn, styles.btnSecondary, { borderColor: theme.line, backgroundColor: theme.cardElevated }]}
            onPress={handleDismiss}
          >
            <Ionicons name="checkmark-circle" size={20} color={theme.brand} />
            <Text style={[styles.btnText, { color: theme.brand }]}>Acknowledge</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  mapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  zoneMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  userMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  content: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  infoBox: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 14,
    fontWeight: "600",
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  actionButtons: {
    gap: 12,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: "#e53e3e",
  },
  btnSecondary: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
