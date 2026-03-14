import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { formatPercent } from "../../utils/formatters";
import { useTheme } from "../../hooks/useTheme";

const DEFAULT_CENTER = [23.8103, 90.4125];

const levelToColor = (level) => {
  if (level === "High") return "#ef4444";
  if (level === "Medium") return "#f59e0b";
  return "#22c55e";
};

const HeatLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) {
      return undefined;
    }

    const heatPoints = points.map((point) => [point.latitude, point.longitude, point.intensity / 100]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius: 36,
      blur: 24,
      minOpacity: 0.4,
      gradient: {
        0.2: "#22c55e",
        0.52: "#f59e0b",
        0.82: "#ef4444"
      }
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
};

const FitToPoints = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) {
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
  }, [map, points]);

  return null;
};

const RiskHeatmapMap = ({
  points = [],
  loading = false,
  title = "Disease Outbreak Heatmap",
  subtitle = "Tap any region to inspect confidence, cases, and trend.",
  className = ""
}) => {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [showMap, setShowMap] = useState(false);
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

  useEffect(() => {
    if (loading) {
      setShowMap(false);
      return;
    }

    const timer = setTimeout(() => setShowMap(true), 260);
    return () => clearTimeout(timer);
  }, [loading, points.length]);

  const center = useMemo(() => {
    if (!points.length) return DEFAULT_CENTER;
    return [points[0].latitude, points[0].longitude];
  }, [points]);

  const activePoint = selectedPoint || points[0];

  return (
    <section className={`saas-panel p-4 md:p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="saas-heading">{title}</h3>
          <p className="saas-muted mt-1">{subtitle}</p>
        </div>
        <div className="saas-chip rounded-xl px-3 py-1 text-xs font-semibold">
          {points.length} monitored zones
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/85 dark:border-slate-700/80">
        <AnimatePresence>
          {!showMap ? (
            <motion.div
              key="map-loading"
              className="absolute inset-0 z-20 bg-gradient-to-br from-sky-100/75 via-white/85 to-teal-50/70 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex h-full items-center justify-center">
                <div className="relative h-28 w-28">
                  <span className="absolute inset-0 animate-ping rounded-full border border-brand-primary/50" />
                  <span className="absolute inset-4 animate-ping rounded-full border border-brand-teal/60 [animation-delay:220ms]" />
                  <span className="absolute inset-8 rounded-full bg-brand-primary/30" />
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <MapContainer center={center} zoom={11} scrollWheelZoom className="h-[360px] w-full" zoomControl>
          <TileLayer attribution={tileConfig.attribution} url={tileConfig.url} maxZoom={19} />
          <FitToPoints points={points} />
          <HeatLayer points={points} />
          {points.map((point) => (
            <CircleMarker
              key={`${point.locationName}-${point.latitude}-${point.longitude}`}
              center={[point.latitude, point.longitude]}
              radius={8}
              pathOptions={{ color: levelToColor(point.riskLevel), fillOpacity: 0.92 }}
              eventHandlers={{
                click: () => setSelectedPoint(point)
              }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{point.locationName}</p>
                  <p>Risk level: {point.riskLevel}</p>
                  <p>Predicted score: {formatPercent(point.averageRisk)}</p>
                  <p>Reports: {point.totalReports}</p>
                  <p>Trend: {point.predictionTrend || "Stable"}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-white/60 bg-white/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-300">
          English Labels
        </div>
      </div>

      {activePoint ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 grid gap-3 rounded-2xl border border-slate-200/85 bg-white/78 p-4 dark:border-slate-700/80 dark:bg-slate-900/72 md:grid-cols-4"
        >
          <div>
            <p className="saas-muted text-xs">Region</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activePoint.locationName}</p>
          </div>
          <div>
            <p className="saas-muted text-xs">Risk Level</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: levelToColor(activePoint.riskLevel) }}>
              {activePoint.riskLevel}
            </p>
          </div>
          <div>
            <p className="saas-muted text-xs">Reports</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activePoint.totalReports}</p>
          </div>
          <div>
            <p className="saas-muted text-xs">Prediction Trend</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {activePoint.predictionTrend || "Stable"}
            </p>
          </div>
        </motion.div>
      ) : null}
    </section>
  );
};

export default RiskHeatmapMap;
