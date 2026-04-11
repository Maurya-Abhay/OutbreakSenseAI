import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// import MapView, { Circle, Marker } from "react-native-maps";  // Commented: Temporarily disabled react-native-maps
import { apiClient } from "../services/apiClient";

const DangerZoneItem = ({ zone, theme, styles, onViewDetails, onResolve, onDelete }) => {
  const riskColor =
    zone.riskScore >= 80
      ? theme.danger
      : zone.riskScore >= 60
      ? theme.warning
      : theme.warning;

  return (
    <View style={[styles.zoneCard, { borderColor: riskColor + "30" }]}>
      <View style={styles.zoneHeader}>
        <View style={[styles.riskBadge, { backgroundColor: riskColor + "15" }]}>
          <Text style={[styles.riskScore, { color: riskColor }]}>{zone.riskScore}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.zoneName, { color: theme.text }]}>{zone.name}</Text>
          <Text style={[styles.zoneSub, { color: theme.textSoft }]}>
            📍 {zone.coordinates[1].toFixed(3)}, {zone.coordinates[0].toFixed(3)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: zone.status === "active" ? theme.success + "15" : theme.textSoft + "15" }]}>
          <Text style={[styles.statusText, { color: zone.status === "active" ? theme.success : theme.textSoft }]}>
            {zone.status === "active" ? "🔴" : "✓"}
          </Text>
        </View>
      </View>

      <Text style={[styles.zoneDesc, { color: theme.textSoft }]}>{zone.description}</Text>

      <View style={styles.zoneInfo}>
        <Text style={[styles.infoText, { color: theme.textSoft }]}>Radius: {zone.radius.toFixed(2)} km</Text>
        <Text style={[styles.infoText, { color: theme.textSoft }]}>•</Text>
        <Text style={[styles.infoText, { color: theme.textSoft }]}>Severity: {zone.severity}</Text>
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={[styles.btn, styles.btnSmall, { borderColor: theme.info }]} onPress={() => onViewDetails(zone)}>
          <Ionicons name="map-outline" size={14} color={theme.info} />
          <Text style={[styles.btnSmallText, { color: theme.info }]}>View</Text>
        </Pressable>
        {zone.status === "active" && (
          <Pressable style={[styles.btn, styles.btnSmall, { borderColor: theme.success }]} onPress={() => onResolve(zone)}>
            <Ionicons name="checkmark" size={14} color={theme.success} />
            <Text style={[styles.btnSmallText, { color: theme.success }]}>Resolve</Text>
          </Pressable>
        )}
        <Pressable style={[styles.btn, styles.btnSmall, { borderColor: theme.danger }]} onPress={() => onDelete(zone)}>
          <Ionicons name="trash-outline" size={14} color={theme.danger} />
          <Text style={[styles.btnSmallText, { color: theme.danger }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function AdminDangerZoneScreen({ theme }) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");

  const loadDangerZones = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/danger-zones", {
        query: { status: statusFilter, limit: 50 },
        timeoutMs: 8000,
      });
      setZones(response?.zones || []);
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to load danger zones.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadDangerZones();
  }, [loadDangerZones]);

  const handleViewDetails = useCallback((zone) => {
    setSelectedZone(zone);
    setShowMapModal(true);
  }, []);

  const handleResolveZone = useCallback(
    async (zone) => {
      try {
        await apiClient.post(`/danger-zones/${zone.id}/resolve`, {}, { timeoutMs: 8000 });
        Alert.alert("Success", `${zone.name} marked as resolved.`);
        await loadDangerZones();
      } catch (error) {
        Alert.alert("Error", error?.message || "Failed to resolve zone.");
      }
    },
    [loadDangerZones]
  );

  const handleDeleteZone = useCallback(
    async (zone) => {
      Alert.alert("Confirm Delete", `Delete danger zone "${zone.name}"?`, [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await apiClient.delete(`/danger-zones/${zone.id}`, { timeoutMs: 8000 });
              Alert.alert("Success", "Danger zone deleted.");
              await loadDangerZones();
            } catch (error) {
              Alert.alert("Error", error?.message || "Failed to delete zone.");
            }
          },
          style: "destructive",
        },
      ]);
    },
    [loadDangerZones]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.line }]}>
        <Text style={[styles.title, { color: theme.text }]}>Danger Zones</Text>
        <View style={[styles.badge, { backgroundColor: theme.danger + "15" }]}>
          <Text style={[styles.badgeText, { color: theme.danger }]}>{zones.length}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterTabs, { borderBottomColor: theme.line }]}>
        {["active", "resolved"].map((status) => (
          <Pressable
            key={status}
            style={[
              styles.filterTab,
              statusFilter === status && { borderBottomColor: theme.brand, borderBottomWidth: 2 },
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text style={[styles.filterText, statusFilter === status && { color: theme.brand, fontWeight: "700" }]}>
              {status === "active" ? "🔴 Active" : "✓ Resolved"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Zone List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand} />
        </View>
      ) : zones.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="map-outline" size={48} color={theme.textSoft + "50"} />
          <Text style={[styles.emptyText, { color: theme.text }]}>No zones</Text>
          <Text style={[styles.emptySubText, { color: theme.textSoft }]}>
            {statusFilter === "active" ? "No active danger zones" : "No resolved zones"}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {zones.map((zone) => (
            <DangerZoneItem
              key={zone.id}
              zone={zone}
              theme={theme}
              styles={styles}
              onViewDetails={handleViewDetails}
              onResolve={handleResolveZone}
              onDelete={handleDeleteZone}
            />
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Map Modal */}
      <Modal visible={showMapModal} animationType="slide" transparent onRequestClose={() => setShowMapModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.bg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.line }]}>
            <Pressable onPress={() => setShowMapModal(false)}>
              <Ionicons name="chevron-back-outline" size={24} color={theme.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{selectedZone?.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedZone && (
            <>
              <View style={styles.mapWrapper}>
                {/* MapView temporarily disabled */}
                <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.line }]}>
                  <Text style={{ color: theme.textSoft }}>Map View</Text>
                  <Text style={{ color: theme.textSoft, fontSize: 12, marginTop: 5 }}>
                    Zone: {selectedZone.name}
                  </Text>
                </View>
              </View>

              <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
                <View style={[styles.detailBox, { borderColor: theme.line }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSoft }]}>Risk Score</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedZone.riskScore}/100</Text>
                </View>

                <View style={[styles.detailBox, { borderColor: theme.line }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSoft }]}>Coordinates</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {selectedZone.coordinates[1].toFixed(4)}, {selectedZone.coordinates[0].toFixed(4)}
                  </Text>
                </View>

                <View style={[styles.detailBox, { borderColor: theme.line }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSoft }]}>Radius</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedZone.radius.toFixed(2)} km</Text>
                </View>

                <View style={[styles.detailBox, { borderColor: theme.line }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSoft }]}>Severity</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedZone.severity?.toUpperCase()}</Text>
                </View>

                {selectedZone.description && (
                  <View style={[styles.detailBox, { borderColor: theme.line }]}>
                    <Text style={[styles.detailLabel, { color: theme.textSoft }]}>Description</Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>{selectedZone.description}</Text>
                  </View>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
    },
    title: { fontSize: 20, fontWeight: "700" },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: "700" },
    filterTabs: { flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: 1 },
    filterTab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 0 },
    filterText: { fontSize: 13, fontWeight: "600", color: theme.textSoft },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    listContainer: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
    emptyText: { fontSize: 16, fontWeight: "700", marginTop: 12 },
    emptySubText: { fontSize: 13, fontWeight: "500", marginTop: 4 },
    zoneCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      padding: 12,
      marginBottom: 10,
    },
    zoneHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    riskBadge: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
    riskScore: { fontSize: 18, fontWeight: "800" },
    zoneName: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
    zoneSub: { fontSize: 11, fontWeight: "500" },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
    statusText: { fontSize: 14 },
    zoneDesc: { fontSize: 12, fontWeight: "500", marginBottom: 8, lineHeight: 16 },
    zoneInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    infoText: { fontSize: 11, fontWeight: "500" },
    actionButtons: { flexDirection: "row", gap: 6 },
    btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
    btnSmall: { paddingVertical: 8 },
    btnSmallText: { fontSize: 11, fontWeight: "700", marginLeft: 4 },
    modalContainer: { flex: 1, backgroundColor: theme.bg },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    modalTitle: { fontSize: 16, fontWeight: "700", flex: 1, marginLeft: 12 },
    mapWrapper: { height: 250, marginBottom: 12 },
    map: { flex: 1 },
    markerIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
    detailsContainer: { flex: 1, paddingHorizontal: 16 },
    detailBox: { borderBottomWidth: 1, paddingVertical: 12 },
    detailLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4, letterSpacing: 0.5 },
    detailValue: { fontSize: 13, fontWeight: "600" },
  });
