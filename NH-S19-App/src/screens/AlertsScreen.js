import { memo, useMemo } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AlertItem from "../components/AlertItem";

const AlertsScreen = ({
  theme,
  alertsFeed,
  unreadAlerts,
  mapLoading,
  onMarkAllRead,
  onClearAlerts,
  onRefreshAlerts,
  isOffline,
  usingCachedData
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryColor = theme.blue || theme.brand || "#007AFF";

  return (
    <ScrollView 
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      {/* ⚠️ Native Style Banners */}
      {isOffline && (
        <View style={styles.bannerOffline}>
          <View style={styles.bannerIconWrapWarning}>
            <Ionicons name="cloud-offline" size={16} color={theme.warn || "#FF9500"} />
          </View>
          <Text style={styles.bannerText}>Offline mode active. Showing saved feed.</Text>
        </View>
      )}

      {/* 📊 Premium Header Card */}
      <View style={styles.headCard}>
        <View style={styles.headTop}>
          <View>
            <Text style={[styles.kicker, { color: primaryColor }]}>COMMUNITY SIGNALS</Text>
            <Text style={styles.title}>Alerts Center</Text>
          </View>
          <View style={[styles.pulseContainer, { backgroundColor: isOffline ? theme.line : '#34C75920' }]}>
            <View style={[styles.pulseDot, { backgroundColor: isOffline ? theme.textMuted : '#34C759' }]} />
            <Text style={[styles.pulseText, { color: isOffline ? theme.textSoft : '#34C759' }]}>
              {isOffline ? "Offline" : "Live Feed"}
            </Text>
          </View>
        </View>
        
        <Text style={styles.subtitle}>
          Realtime outbreak signals, citizen reports, and AI risk updates.
        </Text>

        {/* Improved Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{alertsFeed.length}</Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: unreadAlerts > 0 ? theme.danger + '15' : theme.brandSoft }]}>
            <Text style={[styles.statLabel, unreadAlerts > 0 && { color: theme.danger }]}>New</Text>
            <Text style={[styles.statValue, unreadAlerts > 0 && { color: theme.danger }]}>{unreadAlerts}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Sync</Text>
            <Ionicons name={isOffline ? "cloud-offline" : "cloud-done"} size={14} color={theme.textSoft} style={{ marginTop: 2 }} />
          </View>
        </View>

        {/* Premium Action Row */}
        <View style={styles.actionRow}>
          <Pressable onPress={onMarkAllRead} style={[styles.btn, styles.btnGhost]}>
            <Ionicons name="checkmark-done" size={16} color={theme.text} style={styles.btnIcon} />
            <Text style={styles.btnGhostText}>Read All</Text>
          </Pressable>
          
          <Pressable onPress={onClearAlerts} style={[styles.btn, styles.btnGhost]}>
            <Ionicons name="trash-outline" size={16} color={theme.text} style={styles.btnIcon} />
            <Text style={styles.btnGhostText}>Clear</Text>
          </Pressable>

          <Pressable onPress={onRefreshAlerts} style={[styles.btn, styles.btnSolid, { backgroundColor: primaryColor }]}>
            {mapLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="sync" size={16} color="#FFFFFF" style={styles.btnIcon} />
                <Text style={styles.btnSolidText}>Refresh</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* 🔔 Alert Feed List */}
      <View style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <Ionicons name="list" size={18} color={theme.textSoft} />
          <Text style={styles.feedTitle}>Recent Updates</Text>
        </View>

        {!alertsFeed.length ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.line} />
            <Text style={styles.empty}>All quiet for now. No alerts to show.</Text>
          </View>
        ) : null}

        <View style={styles.listContainer}>
          {alertsFeed.map((alert, index) => (
            <AlertItem 
              key={alert.id} 
              theme={theme} 
              alert={alert} 
              isLast={index === alertsFeed.length - 1} 
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 120, // Tab bar safety space
      gap: 16
    },
    // Banners (Same as Home for consistency)
    bannerOffline: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.warn || "#FF9500",
    },
    bannerIconWrapWarning: {
      backgroundColor: (theme.warn || "#FF9500") + '20',
      padding: 6,
      borderRadius: 8
    },
    bannerText: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      fontWeight: "600"
    },

    // Head Card
    headCard: {
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
    headTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8
    },
    kicker: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.5,
      marginBottom: 2
    },
    title: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    subtitle: {
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 20,
      fontWeight: "500"
    },
    
    // Pulse Indicator
    pulseContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      gap: 6
    },
    pulseDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    pulseText: {
      fontSize: 11,
      fontWeight: "700",
      textTransform: 'uppercase'
    },

    // Stats
    statsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 20
    },
    statPill: {
      flex: 1,
      backgroundColor: theme.bg,
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    statLabel: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "700",
      textTransform: 'uppercase',
      marginBottom: 4
    },
    statValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800"
    },

    // Actions
    actionRow: {
      flexDirection: "row",
      gap: 8
    },
    btn: {
      flex: 1,
      minHeight: 46,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: "center",
      justifyContent: "center",
    },
    btnIcon: {
      marginRight: 6
    },
    btnGhost: {
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.line
    },
    btnSolid: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2
    },
    btnGhostText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "700"
    },
    btnSolidText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700"
    },

    // Feed Section
    feedCard: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
    },
    feedHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16
    },
    feedTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: -0.3
    },
    listContainer: {
      marginTop: 4
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 12
    },
    empty: {
      color: theme.textSoft,
      fontSize: 14,
      fontWeight: "500",
      textAlign: 'center'
    }
  });

export default memo(AlertsScreen);