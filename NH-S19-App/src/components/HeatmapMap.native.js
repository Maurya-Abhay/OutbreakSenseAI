import { memo } from "react";
// react-native-maps removed - using web fallback instead
import HeatmapMapFallback from "./HeatmapMap.web";

const HeatmapMap = ({
  theme,
  points,
  currentLocation,
  selectedPoint,
  onSelectPoint,
  onPickLocation,
  enableLocationPicker = false
}) => {
  // Fallback: use web version on native since react-native-maps is not installed
  return (
    <HeatmapMapFallback
      theme={theme}
      points={points}
      currentLocation={currentLocation}
      selectedPoint={selectedPoint}
      onSelectPoint={onSelectPoint}
      onPickLocation={onPickLocation}
      enableLocationPicker={enableLocationPicker}
    />
  );
};

export default memo(HeatmapMap);
import { Fragment, memo } from "react";
import { View } from "react-native";
// import MapView, { Circle, Marker } from "react-native-maps";  // Commented: Removed react-native-maps
import HeatmapMapFallback from "./HeatmapMap.web";

const HeatmapMap = ({
  theme,
  points,
  currentLocation,
  selectedPoint,
  onSelectPoint,
  onPickLocation,
  enableLocationPicker = false
}) => {
  // Fallback: use web version on native since react-native-maps is not installed
  return (
    <HeatmapMapFallback
      theme={theme}
      points={points}
      currentLocation={currentLocation}
      selectedPoint={selectedPoint}
      onSelectPoint={onSelectPoint}
      onPickLocation={onPickLocation}
      enableLocationPicker={enableLocationPicker}
    />
  );
};

export default memo(HeatmapMap);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const normalizedPoints = useMemo(() => {
    if (!Array.isArray(points)) {
      return [];
    }

    return points
      .map((point) => {
        const latitude = toFiniteNumber(point?.latitude);
        const longitude = toFiniteNumber(point?.longitude);
        if (!hasValidCoords(latitude, longitude)) {
          return null;
        }

        return {
          ...point,
          latitude,
          longitude,
          averageRisk: Math.max(0, toFiniteNumber(point?.averageRisk) ?? 0)
        };
      })
      .filter(Boolean)
      .slice(0, 250);
  }, [points]);

  const normalizedCurrentLocation = useMemo(() => {
    const latitude = toFiniteNumber(currentLocation?.latitude);
    const longitude = toFiniteNumber(currentLocation?.longitude);
    if (!hasValidCoords(latitude, longitude)) {
      return null;
    }

    return { latitude, longitude };
  }, [currentLocation]);

  const normalizedSelectedPoint = useMemo(() => {
    const latitude = toFiniteNumber(selectedPoint?.latitude);
    const longitude = toFiniteNumber(selectedPoint?.longitude);
    if (!hasValidCoords(latitude, longitude)) {
      return null;
    }

    return { latitude, longitude };
  }, [selectedPoint]);

  // 🪄 Smooth Camera Transition
  useEffect(() => {
    if (normalizedCurrentLocation?.latitude && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: normalizedCurrentLocation.latitude,
        longitude: normalizedCurrentLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
      }, 1000);
    }
  }, [normalizedCurrentLocation]);

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        showsPointsOfInterest={false}
        showsIndoors={false}
        onPress={(event) => {
          if (!enableLocationPicker || !onPickLocation) return;
          const coords = event?.nativeEvent?.coordinate;
          if (coords) onPickLocation({ 
            latitude: Number(coords.latitude), 
            longitude: Number(coords.longitude) 
          });
        }}
      >
        {/* 🔥 Risk Zones (Circles & Markers) */}
        {normalizedPoints.map((point, idx) => {
          const riskLevel = String(point.riskLevel || "Low");
          const tone = resolveRiskColor(riskLevel, theme);
          const coords = {
            latitude: point.latitude,
            longitude: point.longitude
          };

          return (
            <Fragment key={point.id || `risk-${idx}`}>
              <Circle
                center={coords}
                radius={Math.max(300, Number(point.averageRisk || 0) * 2000)}
                strokeWidth={2}
                strokeColor={tone}
                fillColor={`${tone}25`}
                zIndex={1}
              />
              <Marker
                coordinate={coords}
                onPress={() => onSelectPoint?.(point)}
                anchor={{ x: 0.5, y: 0.5 }} // Center icon on point
                zIndex={2}
              >
                <View style={[styles.customMarker, { backgroundColor: tone }]}>
                  <Ionicons name="warning" size={10} color="#FFF" />
                </View>
              </Marker>
            </Fragment>
          );
        })}

        {/* 📍 User Current Location Marker */}
        {normalizedCurrentLocation && (
          <Marker
            coordinate={{
              latitude: normalizedCurrentLocation.latitude,
              longitude: normalizedCurrentLocation.longitude
            }}
            title="You are here"
            zIndex={10}
          >
            <View style={styles.userMarkerContainer}>
              <View style={[styles.userMarkerPulse, { backgroundColor: theme.blue + '30' }]} />
              <View style={[styles.userMarkerDot, { backgroundColor: theme.blue }]} />
            </View>
          </Marker>
        )}

        {/* ✨ Manual Selection Marker */}
        {normalizedSelectedPoint && (
          <Marker
            coordinate={{
              latitude: normalizedSelectedPoint.latitude,
              longitude: normalizedSelectedPoint.longitude
            }}
            pinColor={theme.brand}
            zIndex={11}
          />
        )}
      </MapView>

      {/* 📊 Bottom Legend Bar */}
      <View style={styles.legendRow}>
        <Text style={styles.legendLabel}>RISK DENSITY</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
            <Text style={styles.legendText}>Low</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.warn }]} />
            <Text style={styles.legendText}>Med</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    wrap: {
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.line,
    },
    map: {
      width: "100%",
      height: 300,
    },
    // Custom Markers
    customMarker: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: '#FFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
        android: { elevation: 4 }
      })
    },
    userMarkerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40
    },
    userMarkerPulse: {
      position: 'absolute',
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    userMarkerDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 3,
      borderColor: '#FFF',
    },
    // Legend
    legendRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.card,
    },
    legendLabel: {
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1,
    },
    legendItems: {
      flexDirection: 'row',
      gap: 12
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    legendText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: "700",
    }
  });

export default memo(HeatmapMap);