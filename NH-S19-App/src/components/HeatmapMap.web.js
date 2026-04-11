import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HeatmapMap = ({
  theme,
  points,
  onPickLocation,
  enableLocationPicker = false,
  currentLocation,
  selectedPoint,
  onSelectPoint,
  mapLanguage = "en",
  labels,
  formatLocationName,
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryColor = theme.blue || "#007AFF";
  const localizedLabels =
    labels ||
    (mapLanguage === "hi"
      ? {
          totalZones: "कुल क्षेत्र",
          highRisk: "उच्च जोखिम",
          location: "स्थान",
          current: "वर्तमान",
          hotspots: "सक्रिय जोखिम हॉटस्पॉट",
          noZones: "कोई जोखिम क्षेत्र नहीं मिला",
          syncHint: "नया डेटा लाने के लिए Sync Map दबाएं",
          reports: "रिपोर्ट",
          topZone: "टॉप जोखिम क्षेत्र चुनें",
        }
      : {
          totalZones: "TOTAL ZONES",
          highRisk: "HIGH RISK",
          location: "LOCATION",
          current: "Current",
          hotspots: "ACTIVE RISK HOTSPOTS",
          noZones: "No risk zones detected",
          syncHint: 'Tap "Sync Map" to load latest data',
          reports: "reports",
          topZone: "Use Top Risk Zone",
        });
  
  // Shows all risk points with risk-based coloring
  const displayPoints = Array.isArray(points) ? points : [];

  // Sort by risk level (high first)
  const sortedPoints = useMemo(() => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return [...displayPoints].sort((a, b) => 
      (riskOrder[String(a.riskLevel).toLowerCase()] ?? 3) - 
      (riskOrder[String(b.riskLevel).toLowerCase()] ?? 3)
    );
  }, [displayPoints]);

  const getRiskColor = (riskLevel) => {
    const level = String(riskLevel).toLowerCase();
    if (level.includes('high')) return theme.danger || '#FF3B30';
    if (level.includes('medium') || level.includes('warn')) return theme.warning || '#FF9500';
    return theme.success || '#34C759';
  };

  const getRiskPercent = (risk) => Math.min(100, Math.max(0, Math.round(Number(risk) * 100)));

  return (
    <View style={styles.wrap}>
      {/* 📊 Header Stats */}
      <View style={styles.headerStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>{localizedLabels.totalZones}</Text>
          <Text style={styles.statValue}>{displayPoints.length}</Text>
        </View>
        <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: theme.line }]}>
          <Text style={styles.statLabel}>{localizedLabels.highRisk}</Text>
          <Text style={styles.statValue}>
            {displayPoints.filter(p => String(p.riskLevel).toLowerCase().includes('high')).length}
          </Text>
        </View>
        <View style={[styles.statItem, { borderLeftWidth: 1, borderLeftColor: theme.line }]}>
          <Text style={styles.statLabel}>{localizedLabels.location}</Text>
          <Text style={styles.statValueSmall} numberOfLines={1}>
            {formatLocationName
              ? formatLocationName(currentLocation?.locationName, 0)
              : currentLocation?.locationName?.split(',')[0] || localizedLabels.current}
          </Text>
        </View>
      </View>

      {/* 🗺️ Visual Grid Map */}
      <View style={styles.gridMap}>
        <View style={styles.gridBg}>
          {/* Grid lines */}
          <View style={styles.gridLine} />
          <View style={[styles.gridLine, styles.gridLineVertical]} />
        </View>
        
        {/* Risk Point Visualization */}
        <View style={styles.pointsOverlay}>
          {sortedPoints.slice(0, 15).map((point, idx) => {
            // Normalize coordinates to grid (simple approach)
            const x = ((Number(point.longitude) - 89.5) / 1.5) * 100; // Scale for Bangladesh region
            const y = ((Number(point.latitude) - 23.0) / 2.0) * 100;
            const clampX = Math.max(5, Math.min(95, x));
            const clampY = Math.max(5, Math.min(95, y));
            const riskColor = getRiskColor(point.riskLevel);
            const riskIntensity = getRiskPercent(point.averageRisk);

            return (
              <Pressable
                key={`point-${idx}`}
                onPress={() => onSelectPoint?.(point)}
                style={[
                  styles.riskDot,
                  {
                    left: `${clampX}%`,
                    top: `${clampY}%`,
                    backgroundColor: riskColor,
                    opacity: 0.4 + (riskIntensity / 250),
                    borderColor: riskColor,
                    width: 24 + (riskIntensity / 10),
                    height: 24 + (riskIntensity / 10),
                  },
                  selectedPoint?.id === point.id && styles.selectedDot
                ]}
              >
                <Text style={styles.riskDotLabel}>{idx + 1}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Current location marker */}
        {currentLocation && (
          <View
            style={[
              styles.currentLocationMarker,
              {
                left: `${Math.max(5, Math.min(95, ((Number(currentLocation.longitude) - 89.5) / 1.5) * 100))}%`,
                top: `${Math.max(5, Math.min(95, ((Number(currentLocation.latitude) - 23.0) / 2.0) * 100))}%`,
                backgroundColor: theme.blue,
              }
            ]}
          />
        )}
      </View>

      {/* 📝 Risk Points List */}
      <ScrollView style={styles.listContainer} scrollEnabled={displayPoints.length > 4}>
        <Text style={styles.listHeader}>{localizedLabels.hotspots}</Text>
        {sortedPoints.length === 0 ? (
          <View style={styles.emptyList}>
            <Ionicons name="map-outline" size={28} color={theme.textSoft} />
            <Text style={[styles.emptyText, { color: theme.textSoft }]}>{localizedLabels.noZones}</Text>
            <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>{localizedLabels.syncHint}</Text>
          </View>
        ) : (
          sortedPoints.map((point, idx) => {
            const riskColor = getRiskColor(point.riskLevel);
            const isSelected = selectedPoint?.id === point.id;
            return (
              <Pressable
                key={`list-${idx}`}
                onPress={() => onSelectPoint?.(point)}
                style={[
                  styles.listRow,
                  { borderLeftColor: riskColor, borderLeftWidth: 3, backgroundColor: isSelected ? theme.cardElevated : 'transparent' }
                ]}
              >
                <View style={[styles.riskBadge, { backgroundColor: riskColor }]}>
                  <Text style={styles.riskBadgeText}>{getRiskPercent(point.averageRisk)}%</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>
                    {formatLocationName
                      ? formatLocationName(point.locationName, idx + 1)
                      : point.locationName || `Zone ${idx + 1}`}
                  </Text>
                  <Text style={[styles.rowMeta, { color: theme.textSoft }]} numberOfLines={1}>
                    {String(point.riskLevel).toUpperCase()} • {point.totalReports || 0} {localizedLabels.reports}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={12} color={theme.textMuted} />
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* Selection Assistant Button */}
      {enableLocationPicker && displayPoints.length > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.pickBtn,
            { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={() => {
            const first = displayPoints[0];
            if (first?.latitude) {
              onPickLocation?.({ latitude: Number(first.latitude), longitude: Number(first.longitude) });
            }
          }}
        >
          <Ionicons name="location" size={16} color="#FFF" />
          <Text style={styles.pickBtnText}>{localizedLabels.topZone}</Text>
        </Pressable>
      )}
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: theme.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.line,
      overflow: "hidden",
      height: 420,
      flexDirection: 'column',
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
        android: { elevation: 4 }
      })
    },
    headerStats: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.cardElevated,
      borderBottomWidth: 1,
      borderBottomColor: theme.line,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textMuted,
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },
    statValueSmall: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    gridMap: {
      flex: 1,
      position: 'relative',
      backgroundColor: theme.bg,
      borderBottomWidth: 1,
      borderBottomColor: theme.line,
      overflow: 'hidden',
    },
    gridBg: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.bg,
    },
    gridLine: {
      position: 'absolute',
      backgroundColor: theme.line,
      opacity: 0.2,
      width: '100%',
      height: 1,
      top: '50%',
    },
    gridLineVertical: {
      width: 1,
      height: '100%',
      top: 0,
      left: '50%',
    },
    pointsOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    riskDot: {
      position: 'absolute',
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: -12,
      marginTop: -12,
    },
    riskDotLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: 'white',
    },
    selectedDot: {
      borderWidth: 3,
      borderColor: 'white',
    },
    currentLocationMarker: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'white',
      marginLeft: -8,
      marginTop: -8,
    },
    listContainer: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      maxHeight: 120,
    },
    listHeader: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textMuted,
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginBottom: 6,
      borderRadius: 10,
      backgroundColor: theme.bg,
    },
    riskBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      minWidth: 40,
      alignItems: 'center',
    },
    riskBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#FFF',
    },
    rowTitle: {
      fontSize: 12,
      fontWeight: '600',
    },
    rowMeta: {
      fontSize: 10,
      marginTop: 2,
    },
    emptyList: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      gap: 8,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: '600',
    },
    emptySubtext: {
      fontSize: 11,
    },
    pickBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginHorizontal: 12,
      marginVertical: 10,
    },
    pickBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFF',
    }
  });

export default memo(HeatmapMap);