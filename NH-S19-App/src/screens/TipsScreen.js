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

// ─── Sub-components ───────────────────────────────────────────────────────────

const Banner = ({ color, icon, message, theme, styles }) => (
  <View style={[styles.banner, { borderColor: color + "45", backgroundColor: theme.card }]}>
    <View style={[styles.bannerIconWrap, { backgroundColor: color + "18" }]}>
      <Ionicons name={icon} size={15} color={color} />
    </View>
    <Text style={[styles.bannerText, { color: theme.text }]}>{message}</Text>
  </View>
);

const TipCard = ({ tip, index, brand, theme, styles }) => (
  <View
    style={[
      styles.tipCard,
      { borderTopColor: theme.line },
      index === 0 && { borderTopWidth: 0, paddingTop: 0 },
    ]}
  >
    <View style={[styles.tipNumber, { backgroundColor: brand + "15" }]}>
      <Text style={[styles.tipNumberText, { color: brand }]}>{index + 1}</Text>
    </View>
    <Text style={[styles.tipText, { color: theme.text }]}>{tip}</Text>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

const TipsScreen = ({
  theme,
  tips = [],
  tipsLoading = false,
  onRefreshTips = () => {},
  isOffline = false,
  usingCachedData = false,
}) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const brand  = theme?.brand   || "#3182ce";
  const warn   = theme?.warning || "#dd6b20";

  return (
    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

      {isOffline && (
        <Banner
          color={warn}
          icon="cloud-offline-outline"
          message="Offline — showing saved prevention guide."
          theme={theme}
          styles={styles}
        />
      )}

      {usingCachedData && !isOffline && (
        <Banner
          color={brand}
          icon="sync-circle-outline"
          message="Viewing cached safety tips."
          theme={theme}
          styles={styles}
        />
      )}

      {/* Header Card */}
      <View style={[styles.headCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.headTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: brand }]}>COMMUNITY HEALTH</Text>
            <Text style={[styles.title, { color: theme.text }]}>Prevention Guide</Text>
          </View>
          <View style={[styles.shieldWrap, { backgroundColor: brand + "12", borderColor: brand + "25" }]}>
            <Ionicons name="shield-checkmark" size={22} color={brand} />
          </View>
        </View>

        <Text style={[styles.subtitle, { color: theme.textSoft }]}>
          Expert-sourced tips to mitigate risk and prevent outbreak spread in your area.
        </Text>

        <Pressable
          onPress={onRefreshTips}
          style={({ pressed }) => [
            styles.refreshBtn,
            { backgroundColor: brand, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {tipsLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={15} color="#fff" />
              <Text style={styles.refreshText}>Sync Latest Tips</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Tips List Card */}
      <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: theme.text }]}>Safety Protocols</Text>
          <View style={[styles.countBadge, { backgroundColor: theme.cardElevated, borderColor: theme.line }]}>
            <Text style={[styles.countText, { color: theme.textSoft }]}>
              {tips.length} {tips.length === 1 ? "action" : "actions"}
            </Text>
          </View>
        </View>

        {!tips.length && !tipsLoading ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={36} color={theme.textSoft} />
            <Text style={[styles.emptyText, { color: theme.textSoft }]}>
              No tips available right now. Please refresh.
            </Text>
          </View>
        ) : (
          <View>
            {tips.map((tip, index) => (
              <TipCard
                key={`tip-${index}`}
                tip={tip}
                index={index}
                brand={brand}
                theme={theme}
                styles={styles}
              />
            ))}
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footerNote}>
        <Ionicons name="information-circle-outline" size={13} color={theme.textSoft} />
        <Text style={[styles.footerText, { color: theme.textSoft }]}>
          Tips are updated based on local health data.
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme) =>
  StyleSheet.create({
    body: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 0,
      gap: 16,
    },

    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
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

    headCard: {
      borderRadius: 20,
      padding: 16,
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
      marginBottom: 8,
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
    shieldWrap: {
      width: 44,
      height: 44,
      borderRadius: 13,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 12,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "400",
      marginBottom: 16,
    },
    refreshBtn: {
      height: 48,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
        android: { elevation: 4 },
      }),
    },
    refreshText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },

    listCard: {
      borderRadius: 20,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({
        ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
        android: { elevation: 3 },
      }),
    },
    listHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    listTitle: {
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    countBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    countText: {
      fontSize: 11,
      fontWeight: "600",
    },

    tipCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    tipNumber: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    tipNumberText: {
      fontSize: 14,
      fontWeight: "800",
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "500",
      paddingTop: 5,
    },

    emptyState: {
      alignItems: "center",
      paddingVertical: 32,
      gap: 10,
    },
    emptyText: {
      fontSize: 13,
      fontWeight: "400",
      textAlign: "center",
      lineHeight: 19,
    },

    footerNote: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
    footerText: {
      fontSize: 11,
      fontWeight: "400",
    },
  });

export default memo(TipsScreen);