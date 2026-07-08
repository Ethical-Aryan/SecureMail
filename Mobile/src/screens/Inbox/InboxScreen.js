import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, RefreshControl, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme/theme';
import EmailCard from '../../components/cards/EmailCard';
import SearchBar from '../../components/inputs/SearchBar';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyView from '../../components/common/EmptyView';
import ErrorView from '../../components/common/ErrorView';
import useMail from '../../hooks/useMail';
import useAuth from '../../hooks/useAuth';
import { FOLDERS, FOLDER_LABELS } from '../../constants/constants';
import { filterByFolder, searchEmails, countUnread, debounce, getGreeting } from '../../utils/helpers';

const FOLDER_TABS = [
  { key: FOLDERS.INBOX, label: 'Inbox', icon: 'inbox' },
  { key: FOLDERS.SENT, label: 'Sent', icon: 'send' },
  { key: FOLDERS.STARRED, label: 'Starred', icon: 'star' },
];

export default function InboxScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { emails, isLoading, isRefreshing, error, fetchEmails, toggleStar, markAsRead } = useMail();

  const [activeFolder, setActiveFolder] = useState(FOLDERS.INBOX);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const filteredEmails = useMemo(() => {
    let result = filterByFolder(emails, activeFolder);
    if (searchQuery.trim()) {
      result = searchEmails(result, searchQuery);
    }
    return result;
  }, [emails, activeFolder, searchQuery]);

  const unreadCount = useMemo(() => countUnread(emails), [emails]);

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

  const debouncedSearch = useCallback(
    debounce((text) => setSearchQuery(text), 300),
    []
  );

  const renderEmailItem = useCallback(({ item }) => (
    <EmailCard
      email={item}
      onPress={handleEmailPress}
      onStar={handleStarPress}
    />
  ), [handleEmailPress, handleStarPress]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  const getEmptyProps = () => {
    if (searchQuery) {
      return {
        icon: 'search',
        title: 'No results found',
        message: `No emails matching "${searchQuery}"`,
      };
    }
    switch (activeFolder) {
      case FOLDERS.SENT:
        return { icon: 'send', title: 'No sent emails', message: 'Emails you send will appear here' };
      case FOLDERS.STARRED:
        return { icon: 'star', title: 'No starred emails', message: 'Star important emails to find them here' };
      default:
        return { icon: 'inbox', title: 'Inbox is empty', message: 'New emails will appear here' };
    }
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
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>
            Inbox
            {unreadCount > 0 && (
              <Text style={styles.unreadCount}> ({unreadCount})</Text>
            )}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.headerButton}
          >
            <Feather name="bell" size={20} color={COLORS.textPrimary} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('SecurityCenter')}
            style={styles.headerButton}
          >
            <Feather name="shield" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
        }}
        placeholder="Search emails..."
      />

      {/* Folder Tabs */}
      <View style={styles.tabsContainer}>
        {FOLDER_TABS.map((tab) => {
          const isActive = activeFolder === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveFolder(tab.key)}
              style={[styles.tab, isActive && styles.activeTab]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Feather
                name={tab.icon}
                size={14}
                color={isActive ? COLORS.primary : COLORS.textTertiary}
              />
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
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  greeting: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  unreadCount: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  activeTab: {
    backgroundColor: '#EDE9FE',
    borderColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.captionMedium,
    color: COLORS.textTertiary,
    marginLeft: SPACING.xs,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  listContent: {
    paddingVertical: SPACING.xs,
    paddingBottom: SPACING.xxxl,
  },
  emptyList: {
    flex: 1,
  },
});
