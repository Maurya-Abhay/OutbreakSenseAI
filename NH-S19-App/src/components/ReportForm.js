import { memo, useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HeatmapMap from "./HeatmapMap";

const Field = ({ theme, styles, label, value, onChangeText, placeholder, keyboardType = "default", multiline = false, error, icon }) => (
  <View style={styles.fieldWrap}>
    <View style={styles.labelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {error && <Ionicons name="alert-circle" size={14} color={theme.danger} />}
    </View>
    <View style={[styles.inputContainer, error ? styles.inputError : null]}>
      {icon && <Ionicons name={icon} size={18} color={theme.textMuted} style={styles.inputIcon} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline ? styles.inputMulti : null]}
        cursorColor={theme.blue}
      />
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
  weather
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryColor = theme.blue || "#007AFF";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Submit Health Report</Text>
        <Text style={styles.subtitle}>Help your community by reporting local cases with GPS precision.</Text>
      </View>

      {/* 👤 Reporter Info Section */}
      <View style={styles.section}>
        <Field
          theme={theme}
          styles={styles}
          label="Reporter Name"
          icon="person-outline"
          value={formData.reporterName}
          onChangeText={(value) => onChangeField("reporterName", value)}
          placeholder="e.g. Rahul Sharma"
          error={errors.reporterName}
        />

        <Field
          theme={theme}
          styles={styles}
          label="Email Address"
          icon="mail-outline"
          value={formData.reporterEmail}
          onChangeText={(value) => onChangeField("reporterEmail", value)}
          keyboardType="email-address"
          placeholder="rahul@example.com"
          error={errors.reporterEmail}
        />

        <View style={styles.row}>
          <View style={styles.colSmall}>
            <Field
              theme={theme}
              styles={styles}
              label="Age"
              value={String(formData.age || "")}
              onChangeText={(value) => onChangeField("age", value)}
              keyboardType="number-pad"
              placeholder="28"
              error={errors.age}
            />
          </View>
          <View style={styles.colLarge}>
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
        </View>

        <View style={styles.fieldWrap}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>Disease Type</Text>
            {errors.diseaseType && <Ionicons name="alert-circle" size={14} color={theme.danger} />}
          </View>
          <View style={styles.diseaseTypeRow}>
            {(diseaseTypes || []).map((disease) => {
              const active = formData.diseaseType === disease;
              return (
                <Pressable
                  key={disease}
                  onPress={() => onDiseaseTypeChange(disease)}
                  style={[
                    styles.diseaseChip,
                    active && {
                      borderColor: primaryColor,
                      backgroundColor: primaryColor + "15"
                    }
                  ]}
                >
                  <Text style={[styles.diseaseText, active && { color: primaryColor }]}>{disease}</Text>
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
          <View>
            <Text style={styles.fieldLabel}>Event Location</Text>
            <Text style={styles.locationDesc}>{formData.locationName || "Detecting address..."}</Text>
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
      padding: 4 // Parent container handle karega outer padding
    },
    header: {
      marginBottom: 20,
    },
    title: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    subtitle: {
      marginTop: 4,
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 18
    },
    section: {
      marginBottom: 24,
      gap: 16
    },
    // Field Styling
    fieldWrap: {
      width: '100%'
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    fieldLabel: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.2
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.line,
      borderRadius: 14,
      backgroundColor: theme.inputBg || theme.bg,
      paddingHorizontal: 12,
    },
    inputIcon: {
      marginRight: 10
    },
    input: {
      flex: 1,
      color: theme.text,
      fontSize: 15,
      fontWeight: '600',
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    },
    inputMulti: {
      minHeight: 100,
      textAlignVertical: "top",
      paddingTop: 12
    },
    inputError: {
      borderColor: theme.danger,
    },
    errorText: {
      marginTop: 6,
      color: theme.danger,
      fontSize: 12,
      fontWeight: "700"
    },
    // Severity Chips
    row: {
      flexDirection: "row",
      gap: 12
    },
    colSmall: { flex: 0.8 },
    colLarge: { flex: 2 },
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
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.card,
    },
    severityText: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase"
    },
    diseaseChip: {
      minWidth: "30%",
      height: 40,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.line,
      backgroundColor: theme.card
    },
    diseaseText: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: "800"
    },
    // Location & Weather
    locationHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 12
    },
    locationDesc: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
      maxWidth: '80%'
    },
    gpsBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.bg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.line
    },
    gpsText: {
      color: theme.blue,
      fontSize: 12,
      fontWeight: "800"
    },
    weatherBadge: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
      padding: 10,
      backgroundColor: theme.cardElevated || theme.bg,
      borderRadius: 12,
      alignSelf: 'flex-start',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    weatherItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
    },
    weatherValue: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text
    },
    mapContainer: {
      borderRadius: 20,
      overflow: 'hidden'
    },
    // Submit Button
    submitBtn: {
      marginTop: 10,
      borderRadius: 16,
      height: 56,
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
        android: { elevation: 4 }
      })
    },
    submitDisabled: {
      opacity: 0.6
    },
    submitText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
      letterSpacing: 0.5
    }
  });

export default memo(ReportForm);