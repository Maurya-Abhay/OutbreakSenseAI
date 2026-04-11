import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeatmapMap from "../components/HeatmapMap";
import { resolveRiskColor, toScorePercent } from "../theme/palette";

const InfoRow = ({ icon, iconColor, label, value, theme, styles }) => (
  <View style={styles.infoRow}>
    <View style={[styles.infoIconBox, { backgroundColor: (iconColor || theme.textSoft) + "15" }]}>
      <Ionicons name={icon} size={15} color={iconColor || theme.textSoft} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  </View>
);

const MapScreen = ({
  theme,
  mapPoints,
  mapLoading,
  onRefreshMap,
  onDetectLocation,
  currentLocation,
  lastSyncAt,
  onPickManualLocation,
}) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapLanguage, setMapLanguage] = useState("en");
  const styles = useMemo(() => createStyles(theme), [theme]);
  const brand = theme.brand || "#3182ce";

  const labels = useMemo(
    () =>
      mapLanguage === "hi"
        ? {
            title: "रिस्क मैप",
            subtitle: "रियल-टाइम में प्रकोप के क्षेत्र और स्थानीय जोखिम घनत्व देखें।",
            locationPending: "लोकेशन डिटेक्ट हो रही है...",
            centerGps: "GPS सेंटर",
            syncMap: "मैप सिंक",
            high: "उच्च",
            medium: "मध्यम",
            low: "न्यून",
            locationInsights: "लोकेशन इनसाइट्स",
            emptyHint: "विस्तृत जोखिम विश्लेषण देखने के लिए किसी हॉटस्पॉट पर टैप करें।",
            areaName: "क्षेत्र का नाम",
            riskClass: "जोखिम वर्ग",
            scoreReports: "स्कोर / रिपोर्ट",
            coordinates: "निर्देशांक",
            citizens: "नागरिक",
            currentLocation: "वर्तमान स्थान",
          }
        : {
            title: "Risk Map",
            subtitle: "Visualize outbreak rings and local risk density in real-time.",
            locationPending: "Detecting location...",
            centerGps: "Center GPS",
            syncMap: "Sync Map",
            high: "High",
            medium: "Med",
            low: "Low",
            locationInsights: "Location Insights",
            emptyHint: "Tap any hotspot marker to view detailed risk analysis.",
            areaName: "Area Name",
            riskClass: "Risk Classification",
            scoreReports: "Score / Reports",
            coordinates: "Coordinates",
            citizens: "citizens",
            currentLocation: "Current Location",
          },
    [mapLanguage]
  );

  const getLocalizedRiskLevel = useCallback(
    (riskLevel) => {
      const level = String(riskLevel || "").toLowerCase();
      if (mapLanguage === "hi") {
        if (level.includes("high")) return "उच्च";
        if (level.includes("med") || level.includes("warn")) return "मध्यम";
        return "न्यून";
      }
      if (level.includes("high")) return "HIGH";
      if (level.includes("med") || level.includes("warn")) return "MEDIUM";
      return "LOW";
    },
    [mapLanguage]
  );

  const getLocalizedLocationName = useCallback(
    (name, fallbackIndex = 0) => {
      const raw = String(name || "").trim();
      if (!raw) {
        return mapLanguage === "hi" ? `${labels.currentLocation}` : labels.currentLocation;
      }
      const hasBanglaChars = /[\u0980-\u09FF]/.test(raw);
      if (!hasBanglaChars) return raw;
      return mapLanguage === "hi" ? `क्षेत्र ${fallbackIndex || 1}` : `Area ${fallbackIndex || 1}`;
    },
    [labels.currentLocation, mapLanguage]
  );

  const syncTime = lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Never";

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <View style={styles.headCard}>
        <View style={styles.headTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: brand }]}>SPATIAL INTELLIGENCE</Text>
            <Text style={[styles.title, { color: theme.text }]}>{labels.title}</Text>
          </View>
          <View style={styles.headActions}>
            <View style={[styles.langSwitch, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
              <Pressable
                onPress={() => setMapLanguage("en")}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor: mapLanguage === "en" ? brand + "20" : "transparent",
                  },
                ]}
              >
                <Text style={[styles.langBtnText, { color: mapLanguage === "en" ? brand : theme.textSoft }]}>EN</Text>
              </Pressable>
              <Pressable
                onPress={() => setMapLanguage("hi")}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor: mapLanguage === "hi" ? brand + "20" : "transparent",
                  },
                ]}
              >
                <Text style={[styles.langBtnText, { color: mapLanguage === "hi" ? brand : theme.textSoft }]}>HI</Text>
              </Pressable>
            </View>
            <View style={[styles.syncBadge, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
              <Ionicons name="time-outline" size={12} color={theme.textSoft} />
              <Text style={[styles.syncText, { color: theme.textSoft }]}>{syncTime}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: theme.textSoft }]}>
          {labels.subtitle}
        </Text>

        <View style={[styles.locationStrip, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
          <Ionicons name="navigate-circle-outline" size={15} color={brand} />
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
            {currentLocation?.locationName
              ? getLocalizedLocationName(currentLocation.locationName, 0)
              : labels.locationPending}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            onPress={onDetectLocation}
            style={[styles.btn, styles.btnGhost]}
          >
            <Ionicons name="locate-outline" size={15} color={theme.text} />
            <Text style={[styles.btnText, { color: theme.text }]}>{labels.centerGps}</Text>
          </Pressable>
          <Pressable
            onPress={onRefreshMap}
            style={[styles.btn, styles.btnSolid, { backgroundColor: brand }]}
          >
            {mapLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="refresh-outline" size={15} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>{labels.syncMap}</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Map Container */}
      <View style={[styles.mapContainer, { borderColor: theme.line, backgroundColor: theme.card }]}>
        <HeatmapMap
          theme={theme}
          points={mapPoints}
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
          currentLocation={currentLocation}
          onPickLocation={onPickManualLocation}
          mapLanguage={mapLanguage}
          labels={labels}
          formatLocationName={getLocalizedLocationName}
        />
        <View style={[styles.legendOverlay, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
            <Text style={[styles.legendText, { color: theme.textSoft }]}>{labels.high}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.warning }]} />
            <Text style={[styles.legendText, { color: theme.textSoft }]}>{labels.medium}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
            <Text style={[styles.legendText, { color: theme.textSoft }]}>{labels.low}</Text>
          </View>
        </View>
      </View>

      {/* Detail Card */}
      <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.detailHeader}>
          <View style={[styles.detailIconWrap, { backgroundColor: brand + "15" }]}>
            <Ionicons name="information-circle-outline" size={16} color={brand} />
          </View>
          <Text style={[styles.detailTitle, { color: theme.text }]}>{labels.locationInsights}</Text>
        </View>

        {!selectedPoint ? (
          <View style={styles.emptyState}>
            <Ionicons name="finger-print" size={34} color={theme.textSoft} />
            <Text style={[styles.emptyText, { color: theme.textSoft }]}>
              {labels.emptyHint}
            </Text>
          </View>
        ) : (
          <View style={styles.infoGrid}>
            <InfoRow
              icon="map-outline"
              label={labels.areaName}
              value={getLocalizedLocationName(selectedPoint.locationName, 1)}
              theme={theme}
              styles={styles}
            />
            <InfoRow
              icon="shield-outline"
              iconColor={resolveRiskColor(selectedPoint.riskLevel, theme)}
              label={labels.riskClass}
              value={getLocalizedRiskLevel(selectedPoint.riskLevel)}
              theme={theme}
              styles={styles}
            />
            <InfoRow
              icon="stats-chart-outline"
              label={labels.scoreReports}
              value={`${toScorePercent(selectedPoint.averageRisk)} • ${selectedPoint.totalReports || 0} ${labels.citizens}`}
              theme={theme}
              styles={styles}
            />
            <InfoRow
              icon="pin-outline"
              label={labels.coordinates}
              value={`${Number(selectedPoint.latitude).toFixed(4)}, ${Number(selectedPoint.longitude).toFixed(4)}`}
              theme={theme}
              styles={styles}
            />
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 0,
      gap: 16,
    },

    // Head Card
    headCard: {
      backgroundColor: theme.card,
      borderRadius: 22,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
        android: { elevation: 4 },
      }),
    },
    headTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    headActions: {
      alignItems: "flex-end",
      gap: 8,
    },
    langSwitch: {
      flexDirection: "row",
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 10,
      overflow: "hidden",
    },
    langBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    langBtnText: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    kicker: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    syncBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    syncText: {
      fontSize: 11,
      fontWeight: "600",
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "400",
      marginBottom: 14,
    },
    locationStrip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 11,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 14,
    },
    locationText: {
      fontSize: 13,
      fontWeight: "600",
      flex: 1,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    btn: {
      flex: 1,
      height: 48,
      borderRadius: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.cardElevated,
    },
    btnSolid: {
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
        android: { elevation: 4 },
      }),
    },
    btnText: {
      fontSize: 14,
      fontWeight: "700",
    },

    // Map
    mapContainer: {
      height: 320,
      borderRadius: 22,
      overflow: "hidden",
      borderWidth: 1,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 },
        android: { elevation: 4 },
      }),
    },
    legendOverlay: {
      position: "absolute",
      bottom: 12,
      right: 12,
      padding: 10,
      borderRadius: 12,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
        android: { elevation: 5 },
      }),
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 11,
      fontWeight: "600",
    },

    // Detail Card
    detailCard: {
      borderRadius: 22,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
        android: { elevation: 4 },
      }),
    },
    detailHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    detailIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    detailTitle: {
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 28,
      gap: 10,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: "400",
      textAlign: "center",
      lineHeight: 19,
    },
    infoGrid: {
      gap: 4,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.line,
    },
    infoIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    infoLabel: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "600",
      letterSpacing: 0.3,
      marginBottom: 2,
    },
    infoValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
    },
  });

export default memo(MapScreen);