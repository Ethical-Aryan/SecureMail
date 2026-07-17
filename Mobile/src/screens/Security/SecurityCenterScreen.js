import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import useMail from '../../hooks/useMail';
import securityService from '../../services/securityService';
import useAuth from '../../hooks/useAuth';

export default function SecurityCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { emails } = useMail();

  const security = useMemo(
    () => securityService.getSecurityStatus(user, emails),
    [user, emails]
  );

  const scoreColor = security.overallScore >= 80 ? COLORS.success
    : security.overallScore >= 50 ? COLORS.warning : COLORS.danger;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <Header
        title="Vault"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Score Card */}
        <Card variant="elevated" style={styles.scoreCard}>
          <LinearGradient
            colors={COLORS.gradient.primary}
            style={styles.scoreGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.scoreValue}>{security.overallScore}</Text>
            <Text style={styles.scoreLabel}>Security Score</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${security.overallScore}%` }]} />
            </View>
            <Text style={styles.scoreDescription}>
              Your account is well-protected. Keep up the good work!
            </Text>
          </LinearGradient>
        </Card>

        {/* Security Features */}
        <Text style={styles.sectionTitle}>Security Features</Text>

        {[security.encryption, security.biometric, security.twoFactor].map((feature, index) => (
          <Card key={index} variant="default" padding={SPACING.lg} style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={[
                styles.featureIcon,
                { backgroundColor: feature.status === 'active' ? COLORS.successLight : '#EDE9FE' },
              ]}>
                <Feather
                  name={feature.icon}
                  size={20}
                  color={feature.status === 'active' ? COLORS.success : COLORS.primary}
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: feature.status === 'active' ? COLORS.successLight : COLORS.warningLight },
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: feature.status === 'active' ? '#059669' : '#D97706' },
                ]}>
                  {feature.status === 'active' ? 'Active' : 'Available'}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Encryption Stats */}
        <Text style={styles.sectionTitle}>Encryption Statistics</Text>

        <Card variant="default" padding={SPACING.xl} style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{security.stats.encryptedEmails}</Text>
              <Text style={styles.statLabel}>Encrypted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{security.stats.totalEmails}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {security.stats.encryptionPercentage}%
              </Text>
              <Text style={styles.statLabel}>Protected</Text>
            </View>
          </View>
        </Card>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {security.recentActivity.map((activity) => (
          <Card key={activity.id} variant="outlined" padding={SPACING.lg} style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={styles.activityIcon}>
                <Feather name={activity.icon} size={16} color={COLORS.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityAction}>{activity.action}</Text>
                <Text style={styles.activityMeta}>
                  {activity.device} • {activity.time}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Feather name="info" size={14} color={COLORS.textTertiary} />
          <Text style={styles.disclaimerText}>
            Security data is generated locally. Some features require backend API support.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxxl,
  },
  scoreCard: {
    marginBottom: SPACING.xxl,
    padding: 0,
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.xl,
  },
  scoreGradient: {
    padding: SPACING.xxl,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.xl,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  scoreLabel: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.lg,
  },
  scoreBar: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  scoreDescription: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  featureCard: {
    marginBottom: SPACING.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  featureLabel: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  featureDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BORDER_RADIUS.full,
  },
  statusText: {
    ...TYPOGRAPHY.captionBold,
    fontSize: 10,
  },
  statsCard: {
    marginBottom: SPACING.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.borderLight,
  },
  activityCard: {
    marginBottom: SPACING.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  activityAction: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
  },
  activityMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.sm,
  },
  disclaimerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
    flex: 1,
    lineHeight: 18,
  },
});
