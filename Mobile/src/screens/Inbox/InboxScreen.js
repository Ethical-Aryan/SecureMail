import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, RefreshControl, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import EmailCard from '../../components/cards/EmailCard';
import Avatar from '../../components/common/Avatar';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyView from '../../components/common/EmptyView';
import ErrorView from '../../components/common/ErrorView';
import useMail from '../../hooks/useMail';
import useAuth from '../../hooks/useAuth';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'encrypted', label: 'Encrypted' },
];

export default function InboxScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { emails, isLoading, isRefreshing, error, fetchEmails, toggleStar, markAsRead, deleteEmail } = useMail();

  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const filteredEmails = useMemo(() => {
    let result = emails;
    if (activeFilter === 'unread') {
      result = result.filter(e => e.unread);
    } else if (activeFilter === 'encrypted') {
      result = result.filter(e => e.locked);
    }
    return result;
  }, [emails, activeFilter]);

  const unreadCount = useMemo(() => emails.filter(e => e.unread).length, [emails]);

  const handleRefresh = useCallback(() => {
    fetchEmails(true);
  }, [fetchEmails]);

  const handleEmailPress = useCallback((email) => {
    if (email.unread) {
      markAsRead(email.id);
    }
    navigation.navigate('EmailDetail', { email });
  }, [navigation, markAsRead]);

  const handleStarPress = useCallback((emailId, currentStarred) => {
    toggleStar(emailId, currentStarred);
  }, [toggleStar]);

  const handleDeletePress = useCallback((emailId) => {
    if (deleteEmail) deleteEmail(emailId);
  }, [deleteEmail]);

  const renderEmailItem = useCallback(({ item }) => (
    <EmailCard
      email={item}
      onPress={handleEmailPress}
      onStar={handleStarPress}
      onDelete={() => handleDeletePress(item.id)}
    />
  ), [handleEmailPress, handleStarPress, handleDeletePress]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const getEmptyProps = () => {
    return { icon: 'inbox', title: 'Inbox is empty', message: 'New emails will appear here' };
  };

  if (isLoading && emails.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <LoadingSkeleton type="email" count={6} />
      </View>
    );
  }

  if (error && emails.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <ErrorView
          title="Failed to load emails"
          message={error}
          onRetry={() => fetchEmails()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar 
            email={user?.email || 'user@example.com'} 
            initials={user?.name ? user.name.substring(0,2).toUpperCase() : 'AM'} 
            size={36} 
          />
        </View>
        <Text style={styles.title}>Inbox</Text>
        <TouchableOpacity style={styles.headerRight}>
          <Feather name="search" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Subheading */}
      <View style={styles.subheadingRow}>
        <Text style={styles.subheadingText}>
          {unreadCount} unread · Encrypted inbox
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveFilter(tab.key)}
              style={[styles.tab, isActive && styles.activeTab]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Email List */}
      <FlatList
        data={filteredEmails}
        renderItem={renderEmailItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          filteredEmails.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={<EmptyView {...getEmptyProps()} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 16 }]}
        onPress={() => navigation.navigate('ComposeTab')}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  subheadingRow: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  subheadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.bodySmallMedium,
    color: COLORS.textPrimary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: SPACING.xxxxl * 2,
  },
  emptyList: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.colored,
  },
});
