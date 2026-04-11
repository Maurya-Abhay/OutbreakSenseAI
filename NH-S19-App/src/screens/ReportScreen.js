import { memo, useContext, useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReportForm from "../components/ReportForm";
import { apiClient } from "../services/apiClient";
import { fetchCurrentWeather } from "../services/weatherService";
import { AuthContext } from "../context/AuthContext";
import { getEmailPreferences } from "../services/emailPreferencesService";
import {
  areValidCoordinates,
  normalizeEmail,
  parseNumber,
  sanitizeSymptoms,
  sanitizeText,
} from "../utils/sanitize";

const DISEASE_TYPES = ["Dengue", "Malaria", "COVID-19", "Chikungunya", "Flu", "Unknown"];

const defaultFormData = {
  reporterName: "",
  reporterEmail: "",
  severity: "medium",
  diseaseType: "Unknown",
  symptoms: "",
  notes: "",
  locationName: "",
  latitude: "",
  longitude: "",
  sendConfirmationEmail: true,
};

const getUserPrefill = (user) => {
  const reporterName = sanitizeText(
    user?.name || user?.fullName || user?.username || "",
    80
  );
  const reporterEmail = normalizeEmail(
    sanitizeText(user?.email || "", 120)
  );

  return { reporterName, reporterEmail };
};

const validateForm = (formData) => {
  const errors = {};
  if (!DISEASE_TYPES.includes(sanitizeText(formData.diseaseType, 40)))
                                                       errors.diseaseType   = "Select a valid disease type.";
  if (!sanitizeSymptoms(formData.symptoms).length)     errors.symptoms      = "Add at least one symptom.";
  if (!sanitizeText(formData.locationName, 120))       errors.locationName  = "Location is required.";
  if (!areValidCoordinates(formData.latitude, formData.longitude))
                                                       errors.locationName  = "Invalid coordinates. Use GPS or Map.";
  return errors;
};

const ReportScreen = ({
  theme,
  mapPoints,
  currentLocation,
  onDetectLocation,
  onPickManualLocation,
  appendAlert,
  onSubmitted,
  fallbackWeather,
}) => {
  const { user } = useContext(AuthContext);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const brand   = theme.brand   || "#3182ce";
  const success = theme.success || "#2f855a";
  const userPrefill = useMemo(() => getUserPrefill(user), [user]);

  const [formData, setFormData]             = useState(() => ({ ...defaultFormData, ...getUserPrefill(user) }));
  const [errors, setErrors]                 = useState({});
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [lastReportId, setLastReportId]     = useState("");
  const [successText, setSuccessText]       = useState("");
  const [weather, setWeather]               = useState(fallbackWeather || null);
  const [weatherSyncError, setWeatherSyncError] = useState(null);

  // Sync location from props
  useEffect(() => {
    if (!currentLocation) return;
    setFormData((prev) => ({
      ...prev,
      locationName: currentLocation.locationName || prev.locationName,
      latitude:     String(currentLocation.latitude  || prev.latitude),
      longitude:    String(currentLocation.longitude || prev.longitude),
    }));
  }, [currentLocation]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      reporterName: userPrefill.reporterName || prev.reporterName,
      reporterEmail: userPrefill.reporterEmail || prev.reporterEmail,
    }));
  }, [userPrefill]);

  useEffect(() => {
    if (fallbackWeather) setWeather(fallbackWeather);
  }, [fallbackWeather]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (successText)    setSuccessText("");
    if (errors[field])  setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setSeverity    = (val) => setField("severity",    String(val || "medium").toLowerCase());
  const setDiseaseType = (val) => setField("diseaseType", sanitizeText(val, 40));

  const syncWeather = async ({ latitude, longitude }) => {
    try {
      setWeatherSyncError(null);
      const snap = await fetchCurrentWeather(latitude, longitude);
      setWeather(snap);
    } catch (e) {
      const errorMsg = e?.message || "Could not fetch weather data";
      console.error("[ReportScreen] Weather sync failed:", errorMsg);
      setWeatherSyncError(errorMsg);
      // Still allow report submission with fallback weather
    }
  };

  const handleDetectLocation = async () => {
    try {
      if (typeof onDetectLocation !== "function") return;
      const detected = await onDetectLocation();
      if (!detected) return;
      setFormData((prev) => ({
        ...prev,
        locationName: detected.locationName || prev.locationName,
        latitude:     String(detected.latitude  || prev.latitude),
        longitude:    String(detected.longitude || prev.longitude),
      }));
      await syncWeather(detected);
    } catch (e) {
      Alert.alert("GPS Error", e?.message || "Unable to detect location.");
    }
  };

  const handleMapLocationPick = async ({ latitude, longitude }) => {
    const lat = parseNumber(latitude,  NaN);
    const lon = parseNumber(longitude, NaN);
    if (!areValidCoordinates(lat, lon)) return;
    const locationName = `Pinned Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
    setFormData((prev) => ({ ...prev, locationName, latitude: String(lat), longitude: String(lon) }));
    if (typeof onPickManualLocation === "function") onPickManualLocation({ latitude: lat, longitude: lon, locationName });
    await syncWeather({ latitude: lat, longitude: lon });
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      Alert.alert("Validation Error", "Please check all required fields.");
      return;
    }

    const latitude  = parseNumber(formData.latitude,  NaN);
    const longitude = parseNumber(formData.longitude, NaN);

    try {
      setSubmitLoading(true);
      const fallbackSnap = {
        temperature: parseNumber(weather?.temperature ?? fallbackWeather?.temperature, 30),
        humidity: parseNumber(weather?.humidity ?? fallbackWeather?.humidity, 70),
        rainfall: parseNumber(weather?.rainfall ?? fallbackWeather?.rainfall, 0),
      };

      let snap = { ...fallbackSnap };

      if (!weather) {
        try {
          // Keep submit responsive: weather fetch should never block report transmission for long.
          const weatherResult = await Promise.race([
            fetchCurrentWeather(latitude, longitude),
            new Promise((resolve) => setTimeout(() => resolve(null), 1500)),
          ]);

          if (weatherResult) {
            snap = {
              temperature: parseNumber(weatherResult.temperature, fallbackSnap.temperature),
              humidity: parseNumber(weatherResult.humidity, fallbackSnap.humidity),
              rainfall: parseNumber(weatherResult.rainfall, fallbackSnap.rainfall),
            };
            setWeather(weatherResult);
          }
        } catch {
          // Fall back silently; submission should continue.
        }
      }

      const resolvedReporterName =
        sanitizeText(userPrefill.reporterName || formData.reporterName, 80) || "Anonymous";
      const resolvedReporterEmail =
        normalizeEmail(userPrefill.reporterEmail || formData.reporterEmail) || "anonymous@local.invalid";

      const payload = {
        reporterName:  resolvedReporterName,
        reporterEmail: resolvedReporterEmail,
        severity:      sanitizeText(formData.severity || "medium", 12).toLowerCase(),
        diseaseType:   sanitizeText(formData.diseaseType || "Unknown", 40),
        symptoms:      sanitizeSymptoms(formData.symptoms),
        notes:         sanitizeText(formData.notes, 320),
        locationName:  sanitizeText(formData.locationName, 120),
        latitude,
        longitude,
        sendConfirmationEmail: formData.sendConfirmationEmail === true,
        weather: {
          temperature: parseNumber(snap?.temperature, 30),
          humidity:    parseNumber(snap?.humidity,    70),
          rainfall:    parseNumber(snap?.rainfall,   120),
        },
      };

      const response = await apiClient.post("/report", payload, {
        timeoutMs: 6000,
        maxCandidates: 2,
      });
      const reportId = response?.report?.id || response?.id || "REC-" + Date.now().toString().slice(-6);

      setLastReportId(String(reportId));
      setSuccessText(`Report #${reportId} submitted successfully.`);
      setErrors({});
      setFormData({
        ...defaultFormData,
        ...userPrefill,
        locationName: currentLocation?.locationName || "",
        latitude:     currentLocation?.latitude  ? String(currentLocation.latitude)  : "",
        longitude:    currentLocation?.longitude ? String(currentLocation.longitude) : "",
      });

      if (typeof appendAlert === "function") {
        appendAlert({
          title:        "New Report Logged",
          message:      `Case reported at ${payload.locationName}.`,
          level:        payload.severity,
          locationName: payload.locationName,
          source:       "report",
        });
      }

      if (typeof onSubmitted === "function") onSubmitted(response);
      Alert.alert("Success", `Report ${reportId} has been submitted.`);
    } catch (e) {
      Alert.alert("Submit Failed", e?.message || "Connection error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: brand }]}>SECURE SUBMISSION</Text>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Case Reporting</Text>
          </View>
          <View style={[styles.weatherBadge, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
            <Ionicons name="cloud-done-outline" size={13} color={success} />
            <Text style={[styles.weatherText, { color: theme.text }]}>
              {weather ? `${Math.round(weather.temperature)}°C` : "Auto-Weather"}
            </Text>
          </View>
        </View>

        <Text style={[styles.headerSub, { color: theme.textSoft }]}>
          Your report helps AI models predict local outbreaks. Location and weather are attached automatically.
        </Text>

        {/* Success Badge */}
        {(successText || (!successText && lastReportId)) && (
          <View style={[styles.successBadge, { backgroundColor: success + "12", borderColor: success + "30" }]}>
            <Ionicons name="checkmark-circle" size={15} color={success} />
            <Text style={[styles.successText, { color: success }]}>
              {successText || `Last submission: #${lastReportId}`}
            </Text>
          </View>
        )}

        {/* Weather Error Badge */}
        {weatherSyncError && (
          <View style={[styles.warningBadge, { backgroundColor: theme.warning + "12", borderColor: theme.warning + "30" }]}>
            <Ionicons name="warning-outline" size={15} color={theme.warning || "#F59E0B"} />
            <Text style={[styles.warningText, { color: theme.warning || "#F59E0B" }]}>
              Weather: {weatherSyncError}. Report can still be submitted.
            </Text>
          </View>
        )}
      </View>

      {/* Form Card */}
      <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <ReportForm
          theme={theme}
          formData={formData}
          errors={errors}
          diseaseTypes={DISEASE_TYPES}
          onChangeField={setField}
          onSeverityChange={setSeverity}
          onDiseaseTypeChange={setDiseaseType}
          onDetectLocation={handleDetectLocation}
          onPickMapLocation={handleMapLocationPick}
          onSubmit={handleSubmit}
          submitLoading={submitLoading}
          mapPoints={mapPoints}
          currentLocation={currentLocation}
          weather={weather}
        />
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

    // Header Card
    headerCard: {
      borderRadius: 22,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
        android: { elevation: 4 },
      }),
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    kicker: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    weatherBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 11,
      borderWidth: StyleSheet.hairlineWidth,
    },
    weatherText: {
      fontSize: 13,
      fontWeight: "700",
    },
    headerSub: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "400",
      marginBottom: 4,
    },
    successBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 14,
      padding: 12,
      borderRadius: 13,
      borderWidth: 1,
    },
    successText: {
      fontSize: 13,
      fontWeight: "700",
      flex: 1,
    },
    warningBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      padding: 10,
      borderRadius: 11,
      borderWidth: 1,
    },
    warningText: {
      fontSize: 12,
      fontWeight: "600",
      flex: 1,
    },

    // Form Card
    formCard: {
      borderRadius: 22,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
        android: { elevation: 4 },
      }),
    },
  });

export default memo(ReportScreen);