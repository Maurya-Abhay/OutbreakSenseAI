import { memo, useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeatmapMap from "./HeatmapMap";
import { diseaseConfig } from "../utils/constants";

const Field = ({ theme, styles, label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, error, icon, editable = true }) => (
  <View style={styles.fieldWrap}>
    <View style={styles.labelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {error && <Ionicons name="alert-circle" size={14} color={theme.danger} />}
    </View>
    <View style={[styles.inputContainer, !editable ? styles.inputDisabled : null, error ? styles.inputError : null]}>
      {icon && <Ionicons name={icon} size={18} color={theme.textMuted} style={styles.inputIcon} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={editable}
        selectTextOnFocus={editable}
        style={[styles.input, multiline ? styles.inputMulti : null]}
        cursorColor={theme.blue}
      />
      {!editable && <Ionicons name="lock-closed" size={14} color={theme.textMuted} />}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const ReportForm = ({
  theme,
  formData,
  errors,
  diseaseTypes,
  onChangeField,
  onSeverityChange,
  onDiseaseTypeChange,
  onDetectLocation,
  onPickMapLocation,
  onSubmit,
  submitLoading,
  mapPoints,
  currentLocation,
  weather,
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryColor = theme.blue || "#007AFF";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Submit Health Report</Text>
        <Text style={styles.subtitle}>Help your community by reporting local cases with GPS precision.</Text>
      </View>

      {/* Report Details Section */}
      <View style={styles.section}>
        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Severity Level</Text>
          <View style={styles.severityRow}>
            {["low", "medium", "high"].map((sev) => {
              const active = formData.severity === sev;
              const sevColor = sev === 'high' ? theme.danger : sev === 'medium' ? theme.warn : theme.success;
              return (
                <Pressable
                  key={sev}
                  onPress={() => onSeverityChange(sev)}
                  style={[
                    styles.severityChip,
                    active && { borderColor: sevColor, backgroundColor: sevColor + '15' }
                  ]}
                >
                  <Text style={[styles.severityText, active && { color: sevColor }]}>{sev}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldWrap}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Disease Type</Text>
            {errors.diseaseType && <Ionicons name="alert-circle" size={14} color={theme.danger} />}
          </View>
          <View style={styles.diseaseTypeRow}>
            {(diseaseTypes || []).map((disease) => {
              const active = formData.diseaseType === disease;
              const config = diseaseConfig[disease] || diseaseConfig["Unknown"];
              return (
                <Pressable
                  key={disease}
                  onPress={() => onDiseaseTypeChange(disease)}
                  style={[
                    styles.diseaseChip,
                    active && {
                      borderColor: config.color,
                      backgroundColor: config.color + "15"
                    }
                  ]}
                >
                  <Ionicons 
                    name={config.icon} 
                    size={16} 
                    color={active ? config.color : theme.textMuted}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.diseaseText, active && { color: config.color, fontWeight: "700" }]}>
                    {disease}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.diseaseType ? <Text style={styles.errorText}>{errors.diseaseType}</Text> : null}
        </View>
      </View>

      {/* 🤒 Symptoms Section */}
      <View style={styles.section}>
        <Field
          theme={theme}
          styles={styles}
          label="Primary Symptoms"
          icon="thermometer-outline"
          value={formData.symptoms}
          onChangeText={(value) => onChangeField("symptoms", value)}
          placeholder="fever, headache, chills..."
          error={errors.symptoms}
        />

        <Field
          theme={theme}
          styles={styles}
          label="Additional Observations"
          value={formData.notes}
          onChangeText={(value) => onChangeField("notes", value)}
          placeholder="Any other details that might help..."
          multiline
        />
      </View>

      {/* 📍 Location & Weather Section */}
      <View style={styles.section}>
        <View style={styles.locationHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Event Location</Text>
            <Text style={styles.locationDesc} numberOfLines={3}>{formData.locationName || "Detecting address..."}</Text>
            <Text style={[styles.debugText, { marginTop: 4, fontSize: 10, color: theme.textSoft }]}>
              📍 {formData.latitude}, {formData.longitude}
            </Text>
          </View>
          <Pressable onPress={onDetectLocation} style={styles.gpsBtn}>
            <Ionicons name="locate" size={14} color={primaryColor} />
            <Text style={styles.gpsText}>GPS</Text>
          </Pressable>
        </View>

        {weather && (
          <View style={styles.weatherBadge}>
            <View style={styles.weatherItem}>
              <Ionicons name="thermometer" size={12} color={theme.textSoft} />
              <Text style={styles.weatherValue}>{Math.round(weather.temperature)}°C</Text>
            </View>
            <View style={styles.weatherItem}>
              <Ionicons name="water" size={12} color={theme.textSoft} />
              <Text style={styles.weatherValue}>{Math.round(weather.humidity)}%</Text>
            </View>
            <View style={styles.weatherItem}>
              <Ionicons name="rainy" size={12} color={theme.textSoft} />
              <Text style={styles.weatherValue}>{Math.round(weather.rainfall)}mm</Text>
            </View>
          </View>
        )}

        <View style={styles.mapContainer}>
          <HeatmapMap
            theme={theme}
            points={mapPoints}
            currentLocation={currentLocation}
            selectedPoint={null}
            onSelectPoint={() => {}}
            onPickLocation={onPickMapLocation}
            enableLocationPicker
          />
          {errors.locationName && <Text style={styles.errorText}>{errors.locationName}</Text>}
        </View>
      </View>

      {/* 🚀 Submit Action */}
      <Pressable 
        onPress={onSubmit} 
        disabled={submitLoading} 
        style={({ pressed }) => [
          styles.submitBtn, 
          { backgroundColor: primaryColor },
          (pressed || submitLoading) && styles.submitDisabled
        ]}
      >
        {submitLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.submitText}>Transmit Secure Report</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFF" />
          </>
        )}
      </Pressable>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      padding: 6
    },
    header: {
      marginBottom: 24,
      paddingHorizontal: 20
    },
    title: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.6
    },
    subtitle: {
      marginTop: 6,
      color: theme.textSoft,
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0.2
    },
    section: {
      marginBottom: 28,
      paddingHorizontal: 20,
      gap: 18
    },
    // Field Styling
    fieldWrap: {
      width: '100%'
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    },
    fieldLabel: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0.3,
      textTransform: 'uppercase'
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.line,
      borderRadius: 16,
      backgroundColor: theme.inputBg || theme.bg,
      paddingHorizontal: 14,
    },
    inputDisabled: {
      opacity: 0.85,
      backgroundColor: theme.cardElevated || theme.bg,
    },
    inputIcon: {
      marginRight: 12
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
      paddingVertical: Platform.OS === 'ios' ? 16 : 12,
      letterSpacing: 0.1
    },
    inputMulti: {
      minHeight: 110,
      textAlignVertical: "top",
      paddingTop: 14
    },
    inputError: {
      borderColor: theme.danger,
      borderWidth: 2
    },
    errorText: {
      marginTop: 8,
      color: theme.danger,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.2
    },
    // Severity Chips
    severityRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8
    },
    diseaseTypeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8
    },
    severityChip: {
      flex: 1,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.card,
    },
    severityText: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
      letterSpacing: 0.4
    },
    diseaseChip: {
      minWidth: "31%",
      minHeight: 48,
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.card
    },
    diseaseText: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "800",
      textAlign: "center",
      letterSpacing: 0.2
    },
    // Location & Weather
    locationHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 14,
      paddingHorizontal: 20
    },
    locationDesc: {
      color: theme.textSoft,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 4,
      maxWidth: '80%',
      letterSpacing: 0.1
    },
    gpsBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.bg,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.line
    },
    gpsText: {
      color: theme.blue,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.3
    },
    weatherBadge: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 18,
      padding: 12,
      backgroundColor: theme.cardElevated || theme.bg,
      borderRadius: 14,
      alignSelf: 'flex-start',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    weatherItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6
    },
    weatherValue: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: 0.1
    },
    mapContainer: {
      borderRadius: 22,
      overflow: 'hidden',
      height: 240,
      marginHorizontal: 20
    },
    // Submit Button
    submitBtn: {
      marginTop: 14,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 18,
      height: 58,
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12 },
        android: { elevation: 5 }
      })
    },
    submitDisabled: {
      opacity: 0.6
    },
    submitText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: 'uppercase'
    },
  });

export default memo(ReportForm);