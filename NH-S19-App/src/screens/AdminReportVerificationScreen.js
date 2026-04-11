import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../services/apiClient";

const ReportCard = ({ report, theme, styles, onConfirm, onReject }) => {
  const severityColor =
    report.severity === "high"
      ? theme.danger
      : report.severity === "medium"
      ? theme.warning
      : theme.success;

  return (
    <View style={[styles.reportCard, { borderColor: severityColor + "30" }]}>
      <View style={styles.reportHeader}>
        <View style={[styles.severityBadge, { backgroundColor: severityColor + "15" }]}>
          <Text style={[styles.severityText, { color: severityColor }]}>
            {report.severity?.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.reportId, { color: theme.textSoft }]}>
          #{String(report.id).slice(-6)}
        </Text>
      </View>

      <Text style={[styles.locationName, { color: theme.text }]}>{report.locationName}</Text>

      <View style={styles.reportInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={14} color={theme.textSoft} />
          <Text style={[styles.infoText, { color: theme.textSoft }]}>
            {report.reporterName}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="beaker-outline" size={14} color={theme.textSoft} />
          <Text style={[styles.infoText, { color: theme.textSoft }]}>
            {report.diseaseType}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="heart-outline" size={14} color={theme.textSoft} />
          <Text style={[styles.infoText, { color: theme.textSoft }]}>
            Risk: {report.aiRiskScore}/100
          </Text>
        </View>
      </View>

      <Text style={[styles.symptomsLabel, { color: theme.textSoft }]}>Symptoms</Text>
      <Text style={[styles.symptomsText, { color: theme.text }]}>
        {Array.isArray(report.symptoms) ? report.symptoms.join(", ") : report.symptoms || "None reported"}
      </Text>

      {report.notes && (
        <>
          <Text style={[styles.notesLabel, { color: theme.textSoft }]}>Notes</Text>
          <Text style={[styles.notesText, { color: theme.text }]}>{report.notes}</Text>
        </>
      )}

      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.btnReject, { borderColor: theme.danger }]}
          onPress={() => onReject(report)}
        >
          <Ionicons name="close-circle" size={16} color={theme.danger} />
          <Text style={[styles.btnText, { color: theme.danger }]}>Reject</Text>
        </Pressable>
        <Pressable
          style={[styles.btnConfirm, { backgroundColor: theme.success }]}
          onPress={() => onConfirm(report)}
        >
          <Ionicons name="checkmark-circle" size={16} color="#fff" />
          <Text style={[styles.btnTextConfirm]}>Confirm Zone</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default function AdminReportVerificationScreen({ theme }) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadPendingReports = useCallback(async () => {
    try {
      if (!loading) setLoading(true);
      const response = await apiClient.get("/reports/admin/pending", { timeoutMs: 8000 });
      setReports(response?.reports || []);
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to load pending reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPendingReports();
    } finally {
      setRefreshing(false);
    }
  }, [loadPendingReports]);

  useEffect(() => {
    loadPendingReports();
  }, [loadPendingReports]);

  const handleConfirmReport = useCallback(
    async (report) => {
      try {
        setConfirmLoading(true);
        await apiClient.post(`/reports/admin/${report.id}/confirm`, {}, { timeoutMs: 8000 });
        Alert.alert("Success", `Report confirmed! Danger zone created for ${report.locationName}.`);
        setReports((prev) => prev.filter((r) => r.id !== report.id));
      } catch (error) {
        Alert.alert("Error", error?.message || "Failed to confirm report.");
      } finally {
        setConfirmLoading(false);
      }
    },
    []
  );

  const handleRejectReportSubmit = useCallback(async () => {
    if (!selectedReport) return;

    if (!rejectReason.trim()) {
      Alert.alert("Required", "Please provide a rejection reason.");
      return;
    }

    try {
      setRejectLoading(true);
      await apiClient.post(
        `/reports/admin/${selectedReport.id}/reject`,
        { reason: rejectReason },
        { timeoutMs: 8000 }
      );
      Alert.alert("Success", "Report rejected.");
      setReports((prev) => prev.filter((r) => r.id !== selectedReport.id));
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedReport(null);
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to reject report.");
    } finally {
      setRejectLoading(false);
    }
  }, [selectedReport, rejectReason]);

  const handleOpenRejectModal = useCallback((report) => {
    setSelectedReport(report);
    setRejectReason("");
    setShowRejectModal(true);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.line }]}>
        <Text style={[styles.title, { color: theme.text }]}>Verify Reports</Text>
        <View style={[styles.badge, { backgroundColor: theme.brand + "15" }]}>
          <Text style={[styles.badgeText, { color: theme.brand }]}>{reports.length}</Text>
        </View>
      </View>

      {/* Report List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand} />
          <Text style={[styles.loadingText, { color: theme.textSoft }]}>Loading pending reports...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="checkmark-done-outline" size={48} color={theme.success + "50"} />
          <Text style={[styles.emptyText, { color: theme.text }]}>All reports verified!</Text>
          <Text style={[styles.emptySubText, { color: theme.textSoft }]}>
            No pending reports to review.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReportCard
              report={item}
              theme={theme}
              styles={styles}
              onConfirm={handleConfirmReport}
              onReject={handleOpenRejectModal}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.brand} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Reject Modal */}
      <Modal visible={showRejectModal} animationType="slide" transparent onRequestClose={() => setShowRejectModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.line }]}>
              <Pressable onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Reject Report</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedReport && (
                <>
                  <Text style={[styles.reportLocation, { color: theme.text }]}>
                    {selectedReport.locationName}
                  </Text>
                  <Text style={[styles.reportReporter, { color: theme.textSoft }]}>
                    Reporter: {selectedReport.reporterName}
                  </Text>

                  <Text style={[styles.reasonLabel, { color: theme.text }]}>Rejection Reason *</Text>
                  <TextInput
                    style={[styles.reasonInput, { borderColor: theme.line, color: theme.text }]}
                    placeholder="Why are you rejecting this report?"
                    placeholderTextColor={theme.textSoft}
                    value={rejectReason}
                    onChangeText={setRejectReason}
                    multiline
                    numberOfLines={4}
                  />
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.line }]}>
              <Pressable
                style={[styles.btnCancel, { borderColor: theme.line }]}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={[styles.btnCancelText, { color: theme.textSoft }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btnRejectSubmit, { backgroundColor: theme.danger, opacity: rejectLoading ? 0.7 : 1 }]}
                onPress={handleRejectReportSubmit}
                disabled={rejectLoading}
              >
                {rejectLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnRejectSubmitText}>Reject</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.line,
    },
    title: { fontSize: 20, fontWeight: "700", color: theme.text },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: theme.brand + "15" },
    badgeText: { fontSize: 12, fontWeight: "700", color: theme.brand },
    centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
    loadingText: { marginTop: 12, fontSize: 14, fontWeight: "500", color: theme.textSoft },
    emptyText: { fontSize: 18, fontWeight: "700", marginTop: 12, color: theme.text },
    emptySubText: { fontSize: 14, fontWeight: "500", marginTop: 6, color: theme.textSoft },
    listContent: { paddingHorizontal: 12, paddingVertical: 12 },
    reportCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.line,
      padding: 14,
      marginBottom: 12,
    },
    reportHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    severityText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
    reportId: { fontSize: 12, fontWeight: "600" },
    locationName: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
    reportInfo: { flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 10 },
    infoItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    infoText: { fontSize: 12, fontWeight: "500" },
    symptomsLabel: { fontSize: 11, fontWeight: "700", color: theme.textSoft, marginBottom: 4 },
    symptomsText: { fontSize: 13, fontWeight: "500", marginBottom: 8, lineHeight: 18 },
    notesLabel: { fontSize: 11, fontWeight: "700", color: theme.textSoft, marginBottom: 4, marginTop: 8 },
    notesText: { fontSize: 12, fontWeight: "500", marginBottom: 12, lineHeight: 17 },
    actionButtons: { flexDirection: "row", gap: 8 },
    btnReject: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8, borderWidth: 1.5 },
    btnConfirm: { flex: 1.2, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 8 },
    btnText: { fontSize: 13, fontWeight: "700", marginLeft: 4 },
    btnTextConfirm: { fontSize: 13, fontWeight: "700", color: "#fff", marginLeft: 4 },
    modalOverlay: { flex: 1, justifyContent: "flex-end" },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
      flexDirection: "column",
    },
    modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
    modalTitle: { fontSize: 16, fontWeight: "700" },
    modalBody: { paddingHorizontal: 16, paddingVertical: 16 },
    reportLocation: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
    reportReporter: { fontSize: 12, fontWeight: "500", marginBottom: 16 },
    reasonLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
    reasonInput: {
      borderRadius: 10,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      textAlignVertical: "top",
      marginBottom: 16,
    },
    modalFooter: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1 },
    btnCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
    btnCancelText: { fontSize: 13, fontWeight: "700" },
    btnRejectSubmit: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    btnRejectSubmitText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  });
