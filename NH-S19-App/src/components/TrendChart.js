import { memo, useMemo } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TrendChart = ({ theme, trends = [] }) => {
  const styles = useMemo(() => createStyles(theme), [theme]);

  const rows = useMemo(() => {
    if (!Array.isArray(trends)) return [];
    return trends.slice(-6); // Last 6 intervals dikhayenge
  }, [trends]);

  const maxValue = useMemo(() => {
    if (!rows.length) return 1;
    return Math.max(...rows.map((item) => Number(item.averageRisk || 0)), 0.05);
  }, [rows]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Community Trend</Text>
          <Text style={styles.subtitle}>Last 6 weeks of transmission data</Text>
        </View>
        <Ionicons name="trending-up-outline" size={20} color={theme.blue} />
      </View>

      {!rows.length ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={32} color={theme.line} />
          <Text style={styles.empty}>No trend data available for this zone yet.</Text>
        </View>
      ) : (
        <View style={styles.chartBody}>
          {rows.map((row, idx) => {
            const riskVal = Number(row.averageRisk || 0);
            const ratio = riskVal / maxValue;
            const width = `${Math.max(8, Math.round(ratio * 100))}%`;
            
            // 🎨 Color logic: High risk = Reddish, Low = Blueish/Greenish
            const barColor = riskVal > 0.7 ? '#FF3B30' : riskVal > 0.4 ? '#FF9500' : theme.blue;

            return (
              <View key={`${row.label}-${idx}`} style={styles.row}>
                <View style={styles.labelWrap}>
                  <Text style={styles.label}>{row.label || `Week ${idx + 1}`}</Text>
                </View>

                <View style={styles.barTrack}>
                  <View 
                    style={[
                      styles.barFill, 
                      { width, backgroundColor: barColor }
                    ]} 
                  />
                </View>

                <View style={styles.valueWrap}>
                  <Text style={[styles.value, { color: riskVal > 0.7 ? barColor : theme.text }]}>
                    {Math.round(riskVal * 100)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Data source: Municipal Health Dept & Crowdsourced Reports</Text>
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 28,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.line,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 16 },
        android: { elevation: 5 }
      })
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 24
    },
    title: {
      color: theme.text,
      fontSize: 19,
      fontWeight: "900",
      letterSpacing: -0.6
    },
    subtitle: {
      marginTop: 4,
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2
    },
    chartBody: {
      gap: 16
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12
    },
    labelWrap: {
      width: 70,
    },
    label: {
      color: theme.textMuted,
      fontSize: 12,      fontWeight: '800',
      letterSpacing: 0.2,      fontWeight: "800",
      textTransform: 'uppercase'
    },
    barTrack: {
      flex: 1,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.bg, // Underlying track color
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.line + '50'
    },
    barFill: {
      height: "100%",
      borderRadius: 5
    },
    valueWrap: {
      width: 55,
      alignItems: 'flex-end'
    },
    value: {
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: -0.3
    },
    emptyContainer: {
      paddingVertical: 30,
      alignItems: 'center',
      gap: 10
    },
    empty: {
      color: theme.textMuted,
      fontSize: 12,
      textAlign: 'center',
      maxWidth: '80%'
    },
    footer: {
      marginTop: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.line,
    },
    footerText: {
      color: theme.textMuted,
      fontSize: 9,
      fontWeight: '600',
      textAlign: 'center',
      fontStyle: 'italic'
    }
  });

export default memo(TrendChart);