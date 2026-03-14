import { memo, useMemo } from "react";
import { StyleSheet, Text, View, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { resolveRiskColor, toScorePercent } from "../theme/palette";

const RiskCard = ({ theme, riskResult, nearbyCasesCount, communityRiskLevel, highRiskZones }) => {
  const styles = useMemo(() => createStyles(theme), [theme]);
  
  const score = toScorePercent(riskResult?.risk_score);
  const level = String(riskResult?.risk_level || communityRiskLevel || "Low");
  const tone = resolveRiskColor(level, theme);
  
  const factors = Array.isArray(riskResult?.explainabilityFactors)
    ? riskResult.explainabilityFactors
    : Array.isArray(riskResult?.explainability?.top_factors)
      ? riskResult.explainability.top_factors
      : [];

  return (
    <View style={styles.card}>
      {/* 🧠 Header Section */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>AI Risk Summary</Text>
          <Text style={styles.subtitle}>Neural analysis of local health indicators</Text>
        </View>
        <View style={[styles.aiBadge, { backgroundColor: theme.blue + '15' }]}>
          <Ionicons name="hardware-chip-outline" size={14} color={theme.blue} />
          <Text style={[styles.aiBadgeText, { color: theme.blue }]}>LIVE AI</Text>
        </View>
      </View>

      {/* 📊 High-Level Metrics */}
      <View style={styles.mainMetrics}>
        <View style={[styles.scoreCircle, { borderColor: tone + '30' }]}>
          <Text style={styles.metricLabel}>PREDICTION</Text>
          <Text style={[styles.scoreValue, { color: tone }]}>{score}</Text>
          <View style={[styles.levelTag, { backgroundColor: tone }]}>
            <Text style={styles.levelTagText}>{level.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.statsColumn}>
          <View style={styles.statMiniCard}>
            <Ionicons name="people-outline" size={14} color={theme.textSoft} />
            <View>
              <Text style={styles.miniLabel}>Nearby Cases</Text>
              <Text style={styles.miniValue}>{nearbyCasesCount}</Text>
            </View>
          </View>
          <View style={styles.statMiniCard}>
            <Ionicons name="location-outline" size={14} color={theme.textSoft} />
            <View>
              <Text style={styles.miniLabel}>Danger Zones</Text>
              <Text style={styles.miniValue}>{highRiskZones}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 🧬 AI Explainability Factors */}
      <View style={styles.factorsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="git-branch-outline" size={14} color={theme.textSoft} />
          <Text style={styles.smallHeading}>KEY PREDICTION FACTORS</Text>
        </View>

        {factors.length ? (
          factors.slice(0, 3).map((factor, idx) => {
            const contribution = Number(factor?.contribution || 0);
            return (
              <View key={`${factor?.factor}-${idx}`} style={styles.factorItem}>
                <View style={styles.factorLabelRow}>
                  <Text style={styles.factorName}>{factor?.factor || `Factor ${idx + 1}`}</Text>
                  <Text style={styles.factorValue}>{Math.round(contribution * 100)}%</Text>
                </View>
                {/* Visual Progress Bar */}
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${contribution * 100}%`, backgroundColor: tone }
                    ]} 
                  />
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.empty}>Perform a risk check to unlock AI explainability insights.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.line,
      ...Platform.select({
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 },
        android: { elevation: 4 }
      })
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20
    },
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    aiBadgeText: {
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: -0.5
    },
    subtitle: {
      color: theme.textSoft,
      fontSize: 12,
      fontWeight: '500'
    },
    mainMetrics: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      marginBottom: 24
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
    },
    scoreValue: {
      fontSize: 28,
      fontWeight: '900',
      lineHeight: 32
    },
    metricLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: theme.textMuted,
      letterSpacing: 1
    },
    levelTag: {
      position: 'absolute',
      bottom: -10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    levelTagText: {
      color: '#FFF',
      fontSize: 10,
      fontWeight: '900'
    },
    statsColumn: {
      flex: 1,
      gap: 10
    },
    statMiniCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      backgroundColor: theme.bg,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    miniLabel: {
      fontSize: 10,
      color: theme.textMuted,
      fontWeight: '700'
    },
    miniValue: {
      fontSize: 15,
      color: theme.text,
      fontWeight: '800'
    },
    factorsSection: {
      backgroundColor: theme.bg + '50',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.line
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12
    },
    smallHeading: {
      color: theme.textMuted,
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.5
    },
    factorItem: {
      marginBottom: 12
    },
    factorLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6
    },
    factorName: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "700"
    },
    factorValue: {
      color: theme.textSoft,
      fontSize: 11,
      fontWeight: "800"
    },
    progressTrack: {
      height: 6,
      backgroundColor: theme.line,
      borderRadius: 3,
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      borderRadius: 3
    },
    emptyState: {
      paddingVertical: 10
    },
    empty: {
      color: theme.textMuted,
      fontSize: 12,
      textAlign: 'center',
      fontStyle: 'italic'
    }
  });

export default memo(RiskCard);