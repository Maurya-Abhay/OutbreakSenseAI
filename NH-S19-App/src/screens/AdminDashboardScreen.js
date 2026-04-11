import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "../services/apiClient";

const StatCard = ({ icon, label, value, color, theme, styles }) => (
  <View style={[styles.statCard, { backgroundColor: theme.cardElevated || theme.card, borderColor: theme.line }]}>
    <View style={[styles.statIcon, { backgroundColor: color + "18" }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.statValue, { color: theme.text }]}>{value !== undefined ? value : "—"}</Text>
      <Text style={[styles.statLabel, { color: theme.textSoft }]}>{label}</Text>
    </View>
  </View>
);

const QuickActionCard = ({ theme, title, subtitle, icon, color, styles, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionCard,
      { 
        backgroundColor: theme.cardElevated || theme.card, 
        borderColor: theme.line,
        opacity: pressed ? 0.7 : 1 
      }
    ]}
  >
    <View style={[styles.actionIcon, { backgroundColor: color + "15" }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.actionTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.actionSubtitle, { color: theme.textSoft }]}>{subtitle}</Text>
    </View>
    <View style={[styles.actionChevron, { backgroundColor: theme.bg }]}>
      <Ionicons name="chevron-forward" size={16} color={theme.textSoft} />
    </View>
  </Pressable>
);

export default function AdminDashboardScreen({ theme, onNavigate }) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Fallback colors in case theme properties are missing
  const brand = theme.brand || "#3182ce";
  const danger = theme.danger || "#e53e3e";
  const warning = theme.warning || "#dd6b20";
  const info = theme.info || "#319795";
  const success = theme.success || "#38a169";

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/dashboard", { timeoutMs: 8000 });
      
      setStats({
        pendingReports: response?.pendingReports || 0,
        activeDangerZones: response?.activeDangerZones || 0,
        totalUsers: response?.totalUsers || 0,
        alertsThisWeek: response?.alertsThisWeek || 0,
        lastUpdate: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to load admin dashboard:", error);
      // Fallback: show placeholder data
      setStats({
        pendingReports: 0,
        activeDangerZones: 0,
        totalUsers: 0,
        alertsThisWeek: 0,
        lastUpdate: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading && !stats) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={brand} />
        <Text style={{ marginTop: 12, color: theme.textSoft, fontSize: 13, fontWeight: "500" }}>
          Loading System Data...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greet, { color: theme.textSoft }]}>Admin Panel</Text>
            <Text style={[styles.title, { color: theme.text }]}>System Overview</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: success + "15", borderColor: success + "30" }]}>
            <View style={[styles.dot, { backgroundColor: success }]} />
            <Text style={[styles.badgeText, { color: success }]}>Live</Text>
          </View>
        </View>

        {/* Key Stats Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Metrics</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="document-text"
              label="Pending Reports"
              value={stats?.pendingReports}
              color={warning}
              theme={theme}
              styles={styles}
            />
            <StatCard
              icon="warning"
              label="Danger Zones"
              value={stats?.activeDangerZones}
              color={danger}
              theme={theme}
              styles={styles}
            />
            <StatCard
              icon="people"
              label="Total Users"
              value={stats?.totalUsers}
              color={info}
              theme={theme}
              styles={styles}
            />
            <StatCard
              icon="notifications"
              label="Alerts This Week"
              value={stats?.alertsThisWeek}
              color={brand}
              theme={theme}
              styles={styles}
            />
          </View>
        </View>

        {/* Quick Actions List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
          
          <QuickActionCard
            theme={theme}
            title="Verify Reports"
            subtitle={`${stats?.pendingReports || 0} pending verification`}
            icon="document-attach"
            color={warning}
            styles={styles}
            onPress={() => onNavigate && onNavigate("Reports")}
          />
          <QuickActionCard
            theme={theme}
            title="Manage Zones"
            subtitle={`${stats?.activeDangerZones || 0} active zones`}
            icon="map"
            color={danger}
            styles={styles}
            onPress={() => onNavigate && onNavigate("Zones")}
          />
          <QuickActionCard
            theme={theme}
            title="System Analytics"
            subtitle="View all reports & trends"
            icon="bar-chart-outline"
            color={brand}
            styles={styles}
            onPress={() => onNavigate && onNavigate("Panel")}
          />
          <QuickActionCard
            theme={theme}
            title="Advanced Settings"
            subtitle="Admin preferences"
            icon="settings"
            color={theme.textSoft}
            styles={styles}
            onPress={() => onNavigate && onNavigate("Panel")}
          />
        </View>

        {/* Activity Section */}
        {stats?.lastUpdate && (
          <View style={[styles.lastUpdatedContainer]}>
            <Ionicons name="time-outline" size={14} color={theme.textSoft} />
            <Text style={[styles.updatedText, { color: theme.textSoft }]}>
              Last synced: {new Date(stats.lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { 
      flex: 1, 
    },
    scroll: { 
      flex: 1, 
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
      marginTop: 10,
    },
    greet: { 
      fontSize: 13, 
      fontWeight: "600", 
      marginBottom: 4,
      letterSpacing: 0.5,
      textTransform: "uppercase"
    },
    title: { 
      fontSize: 26, 
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    badge: { 
      paddingHorizontal: 10, 
      paddingVertical: 6, 
      borderRadius: 20, 
      borderWidth: 1,
      flexDirection: "row", 
      alignItems: "center", 
      gap: 6 
    },
    dot: { 
      width: 6, 
      height: 6, 
      borderRadius: 3 
    },
    badgeText: { 
      fontSize: 12, 
      fontWeight: "700" 
    },
    section: { 
      marginBottom: 28 
    },
    sectionTitle: { 
      fontSize: 16, 
      fontWeight: "800", 
      marginBottom: 16,
      letterSpacing: -0.3,
    },
    
    // Grid Setup
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
    },
    statCard: {
      width: "48%", // 2 columns
      padding: 16,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
        android: { elevation: 2 },
      }),
    },
    statIcon: { 
      width: 42, 
      height: 42, 
      borderRadius: 12, 
      justifyContent: "center", 
      alignItems: "center" 
    },
    statValue: { 
      fontSize: 22, 
      fontWeight: "800",
      marginBottom: 2,
      letterSpacing: -0.5,
    },
    statLabel: { 
      fontSize: 12, 
      fontWeight: "600" 
    },

    // Action Cards
    actionCard: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 14,
      ...Platform.select({
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
        android: { elevation: 1 },
      }),
    },
    actionIcon: { 
      width: 44, 
      height: 44, 
      borderRadius: 12, 
      justifyContent: "center", 
      alignItems: "center" 
    },
    actionTitle: { 
      fontSize: 15, 
      fontWeight: "700", 
      marginBottom: 3 
    },
    actionSubtitle: { 
      fontSize: 12, 
      fontWeight: "500" 
    },
    actionChevron: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },

    // Footer
    lastUpdatedContainer: { 
      flexDirection: "row", 
      alignItems: "center", 
      justifyContent: "center",
      gap: 6,
      marginTop: 10,
    },
    updatedText: { 
      fontSize: 12, 
      fontWeight: "500" 
    },
  });