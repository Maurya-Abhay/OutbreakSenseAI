import { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { request } from "../services/apiClient";

const formatDateTime = (value) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
};

const statusConfig = (report, theme) => {
  if (report?.isVerified) {
    return {
      label: "Closed",
      color: theme.success || "#10B981",
      icon: "checkmark-done-outline",
    };
  }

  return {
    label: "Applied",
    color: theme.warn || "#F59E0B",
    icon: "time-outline",
  };
};

function MyReportsScreen({ theme }) {
  const { user } = useContext(AuthContext);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  const email = String(user?.email || "").trim().toLowerCase();

  const loadReports = useCallback(async ({ silent = false } = {}) => {
    if (!email) {
      setError("Login email missing. Please login again.");
      setReports([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      setError("");
      const response = await request(`/reports/history?email=${encodeURIComponent(email)}`, {
        method: "GET",
        timeoutMs: 7000,
        maxCandidates: 2,
      });

      setReports(Array.isArray(response?.reports) ? response.reports : []);
    } catch (e) {
      setError(e?.payload?.message || e?.message || "Unable to load reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports({ silent: true });
  }, [loadReports]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brand} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.line }]}> 
        <Ionicons name="document-text-outline" size={18} color={theme.brand} />
        <Text style={[styles.infoTitle, { color: theme.text }]}>Your Submitted Reports</Text>
        <Text style={[styles.infoSub, { color: theme.textSoft }]}>Track which reports are reviewed and closed.</Text>
      </View>

      {loading ? (
        <View style={styles.centerBlock}>
          <ActivityIndicator size="small" color={theme.brand} />
          <Text style={[styles.helperText, { color: theme.textSoft }]}>Loading your reports...</Text>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={[styles.errorCard, { backgroundColor: theme.danger + "12", borderColor: theme.danger + "35" }]}>
          <Ionicons name="alert-circle-outline" size={16} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          <Pressable style={[styles.retryBtn, { borderColor: theme.danger }]} onPress={() => loadReports()}>
            <Text style={[styles.retryText, { color: theme.danger }]}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && reports.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.line }]}> 
          <Ionicons name="file-tray-outline" size={22} color={theme.textSoft} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No reports yet</Text>
          <Text style={[styles.emptySub, { color: theme.textSoft }]}>Go to Report tab and submit your first case.</Text>
        </View>
      ) : null}

      {!loading && !error && reports.length > 0
        ? reports.map((item) => {
            const status = statusConfig(item, theme);
            return (
              <View key={String(item.id)} style={[styles.reportCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
                <View style={styles.reportHead}>
                  <Text style={[styles.reportId, { color: theme.text }]}>#{String(item.id).slice(-6)}</Text>
                  <View style={[styles.statusPill, { backgroundColor: status.color + "15", borderColor: status.color + "35" }]}>
                    <Ionicons name={status.icon} size={12} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>

                <Text style={[styles.metaLine, { color: theme.text }]}>
                  {item.diseaseType || "Unknown"} • {(item.severity || "medium").toUpperCase()}
                </Text>

                <Text style={[styles.locationLine, { color: theme.textSoft }]} numberOfLines={2}>
                  {item.locationName || "Unknown location"}
                </Text>

                <Text style={[styles.timeLine, { color: theme.textMuted || theme.textSoft }]}>
                  Submitted: {formatDateTime(item.createdAt)}
                </Text>
              </View>
            );
          })
        : null}
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { padding: 16, paddingBottom: 120, gap: 12 },
    infoCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 4,
    },
    infoTitle: { fontSize: 15, fontWeight: "700" },
    infoSub: { fontSize: 12, fontWeight: "500" },
    centerBlock: { alignItems: "center", justifyContent: "center", paddingVertical: 22, gap: 8 },
    helperText: { fontSize: 12, fontWeight: "600" },
    errorCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      gap: 8,
    },
    errorText: { fontSize: 12, fontWeight: "700" },
    retryBtn: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    retryText: { fontSize: 12, fontWeight: "700" },
    emptyCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 18,
      alignItems: "center",
      gap: 6,
    },
    emptyTitle: { fontSize: 15, fontWeight: "700" },
    emptySub: { fontSize: 12, fontWeight: "500", textAlign: "center" },
    reportCard: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 8,
    },
    reportHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    reportId: { fontSize: 14, fontWeight: "800", letterSpacing: 0.3 },
    statusPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    statusText: { fontSize: 11, fontWeight: "800" },
    metaLine: { fontSize: 13, fontWeight: "700" },
    locationLine: { fontSize: 12, fontWeight: "500" },
    timeLine: { fontSize: 11, fontWeight: "600" },
  });

export default memo(MyReportsScreen);