import { memo, useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import SkeletonBlock from "../common/SkeletonBlock";
import { useTheme } from "../../hooks/useTheme";

const DEFAULT_CENTER = [23.8103, 90.4125];

const HeatLayer = ({ points = [] }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length || !L.heatLayer) {
      return undefined;
    }

    const heatPoints = points.map((point) => [point.latitude, point.longitude, (point.intensity || 50) / 100]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 28,
      blur: 18,
      minOpacity: 0.4,
      gradient: {
        0.25: "#22c55e",
        0.55: "#f59e0b",
        0.82: "#ef4444"
      }
    });

    heatLayer.addTo(map);

    return () => {
      if (map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
};

const ViewportSync = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (!center || !Array.isArray(center)) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [map, center]);

  return null;
};

const FitToPoints = ({ points, disabled = false }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length || disabled) {
      return;
    }

    const coordinates = points
      .map((point) => [Number(point.latitude), Number(point.longitude)])
      .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

    if (!coordinates.length) {
      return;
    }

    const bounds = L.latLngBounds(coordinates);

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [28, 28],
        maxZoom: 9,
        animate: true
      });
    }
  }, [disabled, map, points]);

  return null;
};

const MapPicker = ({ enabled, onSelectLocation }) => {
  useMapEvents({
    click(event) {
      if (!enabled || !onSelectLocation) return;

      const selected = {
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
        locationName: "Custom Selected Point",
        predictionTrend: "Selected"
      };

      onSelectLocation(selected);
    }
  });

  return null;
};

const levelToColor = (level) => {
  if (String(level).toLowerCase().includes("high")) return "#ef4444";
  if (String(level).toLowerCase().includes("med")) return "#f59e0b";
  return "#22c55e";
};

const riskLabelClass = (level) => {
  if (String(level).toLowerCase().includes("high")) return "text-red-600";
  if (String(level).toLowerCase().includes("med")) return "text-amber-600";
  return "text-emerald-600";
};

const RiskHeatmapMap = ({
  points = [],
  loading = false,
  title = "Risk Heatmap",
  subtitle = "Green = Low, Yellow = Medium, Red = High risk zones.",
  enablePicker = false,
  selectedLocation = null,
  onSelectLocation
}) => {
  const { isDark } = useTheme();

  const tileConfig = useMemo(
    () =>
      isDark
        ? {
            url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        : {
            url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          },
    [isDark]
  );

  const center = useMemo(() => {
    if (selectedLocation?.latitude && selectedLocation?.longitude) {
      return [selectedLocation.latitude, selectedLocation.longitude];
    }

    if (points.length) {
      return [points[0].latitude, points[0].longitude];
    }

    return DEFAULT_CENTER;
  }, [points, selectedLocation?.latitude, selectedLocation?.longitude]);

  if (loading) {
    return (
      <section className="saas-panel p-4 md:p-5" aria-busy="true" aria-live="polite">
        <SkeletonBlock className="h-6 w-56" />
        <SkeletonBlock className="mt-2 h-4 w-72" />
        <SkeletonBlock className="mt-4 h-[360px] w-full rounded-2xl" />
      </section>
    );
  }

  return (
    <section className="saas-panel p-4 md:p-5" aria-label="Disease outbreak heatmap">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="saas-heading">{title}</h3>
          <p className="saas-muted mt-1">{subtitle}</p>
        </div>
        <span className="saas-chip rounded-xl px-3 py-1 text-xs font-semibold">{points.length} zones</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
        <MapContainer center={center} zoom={11} scrollWheelZoom className="h-[390px] w-full" keyboard zoomControl>
          <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} maxZoom={19} />

          <ViewportSync center={center} />
          <FitToPoints points={points} disabled={Boolean(selectedLocation?.latitude && selectedLocation?.longitude)} />
          <MapPicker enabled={enablePicker} onSelectLocation={onSelectLocation} />
          <HeatLayer points={points} />

          {points.map((point) => {
            const trendDirection = point.predictionTrend || point.trendDirection || "Stable";

            return (
              <CircleMarker
                key={`${point.locationName}-${point.latitude}-${point.longitude}`}
                center={[point.latitude, point.longitude]}
                radius={8}
                pathOptions={{ color: levelToColor(point.riskLevel), fillOpacity: 0.9 }}
                eventHandlers={{
                  click: () => {
                    if (!onSelectLocation) return;
                    onSelectLocation({
                      latitude: point.latitude,
                      longitude: point.longitude,
                      locationName: point.locationName,
                      riskLevel: point.riskLevel,
                      predictionTrend: trendDirection
                    });
                  }
                }}
              >
                <Popup>
                  <div className="min-w-[180px] space-y-1.5 text-sm">
                    <p className="font-semibold text-slate-900">{point.locationName}</p>
                    <p className={riskLabelClass(point.riskLevel)}>Risk level: {point.riskLevel}</p>
                    <p>Risk score: {Math.round(Number(point.averageRisk || 0) * 100)}%</p>
                    <p>Reports: {point.totalReports}</p>
                    <p>Trend: {trendDirection}</p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

          {selectedLocation?.latitude && selectedLocation?.longitude ? (
            <CircleMarker
              center={[selectedLocation.latitude, selectedLocation.longitude]}
              radius={9}
              pathOptions={{ color: "#2563eb", fillColor: "#38bdf8", fillOpacity: 0.8 }}
            >
              <Popup>
                <p className="text-sm font-semibold">Selected: {selectedLocation.locationName || "Custom point"}</p>
                <p className="text-xs text-slate-600">
                  {selectedLocation.latitude}, {selectedLocation.longitude}
                </p>
              </Popup>
            </CircleMarker>
          ) : null}
        </MapContainer>

        {enablePicker ? (
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow dark:bg-slate-900/85 dark:text-slate-200">
            Click map to pick coordinates
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/60 bg-white/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-300">
          English Labels
        </div>
      </div>
    </section>
  );
};

export default memo(RiskHeatmapMap);