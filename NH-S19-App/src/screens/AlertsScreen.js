import { memo, useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AlertItem from "../components/AlertItem";

const StatPill = ({ label, value, accent, theme, styles }) => (
  <View
    style={[
      styles.statPill,
      { borderColor: accent ? accent + "40" : theme.line, backgroundColor: accent ? accent + "10" : theme.cardElevated },
    ]}
  >
    <Text style={[styles.statLabel, { color: accent || theme.textSoft }]}>{label}</Text>
    <Text style={[styles.statValue, { color: accent || theme.text }]}>{value}</Text>
  </View>
);

const AlertsScreen = ({
  theme,
  alertsFeed,
  unreadAlerts,
  mapLoading,
  onMarkAllRead,
  onClearAlerts,
  onRefreshAlerts,
  isOffline,
  usingCachedData,
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const brand  = theme.brand   || "#3182ce";
  const warn   = theme.warning || "#dd6b20";
  const danger = theme.danger  || "#e53e3e";

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Banner */}
      {isOffline && (
        <View style={[styles.banner, { borderColor: warn + "50" }]}>
          <View style={[styles.bannerIconWrap, { backgroundColor: warn + "18" }]}>
            <Ionicons name="cloud-offline-outline" size={15} color={warn} />
          </View>
          <Text style={[styles.bannerText, { color: theme.text }]}>
            Offline mode — showing saved feed.
          </Text>
        </View>
      )}

      {/* Header Card */}
      <View style={[styles.headCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.headTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: brand }]}>COMMUNITY SIGNALS</Text>
            <Text style={[styles.title, { color: theme.text }]}>Alerts Center</Text>
          </View>
          <View
            style={[
              styles.livePill,
              {
                backgroundColor: isOffline ? theme.cardElevated : brand + "12",
                borderColor:     isOffline ? theme.line         : brand + "35",
              },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: isOffline ? theme.textSoft : brand }]} />
            <Text style={[styles.liveText, { color: isOffline ? theme.textSoft : brand }]}>
              {isOffline ? "Offline" : "Live"}
            </Text>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: theme.textSoft }]}>
          Realtime outbreak signals, citizen reports, and AI risk updates.
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatPill label="Total"  value={String(alertsFeed.length)} theme={theme} styles={styles} />
          <StatPill
            label="Unread"
            value={String(unreadAlerts)}
            accent={unreadAlerts > 0 ? danger : undefined}
            theme={theme}
            styles={styles}
          />
          <StatPill
            label="Status"
            value={isOffline ? "Cached" : "Synced"}
            accent={isOffline ? warn : undefined}
            theme={theme}
            styles={styles}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={onMarkAllRead}
            style={[styles.btn, styles.btnGhost]}
          >
            <Ionicons name="checkmark-done-outline" size={15} color={theme.text} />
            <Text style={[styles.btnText, { color: theme.text }]}>Read All</Text>
          </Pressable>

          <Pressable
            onPress={onClearAlerts}
            style={[styles.btn, styles.btnGhost]}
          >
            <Ionicons name="trash-outline" size={15} color={theme.text} />
            <Text style={[styles.btnText, { color: theme.text }]}>Clear</Text>
          </Pressable>

          <Pressable
            onPress={onRefreshAlerts}
            style={[styles.btn, styles.btnSolid, { backgroundColor: brand }]}
          >
            {mapLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="sync-outline" size={15} color="#fff" />
                <Text style={[styles.btnText, { color: "#fff" }]}>Refresh</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Feed Card */}
      <View style={[styles.feedCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.feedHeader}>
          <View style={[styles.feedIconWrap, { backgroundColor: theme.cardElevated }]}>
            <Ionicons name="list-outline" size={15} color={theme.textSoft} />
          </View>
          <Text style={[styles.feedTitle, { color: theme.text }]}>Recent Updates</Text>
          {alertsFeed.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: brand + "15", borderColor: brand + "30" }]}>
              <Text style={[styles.countBadgeText, { color: brand }]}>{alertsFeed.length}</Text>
            </View>
          )}
        </View>

        {alertsFeed.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={36} color={theme.textSoft} />
            <Text style={[styles.emptyText, { color: theme.textSoft }]}>
              All quiet. No alerts to show.
            </Text>
          </View>
        ) : (
          <View>
            {alertsFeed.map((alert, index) => (
              <AlertItem
                key={alert.id}
                theme={theme}
                alert={alert}
                isLast={index === alertsFeed.length - 1}
              />
            ))}
          </View>
        )}
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

    // Banner
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    bannerIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    bannerText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "500",
    },

    // Head Card
    headCard: {
      borderRadius: 22,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 14 },
        android: { elevation: 4 },
      }),
    },
    headTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    kicker: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "400",
      marginBottom: 16,
    },
    livePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    liveText: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.3,
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    statPill: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      gap: 4,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3,
    },

    // Buttons
    actionRow: {
      flexDirection: "row",
      gap: 8,
    },
    btn: {
      flex: 1,
      height: 46,
      borderRadius: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: theme.line,
      backgroundColor: theme.cardElevated,
    },
    btnSolid: {
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
        android: { elevation: 4 },
      }),
    },
    btnText: {
      fontSize: 13,
      fontWeight: "700",
    },

    // Feed Card
    feedCard: {
      borderRadius: 22,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
        android: { elevation: 3 },
      }),
    },
    feedHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 14,
    },
    feedIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    feedTitle: {
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: -0.3,
      flex: 1,
    },
    countBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
    },
    countBadgeText: {
      fontSize: 11,
      fontWeight: "700",
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 30,
      gap: 10,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: "400",
      textAlign: "center",
    },
  });

export default memo(AlertsScreen);