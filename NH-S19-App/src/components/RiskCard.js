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
      borderRadius: 28,
      padding: 24,
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
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line,
    },
    aiBadgeText: {
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 0.6,
      textTransform: 'uppercase'
    },
    title: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "900",
      letterSpacing: -0.6
    },
    subtitle: {
      color: theme.textMuted,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2
    },
    mainMetrics: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 22,
      marginBottom: 28
    },
    scoreCircle: {
      width: 130,
      height: 130,
      borderRadius: 65,
      borderWidth: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
    },
    scoreValue: {
      fontSize: 32,
      fontWeight: '900',
      lineHeight: 36
    },
    metricLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: theme.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase'
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
      gap: 12,
      padding: 14,
      backgroundColor: theme.bg,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.line
    },
    miniLabel: {
      fontSize: 11,
      color: theme.textMuted,
      fontWeight: '800',
      letterSpacing: 0.3
    },
    miniValue: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '900',
      letterSpacing: -0.3
    },
    factorsSection: {
      backgroundColor: theme.bg,
      padding: 18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.line
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 14
    },
    smallHeading: {
      color: theme.textMuted,
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.6,
      textTransform: 'uppercase'
    },
    factorItem: {
      marginBottom: 14
    },
    factorLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8
    },
    factorName: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.1
    },
    factorValue: {
      color: theme.textMuted,
      fontSize: 12,
      fontWeight: "900",
      letterSpacing: 0.2
    },
    progressTrack: {
      height: 8,
      backgroundColor: theme.line,
      borderRadius: 4,
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
      fontSize: 13,
      textAlign: 'center',
      fontStyle: 'italic',
      letterSpacing: 0.3
    }
  });

export default memo(RiskCard);