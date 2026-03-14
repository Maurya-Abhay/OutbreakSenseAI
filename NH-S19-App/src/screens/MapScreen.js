import { memo, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeatmapMap from "../components/HeatmapMap";
import { resolveRiskColor, toScorePercent } from "../theme/palette";

const MapScreen = ({
  theme,
  mapPoints,
  mapLoading,
  onRefreshMap,
  onDetectLocation,
  currentLocation,
  lastSyncAt,
  onPickManualLocation
}) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryColor = theme.blue || theme.brand || "#007AFF";

  return (
    <ScrollView 
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      {/* 🗺️ Header Card */}
      <View style={styles.headCard}>
        <View style={styles.headTop}>
          <View>
            <Text style={[styles.kicker, { color: primaryColor }]}>SPATIAL INTELLIGENCE</Text>
            <Text style={styles.title}>Interactive Risk Map</Text>
          </View>
          <View style={[styles.syncBadge, { backgroundColor: theme.line + '50' }]}>
            <Ionicons name="time-outline" size={12} color={theme.textSoft} />
            <Text style={styles.syncText}>
              {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Visualize outbreak rings and inspect local risk density in real-time.
        </Text>

        <View style={styles.locationStrip}>
          <Ionicons name="navigate-circle" size={16} color={primaryColor} />
          <Text style={styles.locationText} numberOfLines={1}>
            {currentLocation?.locationName || "Detecting your location..."}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={onDetectLocation} style={[styles.btn, styles.btnGhost]}>
            <Ionicons name="locate" size={16} color={theme.text} />
            <Text style={styles.btnGhostText}>Center GPS</Text>
          </Pressable>

          <Pressable onPress={onRefreshMap} style={[styles.btn, styles.btnSolid, { backgroundColor: primaryColor }]}>
            {mapLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.btnSolidText}>Sync Map</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* 🗺️ Map Container */}
      <View style={styles.mapContainer}>
        <HeatmapMap
          theme={theme}
          points={mapPoints}
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
          currentLocation={currentLocation}
          onPickLocation={onPickManualLocation}
        />
        {/* Floating Legend Overlay */}
        <View style={styles.legendOverlay}>
           <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: theme.danger}]} /><Text style={styles.legendText}>High</Text></View>
           <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: theme.warn}]} /><Text style={styles.legendText}>Med</Text></View>
        </View>
      </View>

      {/* 📍 Selection Details Card */}
      <View style={styles.detailCard}>
        <View style={styles.detailHeader}>
          <Ionicons name="information-circle" size={20} color={primaryColor} />
          <Text style={styles.detailTitle}>Location Insights</Text>
        </View>

        {!selectedPoint ? (
          <View style={styles.emptyState}>
            <Ionicons name="finger-print" size={32} color={theme.line} />
            <Text style={styles.empty}>Tap any hotspot marker to view detailed risk analysis.</Text>
          </View>
        ) : (
          <View style={styles.infoGrid}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="map-outline" size={16} color={theme.textSoft} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Area Name</Text>
                <Text style={styles.infoValue}>{selectedPoint.locationName}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: resolveRiskColor(selectedPoint.riskLevel, theme) + '20' }]}>
                <Ionicons name="shield" size={16} color={resolveRiskColor(selectedPoint.riskLevel, theme)} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Risk Classification</Text>
                <Text style={[styles.infoValue, { color: resolveRiskColor(selectedPoint.riskLevel, theme), fontWeight: '800' }]}>
                  {selectedPoint.riskLevel?.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="stats-chart" size={16} color={theme.textSoft} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Average Score / Reports</Text>
                <Text style={styles.infoValue}>
                  {toScorePercent(selectedPoint.averageRisk)} • {selectedPoint.totalReports || 0} Citizens
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}>
                <Ionicons name="pin" size={16} color={theme.textSoft} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Coordinates</Text>
                <Text style={styles.infoValue}>
                  {Number(selectedPoint.latitude).toFixed(4)}, {Number(selectedPoint.longitude).toFixed(4)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 120,
      gap: 16
    },
    // Header Section
    headCard: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10 },
        android: { elevation: 3 }
      })
    },
    headTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    kicker: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 2
    },
    title: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    syncBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8
    },
    syncText: {
      color: theme.textSoft,
      fontSize: 10,
      fontWeight: "700"
    },
    subtitle: {
      marginTop: 6,
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500"
    },
    locationStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      backgroundColor: theme.bg,
      padding: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    locationText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "600",
      flex: 1
    },
    actionRow: {
      marginTop: 16,
      flexDirection: "row",
      gap: 8
    },
    btn: {
      flex: 1,
      minHeight: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.bg
    },
    btnSolid: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2
    },
    btnGhostText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
    },
    btnSolidText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700"
    },

    // Map Section
    mapContainer: {
      height: 320,
      borderRadius: 24,
      overflow: 'hidden', // Crucial for rounded map corners
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.card
    },
    legendOverlay: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      backgroundColor: theme.card,
      padding: 8,
      borderRadius: 12,
      gap: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      elevation: 5
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, fontWeight: '700', color: theme.textSoft },

    // Detail Section
    detailCard: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
    },
    detailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16
    },
    detailTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      gap: 12
    },
    empty: {
      color: theme.textSoft,
      fontSize: 13,
      textAlign: 'center',
      fontWeight: "500",
      lineHeight: 18
    },
    infoGrid: {
      gap: 16
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },
    infoIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    infoLabel: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700",
      textTransform: 'uppercase'
    },
    infoValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
      marginTop: 1
    }
  });

export default memo(MapScreen);