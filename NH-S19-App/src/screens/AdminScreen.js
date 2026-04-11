import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { request } from "../services/apiClient";

const TABS = [
  { id: "dashboard", icon: "grid-outline" },
  { id: "analytics", icon: "bar-chart-outline" },
  { id: "zones", icon: "map-outline" },
  { id: "users", icon: "people-outline" },
  { id: "reports", icon: "document-text-outline" },
  { id: "alerts", icon: "warning-outline" },
  { id: "subscriptions", icon: "notifications-outline" },
  { id: "settings", icon: "settings-outline" }
];

// Badge Component for statuses
const StatusBadge = ({ label, color, theme }) => (
  <View style={[styles.badge, { backgroundColor: color + "15", borderColor: color + "40" }]}>
    <Text style={[styles.badgeTxt, { color }]}>{label}</Text>
  </View>
);

const StatCard = ({ icon, title, value, sub, theme }) => (
  <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
    <View style={[styles.statIcon, { backgroundColor: theme.brand + "15" }]}>
      <Ionicons name={icon} size={20} color={theme.brand} />
    </View>
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: theme.textSoft }]}>{title}</Text>
      {sub ? <Text style={[styles.statSub, { color: theme.textSoft }]}>{sub}</Text> : null}
    </View>
  </View>
);

const ActionBtn = ({ label, onPress, color, theme, danger }) => (
  <Pressable
    style={[
      styles.actionBtn,
      {
        borderColor: color + "40",
        backgroundColor: danger ? color + "12" : theme.cardElevated
      }
    ]}
    onPress={onPress}
  >
    <Text style={[styles.actionBtnTxt, { color }]}>{label}</Text>
  </Pressable>
);

export default function AdminScreen({ theme }) {
  const { user, getAuthHeaders } = useContext(AuthContext);
  const [tab, setTab] = useState("dashboard");

  const [stats, setStats] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [exportingFormat, setExportingFormat] = useState(null);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...getAuthHeaders()
  }), [getAuthHeaders]);

  // API Calls remain exactly the same
  const loadDashboard = useCallback(async () => {
    try {
      const data = await request("/admin/system/stats", { method: "GET", headers, timeoutMs: 8000, maxCandidates: 2 });
      setStats(data);
    } catch (error) {
      console.log("Dashboard data not available:", error.message);
    }
  }, [headers]);

  const loadDashboardSummary = useCallback(async () => {
    try {
      const data = await request("/admin/dashboard/stats", { method: "GET", headers, timeoutMs: 8000, maxCandidates: 2 });
      setDashboardData(data);
    } catch (error) {
      console.log("Dashboard summary not available, using basic stats");
    }
  }, [headers]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await request("/admin/users?limit=50", { method: "GET", headers, timeoutMs: 8000, maxCandidates: 2 });
      setUsers(data.users || []);
    } finally { setUsersLoading(false); }
  }, [headers]);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const data = await request("/admin/reports?limit=50", { method: "GET", headers, timeoutMs: 9000, maxCandidates: 2 });
      setReports(data.reports || []);
    } finally { setReportsLoading(false); }
  }, [headers]);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const data = await request("/admin/alerts?includeResolved=true", { method: "GET", headers, timeoutMs: 8000, maxCandidates: 2 });
      setAlerts(data.alerts || []);
    } finally { setAlertsLoading(false); }
  }, [headers]);

  const loadZones = useCallback(async () => {
    setZonesLoading(true);
    try {
      const data = await request("/admin/dashboard/stats", { method: "GET", headers, timeoutMs: 8000, maxCandidates: 2 });
      setZones(data.regionBreakdown || []);
    } catch (error) { console.log("Zones data not available"); } 
    finally { setZonesLoading(false); }
  }, [headers]);

  const loadSubscriptions = useCallback(async () => {
    setSubscriptionsLoading(true);
    try {
      const data = await request("/admin/subscriptions?limit=50", { method: "GET", headers, timeoutMs: 8000, maxCandidates: 2 });
      setSubscriptions(data.subscriptions || []);
    } finally { setSubscriptionsLoading(false); }
  }, [headers]);

  const reloadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadDashboard(), loadDashboardSummary(), loadUsers(),
        loadReports(), loadAlerts(), loadZones(), loadSubscriptions()
      ]);
    } catch (error) {
      Alert.alert("Refresh Failed", error?.payload?.message || error?.message || "Unable to refresh admin data.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [loadDashboard, loadDashboardSummary, loadUsers, loadReports, loadAlerts, loadZones, loadSubscriptions]);

  useEffect(() => { reloadAll(); }, [reloadAll]);

  useEffect(() => {
    if (tab === "users" && users.length === 0 && !usersLoading) loadUsers().catch(() => {});
    if (tab === "reports" && reports.length === 0 && !reportsLoading) loadReports().catch(() => {});
    if (tab === "alerts" && alerts.length === 0 && !alertsLoading) loadAlerts().catch(() => {});
    if (tab === "zones" && zones.length === 0 && !zonesLoading) loadZones().catch(() => {});
    if (tab === "subscriptions" && subscriptions.length === 0 && !subscriptionsLoading) loadSubscriptions().catch(() => {});
  }, [tab, users.length, reports.length, alerts.length, zones.length, subscriptions.length, usersLoading, reportsLoading, alertsLoading, zonesLoading, subscriptionsLoading, loadUsers, loadReports, loadAlerts, loadZones, loadSubscriptions]);

  const performUserAction = useCallback(async (targetUser, action) => {
    const targetId = targetUser.id;
    setBusyId(targetId);
    try {
      if (action === "ban") await request(`/admin/users/${targetId}/ban`, { method: "POST", headers, body: { reason: "Policy violation" } });
      if (action === "unban") await request(`/admin/users/${targetId}/unban`, { method: "POST", headers });
      if (action === "grant") await request(`/admin/users/${targetId}/grant-admin`, { method: "POST", headers });
      if (action === "revoke") await request(`/admin/users/${targetId}/revoke-admin`, { method: "POST", headers });
      if (action === "delete") await request(`/admin/users/${targetId}`, { method: "DELETE", headers });

      await Promise.all([loadUsers(), loadDashboard()]);
      Alert.alert("Success", "Action completed.");
    } catch (error) {
      Alert.alert("Action Failed", error?.payload?.message || error?.message || "Could not complete action.");
    } finally { setBusyId(null); }
  }, [headers, loadUsers, loadDashboard]);

  const onUserActionPress = useCallback((targetUser, action) => {
    const actionLabel = { ban: "Ban user", unban: "Unban user", grant: "Grant admin", revoke: "Revoke admin", delete: "Delete user" }[action];
    Alert.alert(actionLabel, `Are you sure you want to ${actionLabel?.toLowerCase()} for ${targetUser.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: action === "delete" ? "destructive" : "default", onPress: () => performUserAction(targetUser, action) }
    ]);
  }, [performUserAction]);

  const toggleVerify = useCallback(async (report) => {
    setBusyId(report.id);
    try {
      await request(`/admin/reports/${report.id}/verify`, { method: "PATCH", headers, body: { verified: !report.isVerified } });
      await Promise.all([loadReports(), loadDashboard()]);
    } catch (error) { Alert.alert("Update Failed", error?.payload?.message || error?.message || "Unable to update report status."); } 
    finally { setBusyId(null); }
  }, [headers, loadReports, loadDashboard]);

  const resolveAlertItem = useCallback(async (alertId) => {
    setBusyId(alertId);
    try {
      await request(`/admin/alerts/${alertId}/resolve`, { method: "PATCH", headers });
      await Promise.all([loadAlerts(), loadDashboard()]);
    } catch (error) { Alert.alert("Resolve Failed", error?.payload?.message || error?.message || "Unable to resolve alert."); } 
    finally { setBusyId(null); }
  }, [headers, loadAlerts, loadDashboard]);

  const triggerExport = useCallback((format) => {
    setExportingFormat(format);
    Alert.alert("Start Export", `Download reports as ${format.toUpperCase()}?`, [
      { text: "Cancel", style: "cancel", onPress: () => setExportingFormat(null) },
      {
        text: "Download",
        onPress: async () => {
          try {
            const endpoint = format === "csv" ? "/admin/export/csv" : "/admin/export/pdf";
            await request(endpoint, { method: "GET", headers, timeoutMs: 15000, maxCandidates: 2, responseType: "blob" });
            Alert.alert("Success", `Export ${format.toUpperCase()} generated. Check your downloads folder.`);
          } catch (error) { Alert.alert("Export Failed", error?.payload?.message || error?.message || `Could not generate ${format.toUpperCase()} export.`); } 
          finally { setExportingFormat(null); }
        }
      }
    ]);
  }, [headers]);

  if (!user || user.role !== "admin") {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <Ionicons name="lock-closed-outline" size={54} color={theme.danger} />
        <Text style={[styles.blockTitle, { color: theme.text }]}>Admin Access Required</Text>
        <Text style={[styles.blockSub, { color: theme.textSoft }]}>Login with an admin account to continue.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reloadAll} tintColor={theme.brand} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Header */}
      <View style={[styles.hero, { backgroundColor: theme.brand }]}>
        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name="shield-checkmark" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroKick, { color: "rgba(255,255,255,0.8)" }]}>ADMIN WORKSPACE</Text>
            <Text style={[styles.heroTitle, { color: "#fff" }]}>Operations Control</Text>
          </View>
        </View>
      </View>

      {/* Horizontal Scrollable Tabs */}
      <View style={{ marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((item) => {
            const isActive = tab === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={[
                  styles.tabBtn,
                  { backgroundColor: isActive ? theme.brand : theme.cardElevated, borderColor: isActive ? theme.brand : theme.line }
                ]}
              >
                <Ionicons name={item.icon} size={16} color={isActive ? "#fff" : theme.textSoft} style={{ marginRight: 6 }} />
                <Text style={[styles.tabTxt, { color: isActive ? "#fff" : theme.textSoft }]}>
                  {item.id.charAt(0).toUpperCase() + item.id.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading && (
        <View style={styles.centerPad}>
          <ActivityIndicator size="large" color={theme.brand} />
          <Text style={{ color: theme.textSoft, marginTop: 12 }}>Loading systems...</Text>
        </View>
      )}

      {/* Diffs: Dashboard stats are now in a clean grid */}
      {!loading && tab === "dashboard" && stats && (
        <View style={styles.grid}>
          <StatCard icon="people" title="Total Users" value={String(stats.users?.total || 0)} sub={`${stats.users?.admins || 0} admins`} theme={theme} />
          <StatCard icon="document-text" title="Total Reports" value={String(stats.reports?.total || 0)} sub={`${stats.reports?.pendingVerification || 0} pending`} theme={theme} />
          <StatCard icon="alert-circle" title="Active Alerts" value={String(stats.alerts?.active || 0)} theme={theme} />
          <StatCard icon="pulse" title="System Status" value={String(stats.health?.status || "unknown").toUpperCase()} sub={new Date(stats.health?.timestamp || Date.now()).toLocaleTimeString()} theme={theme} />
          
          {stats.users?.newThisWeek !== undefined && <StatCard icon="person-add" title="New Users (Wk)" value={String(stats.users?.newThisWeek || 0)} theme={theme} />}
          {stats.reports?.verifiedCount !== undefined && <StatCard icon="checkmark-circle" title="Verified Reports" value={String(stats.reports?.verifiedCount || 0)} theme={theme} />}
        </View>
      )}

      {!loading && tab === "analytics" && (
        <View style={styles.stack}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <View style={styles.rowBetween}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>📊 Disease Breakdown</Text>
            </View>
            <Text style={[styles.cardSub, { color: theme.textSoft, marginBottom: 8 }]}>Top 5 reported issues</Text>
            {dashboardData?.diseaseBreakdown?.slice(0, 5).map((item, idx) => (
              <View key={idx} style={styles.analyticsRow}>
                <Text style={[styles.analyticLabel, { color: theme.text }]}>{item.diseaseType || "Unknown"}</Text>
                <StatusBadge label={`${item.totalReports} reports`} color={theme.brand} theme={theme} />
              </View>
            ))}
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>🗺️ High-Risk Zones</Text>
            <Text style={[styles.cardSub, { color: theme.textSoft, marginBottom: 8 }]}>Regional trends</Text>
            {dashboardData?.regionBreakdown?.slice(0, 5).map((region, idx) => (
              <View key={idx} style={styles.analyticsRow}>
                <Text style={[styles.analyticLabel, { color: theme.text, flex: 1 }]} numberOfLines={1}>{region.locationName || "Unknown"}</Text>
                <StatusBadge 
                  label={`${(region.avgRiskScore * 100).toFixed(0)}% risk`} 
                  color={region.avgRiskScore > 0.6 ? theme.danger : theme.warning} 
                  theme={theme} 
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {!loading && tab === "zones" && (
        <View style={styles.stack}>
          {zonesLoading ? <ActivityIndicator size="small" color={theme.brand} /> : 
           (zones && zones.length > 0 ? zones.map((zone, idx) => (
            <View key={idx} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{zone.locationName || `Zone ${idx + 1}`}</Text>
                  <Text style={[styles.meta, { color: theme.textSoft }]}>Total Reports: {zone.totalReports || 0}</Text>
                </View>
                <StatusBadge 
                  label={`Risk: ${(zone.avgRiskScore * 100).toFixed(1)}%`} 
                  color={zone.avgRiskScore > 0.6 ? theme.danger : theme.warning} 
                  theme={theme} 
                />
              </View>
            </View>
          )) : <Text style={[styles.centerText, { color: theme.textSoft }]}>No geographic zones data available</Text>)}
        </View>
      )}

      {!loading && tab === "users" && (
        <View style={styles.stack}>
          {usersLoading ? <ActivityIndicator size="small" color={theme.brand} /> : users.map((u) => (
            <View key={u.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{u.name}</Text>
                  <Text style={[styles.cardSub, { color: theme.textSoft }]} numberOfLines={1}>{u.email}</Text>
                </View>
                {busyId === u.id ? <ActivityIndicator size="small" color={theme.brand} /> : null}
              </View>
              
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
                <StatusBadge label={u.role.toUpperCase()} color={u.role === 'admin' ? theme.brand : theme.textSoft} theme={theme} />
                <StatusBadge label={u.isBanned ? "BANNED" : "ACTIVE"} color={u.isBanned ? theme.danger : theme.success} theme={theme} />
              </View>

              <View style={styles.actionsWrap}>
                {u.isBanned ? <ActionBtn label="Unban" color={theme.success} theme={theme} onPress={() => onUserActionPress(u, "unban")} />
                            : <ActionBtn label="Ban" color={theme.warning} theme={theme} onPress={() => onUserActionPress(u, "ban")} />}
                {u.role === "admin" ? <ActionBtn label="Revoke Admin" color={theme.warning} theme={theme} onPress={() => onUserActionPress(u, "revoke")} />
                                    : <ActionBtn label="Make Admin" color={theme.brand} theme={theme} onPress={() => onUserActionPress(u, "grant")} />}
                <ActionBtn label="Delete" color={theme.danger} theme={theme} danger onPress={() => onUserActionPress(u, "delete")} />
              </View>
            </View>
          ))}
        </View>
      )}

      {!loading && tab === "reports" && (
        <View style={styles.stack}>
          {reportsLoading ? <ActivityIndicator size="small" color={theme.brand} /> : reports.map((r) => (
            <View key={r.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{r.locationName || "Unknown location"}</Text>
                  <Text style={[styles.cardSub, { color: theme.textSoft }]}>{r.diseaseType} • Severity: {r.severity}</Text>
                </View>
                {busyId === r.id ? <ActivityIndicator size="small" color={theme.brand} /> : null}
              </View>
              
              <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8 }}>
                <StatusBadge label={r.isVerified ? "VERIFIED" : "PENDING"} color={r.isVerified ? theme.success : theme.warning} theme={theme} />
              </View>

              <ActionBtn
                label={r.isVerified ? "Mark as Pending" : "Verify Report"}
                color={r.isVerified ? theme.warning : theme.success}
                theme={theme}
                onPress={() => toggleVerify(r)}
              />
            </View>
          ))}
        </View>
      )}

      {!loading && tab === "alerts" && (
        <View style={styles.stack}>
          {alertsLoading ? <ActivityIndicator size="small" color={theme.brand} /> : alerts.map((a) => (
            <View key={a._id || a.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{a.title || "Alert"}</Text>
                  <Text style={[styles.meta, { color: theme.textSoft, marginTop: 4 }]} numberOfLines={2}>{a.message || "No message"}</Text>
                </View>
                {busyId === (a._id || a.id) ? <ActivityIndicator size="small" color={theme.brand} /> : null}
              </View>

              <View style={{ flexDirection: 'row', marginVertical: 8 }}>
                <StatusBadge label={a.isActive ? "ACTIVE" : "RESOLVED"} color={a.isActive ? theme.danger : theme.success} theme={theme} />
              </View>

              {a.isActive && (
                <ActionBtn label="Mark as Resolved" color={theme.success} theme={theme} onPress={() => resolveAlertItem(a._id || a.id)} />
              )}
            </View>
          ))}
        </View>
      )}

      {!loading && tab === "subscriptions" && (
        <View style={styles.stack}>
          {subscriptionsLoading ? <ActivityIndicator size="small" color={theme.brand} /> : 
           (subscriptions && subscriptions.length > 0 ? subscriptions.map((sub) => (
            <View key={sub._id || sub.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{sub.email || "Subscription"}</Text>
                  <Text style={[styles.cardSub, { color: theme.textSoft, marginTop: 2 }]}>📍 {sub.locationName || "All Locations"}</Text>
                </View>
                <StatusBadge label={sub.isActive ? "ACTIVE" : "INACTIVE"} color={sub.isActive ? theme.success : theme.textSoft} theme={theme} />
              </View>
              <Text style={[styles.meta, { color: theme.textSoft, marginTop: 8 }]}>
                Disease: {sub.diseaseType || "All"}  |  Min Risk: {sub.minRiskLevel || "All"}
              </Text>
            </View>
          )) : <Text style={[styles.centerText, { color: theme.textSoft }]}>No alert subscriptions found</Text>)}
        </View>
      )}

      {!loading && tab === "settings" && (
        <View style={styles.stack}>
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>📥 Export Data</Text>
            <Text style={[styles.cardSub, { color: theme.textSoft, marginTop: 4, marginBottom: 12 }]}>Download all reports for external analysis</Text>
            <View style={styles.actionsWrap}>
              <ActionBtn label={exportingFormat === "csv" ? "Exporting..." : "Export to CSV"} color={theme.brand} theme={theme} onPress={() => triggerExport("csv")} />
              <ActionBtn label={exportingFormat === "pdf" ? "Exporting..." : "Export to PDF"} color={theme.danger} theme={theme} onPress={() => triggerExport("pdf")} />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 8 }]}>🔐 Admin Credentials</Text>
            <View style={styles.analyticsRow}>
              <Text style={[styles.analyticLabel, { color: theme.textSoft }]}>Email</Text>
              <Text style={[styles.analyticValue, { color: theme.text }]}>{user?.email || "Unknown"}</Text>
            </View>
            <View style={styles.analyticsRow}>
              <Text style={[styles.analyticLabel, { color: theme.textSoft }]}>Role</Text>
              <Text style={[styles.analyticValue, { color: theme.text }]}>{user?.role || "admin"}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, gap: 12 },
  centerPad: { paddingVertical: 40, alignItems: "center" },
  blockTitle: { fontSize: 22, fontWeight: "800" },
  blockSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  hero: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
      android: { elevation: 6 }
    })
  },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  heroKick: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 2 },
  heroTitle: { fontSize: 20, fontWeight: "800" },

  tabScroll: { paddingBottom: 6, gap: 10 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabTxt: { fontSize: 13, fontWeight: "700" },

  stack: { gap: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },

  statCard: {
    width: '48%', 
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 }
    })
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statTitle: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statSub: { fontSize: 11, marginTop: 4 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 }
    })
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 2 },
  centerText: { fontSize: 14, textAlign: "center", paddingVertical: 20 },

  analyticsRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 10, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: "rgba(0,0,0,0.05)" 
  },
  analyticLabel: { fontSize: 13, fontWeight: "600" },
  analyticValue: { fontSize: 14, fontWeight: "800" },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start"
  },
  badgeTxt: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  actionsWrap: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 8 },
  actionBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1
  },
  actionBtnTxt: { fontSize: 12, fontWeight: "700" }
});