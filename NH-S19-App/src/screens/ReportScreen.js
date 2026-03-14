import { memo, useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReportForm from "../components/ReportForm";
import { apiClient } from "../services/apiClient";
import { fetchCurrentWeather } from "../services/weatherService";
import {
  areValidCoordinates,
  clampNumber,
  isValidEmail,
  normalizeEmail,
  parseNumber,
  sanitizeSymptoms,
  sanitizeText
} from "../utils/sanitize";

const DISEASE_TYPES = ["Dengue", "Malaria", "COVID-19", "Chikungunya", "Flu", "Unknown"];

const defaultFormData = {
  reporterName: "",
  reporterEmail: "",
  age: "",
  severity: "medium",
  diseaseType: "Unknown",
  symptoms: "",
  notes: "",
  locationName: "",
  latitude: "",
  longitude: ""
};

const validateForm = (formData) => {
  const nextErrors = {};
  if (!sanitizeText(formData.reporterName, 80)) nextErrors.reporterName = "Name is required.";
  if (!isValidEmail(formData.reporterEmail)) nextErrors.reporterEmail = "Enter a valid email address.";
  
  const age = parseNumber(formData.age);
  if (!Number.isFinite(age) || age < 1 || age > 120) nextErrors.age = "Age (1-120) required.";

  const diseaseType = sanitizeText(formData.diseaseType, 40);
  if (!DISEASE_TYPES.includes(diseaseType)) nextErrors.diseaseType = "Select a valid disease type.";
  
  const symptoms = sanitizeSymptoms(formData.symptoms);
  if (!symptoms.length) nextErrors.symptoms = "Add at least one symptom.";
  
  if (!sanitizeText(formData.locationName, 120)) nextErrors.locationName = "Location is required.";
  if (!areValidCoordinates(formData.latitude, formData.longitude)) {
    nextErrors.locationName = "Invalid coordinates. Use GPS or Map.";
  }
  return nextErrors;
};

const ReportScreen = ({
  theme,
  mapPoints,
  currentLocation,
  onDetectLocation,
  onPickManualLocation,
  appendAlert,
  onSubmitted,
  fallbackWeather
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryColor = theme.blue || theme.brand || "#007AFF";

  const [formData, setFormData] = useState(defaultFormData);
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lastReportId, setLastReportId] = useState("");
  const [submitSuccessText, setSubmitSuccessText] = useState("");
  const [weather, setWeather] = useState(fallbackWeather || null);

  // Sync with current location from props
  useEffect(() => {
    if (!currentLocation) return;
    setFormData((prev) => ({
      ...prev,
      locationName: currentLocation.locationName || prev.locationName,
      latitude: String(currentLocation.latitude || prev.latitude),
      longitude: String(currentLocation.longitude || prev.longitude)
    }));
  }, [currentLocation]);

  useEffect(() => {
    if (fallbackWeather) setWeather(fallbackWeather);
  }, [fallbackWeather]);

  const setField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (submitSuccessText) setSubmitSuccessText("");
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setSeverity = (severity) => setField("severity", String(severity || "medium").toLowerCase());
  const setDiseaseType = (diseaseType) => setField("diseaseType", sanitizeText(diseaseType, 40));

  const syncWeatherForLocation = async ({ latitude, longitude }) => {
    try {
      const weatherSnapshot = await fetchCurrentWeather(latitude, longitude);
      setWeather(weatherSnapshot);
    } catch { /* Silent fail */ }
  };

  const handleDetectLocation = async () => {
    try {
      if (typeof onDetectLocation !== "function") return;
      const detected = await onDetectLocation();
      if (!detected) return;

      setFormData((prev) => ({
        ...prev,
        locationName: detected.locationName || prev.locationName,
        latitude: String(detected.latitude || prev.latitude),
        longitude: String(detected.longitude || prev.longitude)
      }));
      await syncWeatherForLocation(detected);
    } catch (error) {
      Alert.alert("GPS Error", error?.message || "Unable to detect location.");
    }
  };

  const handleMapLocationPick = async ({ latitude, longitude }) => {
    const lat = parseNumber(latitude, NaN);
    const lon = parseNumber(longitude, NaN);
    if (!areValidCoordinates(lat, lon)) return;

    const locationName = `Pinned Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`;
    setFormData((prev) => ({
      ...prev,
      locationName,
      latitude: String(lat),
      longitude: String(lon)
    }));

    if (typeof onPickManualLocation === "function") {
      onPickManualLocation({ latitude: lat, longitude: lon, locationName });
    }
    await syncWeatherForLocation({ latitude: lat, longitude: lon });
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length) {
      Alert.alert("Validation Error", "Please check all required fields.");
      return;
    }

    const latitude = parseNumber(formData.latitude, NaN);
    const longitude = parseNumber(formData.longitude, NaN);

    try {
      setSubmitLoading(true);
      let weatherSnapshot = weather;
      if (!weatherSnapshot) {
        weatherSnapshot = await fetchCurrentWeather(latitude, longitude);
        setWeather(weatherSnapshot);
      }

      const payload = {
        reporterName: sanitizeText(formData.reporterName, 80),
        reporterEmail: normalizeEmail(formData.reporterEmail),
        age: clampNumber(parseNumber(formData.age, 0), 1, 120, 28),
        severity: sanitizeText(formData.severity || "medium", 12).toLowerCase(),
        diseaseType: sanitizeText(formData.diseaseType || "Unknown", 40),
        symptoms: sanitizeSymptoms(formData.symptoms),
        notes: sanitizeText(formData.notes, 320),
        locationName: sanitizeText(formData.locationName, 120),
        latitude,
        longitude,
        weather: {
          temperature: parseNumber(weatherSnapshot?.temperature, 30),
          humidity: parseNumber(weatherSnapshot?.humidity, 70),
          rainfall: parseNumber(weatherSnapshot?.rainfall, 120)
        }
      };

      const response = await apiClient.post("/report", payload);
      const reportId = response?.report?.id || response?.id || "REC-" + Date.now().toString().slice(-6);

      setLastReportId(String(reportId));
      setSubmitSuccessText(`Report #${reportId} submitted successfully.`);
      setErrors({});

      // Clear form after successful submit, but keep current live location context for the next report.
      setFormData({
        ...defaultFormData,
        locationName: currentLocation?.locationName || "",
        latitude: currentLocation?.latitude ? String(currentLocation.latitude) : "",
        longitude: currentLocation?.longitude ? String(currentLocation.longitude) : ""
      });

      if (typeof appendAlert === "function") {
        appendAlert({
          title: "New Report Logged",
          message: `Case reported at ${payload.locationName}. Visibility: ${payload.severity}.`,
          level: payload.severity,
          locationName: payload.locationName,
          source: "report"
        });
      }

      if (typeof onSubmitted === "function") onSubmitted(response);
      Alert.alert("Success", `Report ${reportId} has been submitted.`);
    } catch (error) {
      Alert.alert("Submit Failed", error?.message || "Connection error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      {/* 🚀 Smart Header Card */}
      <View style={styles.infoCard}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: primaryColor }]}>SECURE SUBMISSION</Text>
            <Text style={styles.infoTitle}>Case Reporting</Text>
          </View>
          <View style={styles.contextBadge}>
            <Ionicons name="cloud-done" size={14} color={theme.success || "#34C759"} />
            <Text style={styles.contextText}>{weather ? `${Math.round(weather.temperature)}°C` : 'Auto-Weather'}</Text>
          </View>
        </View>
        
        <Text style={styles.infoText}>
          Your report helps AI models predict local outbreaks. We automatically attach location and weather context.
        </Text>

        {submitSuccessText ? (
          <View style={[styles.successBadge, { backgroundColor: (theme.success || "#34C759") + '15', borderColor: (theme.success || "#34C759") + '30' }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success || "#34C759"} />
            <Text style={[styles.infoSuccess, { color: theme.success || "#34C759" }]}>
              {submitSuccessText}
            </Text>
          </View>
        ) : null}

        {lastReportId && !submitSuccessText ? (
          <View style={[styles.successBadge, { backgroundColor: (theme.success || "#34C759") + '15', borderColor: (theme.success || "#34C759") + '30' }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.success || "#34C759"} />
            <Text style={[styles.infoSuccess, { color: theme.success || "#34C759" }]}>Last Submission: #{lastReportId}</Text>
          </View>
        ) : null}
      </View>

      {/* 📝 The Actual Form Component */}
      <View style={styles.formContainer}>
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
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 130, // Extra space for keyboard and tab bar
      gap: 16
    },
    // Header Styling
    infoCard: {
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    },
    kicker: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 2
    },
    infoTitle: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    contextBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bg,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      gap: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    contextText: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    infoText: {
      marginTop: 8,
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500"
    },
    // Success State
    successBadge: {
      marginTop: 16,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      gap: 8
    },
    infoSuccess: {
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.2
    },
    // Form Wrapper
    formContainer: {
      backgroundColor: theme.card,
      borderRadius: 24,
      paddingVertical: 10, // Form internal padding handle karega
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
    }
  });

export default memo(ReportScreen);