import { memo, useMemo } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TipsScreen = ({ theme, tips, tipsLoading, onRefreshTips, isOffline, usingCachedData }) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const primaryColor = theme.blue || theme.brand || "#007AFF";

  return (
    <ScrollView 
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      {/* 🛠️ Status Banners */}
      {isOffline && (
        <View style={styles.bannerOffline}>
          <View style={styles.bannerIconWrapWarning}>
            <Ionicons name="cloud-offline" size={16} color={theme.warn || "#FF9500"} />
          </View>
          <Text style={styles.bannerText}>Offline mode. Showing saved prevention guide.</Text>
        </View>
      )}

      {usingCachedData && !isOffline && (
        <View style={styles.bannerCached}>
          <View style={styles.bannerIconWrapInfo}>
            <Ionicons name="sync-circle" size={18} color={primaryColor} />
          </View>
          <Text style={styles.bannerText}>Currently viewing cached safety tips.</Text>
        </View>
      )}

      {/* 📘 Header Card */}
      <View style={styles.headCard}>
        <View style={styles.headTop}>
          <View>
            <Text style={[styles.kicker, { color: primaryColor }]}>COMMUNITY HEALTH</Text>
            <Text style={styles.title}>Prevention Guide</Text>
          </View>
          <Ionicons name="shield-checkmark" size={32} color={primaryColor + '40'} />
        </View>
        
        <Text style={styles.subtitle}>
          Expert-sourced citizen tips to mitigate risk and prevent outbreak spread in your area.
        </Text>

        <Pressable 
          onPress={onRefreshTips} 
          style={({ pressed }) => [
            styles.refreshBtn, 
            { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 }
          ]}
        >
          {tipsLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.refreshText}>Sync Latest Tips</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* 📋 Tips List Section */}
      <View style={styles.listCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Safety Protocols</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tips.length} Actions</Text>
          </View>
        </View>

        {!tips.length && !tipsLoading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color={theme.line} />
            <Text style={styles.empty}>No tips available right now. Please refresh.</Text>
          </View>
        ) : null}

        <View style={styles.tipsContainer}>
          {tips.map((tip, index) => (
            <View key={`${tip}-${index}`} style={styles.tipCard}>
              <View style={[styles.tipNumberWrap, { backgroundColor: primaryColor + '15' }]}>
                <Text style={[styles.tipNumber, { color: primaryColor }]}>{index + 1}</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 💡 Info Note */}
      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
        <Text style={styles.footerNoteText}>
          These tips are updated based on local health data.
        </Text>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 120,
      gap: 16
    },
    // Banners
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
    bannerCached: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.blue || "#007AFF",
    },
    bannerIconWrapWarning: {
      backgroundColor: (theme.warn || "#FF9500") + '20',
      padding: 6,
      borderRadius: 8
    },
    bannerIconWrapInfo: {
      backgroundColor: (theme.blue || "#007AFF") + '15',
      padding: 5,
      borderRadius: 8
    },
    bannerText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "600",
      flex: 1
    },

    // Header Card
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
      alignItems: 'flex-start'
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
      marginTop: 8,
      marginBottom: 20,
      color: theme.textSoft,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "500"
    },
    refreshBtn: {
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2
    },
    refreshText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700"
    },

    // Tips List
    listCard: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
    },
    badge: {
      backgroundColor: theme.bg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textSoft
    },
    tipsContainer: {
      gap: 16
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.line,
    },
    tipNumberWrap: {
      width: 32,
      height: 32,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2
    },
    tipNumber: {
      fontSize: 15,
      fontWeight: "900"
    },
    tipContent: {
      flex: 1,
    },
    tipText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "600"
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
      textAlign: 'center',
      fontWeight: "500"
    },
    footerNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 4
    },
    footerNoteText: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "500"
    }
  });

export default memo(TipsScreen);