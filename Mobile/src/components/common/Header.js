import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../theme/theme';

const Header = memo(({
  title,
  subtitle,
  onBack,
  rightActions = [], // [{ icon, onPress, badge }]
  transparent = false,
  large = false,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container,
      !transparent && styles.solidBg,
      !transparent && SHADOWS.sm,
      { paddingTop: insets.top + SPACING.sm },
      style,
    ]}>
      <View style={styles.row}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}

        {!large && (
          <View style={[styles.titleContainer, !onBack && styles.titleNoBack]}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            )}
          </View>
        )}

        <View style={styles.rightContainer}>
          {rightActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              onPress={action.onPress}
              style={styles.actionButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
            >
              <Feather name={action.icon} size={22} color={COLORS.textPrimary} />
              {action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {action.badge > 99 ? '99+' : action.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {large && (
        <View style={styles.largeTitle}>
          <Text style={styles.largeTitleText}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
      )}
    </View>
  );
});

Header.displayName = 'Header';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  solidBg: {
    backgroundColor: COLORS.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  titleContainer: {
    flex: 1,
  },
  titleNoBack: {
    paddingLeft: 0,
  },
  title: {
    ...TYPOGRAPHY.h5,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...TYPOGRAPHY.overline,
    color: COLORS.textInverse,
    fontSize: 9,
    letterSpacing: 0,
  },
  largeTitle: {
    marginTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  largeTitleText: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
});

export default Header;
