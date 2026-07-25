import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import useMail from '../../hooks/useMail';
import securityService from '../../services/securityService';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

export default function SecurityCenterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { emails } = useMail();

  const security = useMemo(
    () => securityService.getSecurityStatus(user, emails),
    [user, emails]
  );

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'coming_soon':
        return 'Coming Soon';
      default:
        return 'Available';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Header title="Vault Security" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Features & Status */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Security Status</Text>

        {[security.encryption, security.biometric, security.twoFactor].map((feature, index) => {
          const isActive = feature.status === 'active';
          const isComingSoon = feature.status === 'coming_soon';

          const iconBg = isActive
            ? (isDark ? '#064E3B' : colors.successLight)
            : (isDark ? '#312E81' : '#EDE9FE');
          
          const iconColor = isActive ? colors.success : colors.primary;

          const badgeBg = isActive
            ? (isDark ? '#064E3B' : colors.successLight)
            : isComingSoon
            ? (isDark ? '#312E81' : '#EDE9FE')
            : (isDark ? '#78350F' : colors.warningLight);

          const badgeTextColor = isActive
            ? colors.success
            : isComingSoon
            ? colors.primary
            : colors.warning;

          return (
            <Card key={index} variant="default" padding={SPACING.lg} style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: iconBg }]}>
                  <Feather name={feature.icon} size={20} color={iconColor} />
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureLabel, { color: colors.textPrimary }]}>{feature.label}</Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{feature.description}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                  <Text style={[styles.statusText, { color: badgeTextColor }]}>
                    {getStatusText(feature.status)}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}

        {/* Encryption Stats */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Encryption Statistics</Text>

        <Card variant="default" padding={SPACING.xl} style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{security.stats.encryptedEmails}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Encrypted</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{security.stats.totalEmails}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {security.stats.encryptionPercentage}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Protected</Text>
            </View>
          </View>
        </Card>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent Activity</Text>

        {security.recentActivity.map((activity) => (
          <Card key={activity.id} variant="outlined" padding={SPACING.lg} style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={[styles.activityIcon, { backgroundColor: isDark ? '#312E81' : '#EDE9FE' }]}>
                <Feather name={activity.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityAction, { color: colors.textPrimary }]}>{activity.action}</Text>
                <Text style={[styles.activityMeta, { color: colors.textTertiary }]}>
                  {activity.device} • {activity.time}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Feather name="info" size={14} color={colors.textTertiary} />
          <Text style={[styles.disclaimerText, { color: colors.textTertiary }]}>
            Security metrics derived from AES-256 state & session keys.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxxl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.captionBold,
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
    fontWeight: '600',
  },
  featureDescription: {
    ...TYPOGRAPHY.caption,
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
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  activityAction: {
    ...TYPOGRAPHY.bodySmallMedium,
  },
  activityMeta: {
    ...TYPOGRAPHY.caption,
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
    marginLeft: SPACING.xs,
    flex: 1,
    lineHeight: 18,
  },
});
