import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/theme';
import EmailCard from '../../components/cards/EmailCard';
import Avatar from '../../components/common/Avatar';
import SearchBar from '../../components/inputs/SearchBar';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyView from '../../components/common/EmptyView';
import ErrorView from '../../components/common/ErrorView';
import useMail from '../../hooks/useMail';
import useAuth from '../../hooks/useAuth';
import { useTheme } from '../../context/ThemeContext';

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'encrypted', label: 'Encrypted' },
];

export default function InboxScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { emails, isLoading, isRefreshing, error, fetchEmails, searchEmails, toggleStar, markAsRead, deleteEmail } = useMail();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  // Handle debounced search query changes (300ms)
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    debounceTimerRef.current = setTimeout(async () => {
      const res = await searchEmails(text);
      if (res.success) {
        setSearchResults(res.data || []);
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);
  }, [searchEmails]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  const toggleSearchMode = useCallback(() => {
    if (isSearchActive) {
      setIsSearchActive(false);
      handleClearSearch();
    } else {
      setIsSearchActive(true);
    }
  }, [isSearchActive, handleClearSearch]);

  const activeEmailList = useMemo(() => {
    if (isSearchActive && searchQuery.trim().length > 0) {
      return searchResults;
    }
    return emails;
  }, [isSearchActive, searchQuery, searchResults, emails]);

  const filteredEmails = useMemo(() => {
    let result = activeEmailList;
    if (activeFilter === 'unread') {
      result = result.filter(e => e.unread);
    } else if (activeFilter === 'encrypted') {
      result = result.filter(e => e.locked);
    }
    return result;
  }, [activeEmailList, activeFilter]);

  const unreadCount = useMemo(() => emails.filter(e => e.unread).length, [emails]);

  const handleRefresh = useCallback(() => {
    if (isSearchActive && searchQuery.trim().length > 0) {
      handleSearchChange(searchQuery);
    } else {
      fetchEmails(true);
    }
  }, [isSearchActive, searchQuery, handleSearchChange, fetchEmails]);

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
    if (isSearchActive && searchQuery.trim().length > 0) {
      return {
        icon: 'search',
        title: 'No emails found',
        message: 'Try searching by sender, subject, or content.',
      };
    }
    return { icon: 'inbox', title: 'Inbox is empty', message: 'New emails will appear here' };
  };

  if (isLoading && emails.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <LoadingSkeleton type="email" count={6} />
      </View>
    );
  }

  if (error && emails.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <ErrorView
          title="Failed to load emails"
          message={error}
          onRetry={() => fetchEmails()}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar 
            email={user?.email || 'user@example.com'} 
            initials={user?.email ? user.email.substring(0, 2).toUpperCase() : 'AM'} 
            size={36} 
          />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Inbox</Text>
        <TouchableOpacity style={styles.headerRight} onPress={toggleSearchMode}>
          <Feather name={isSearchActive ? 'x' : 'search'} size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Backend Search Bar */}
      {isSearchActive && (
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search sender, subject, body..."
          onClear={handleClearSearch}
        />
      )}

      {/* Subheading */}
      <View style={styles.subheadingRow}>
        <Text style={[styles.subheadingText, { color: colors.textSecondary }]}>
          {isSearchActive && searchQuery.trim().length > 0
            ? `${filteredEmails.length} search results found`
            : `${unreadCount} unread · Encrypted inbox`}
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
              style={[
                styles.tab,
                { backgroundColor: isActive ? colors.primary : colors.card },
                isActive && SHADOWS.sm,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Searching Loader Indicator */}
      {isSearching ? (
        <LoadingSkeleton type="email" count={4} />
      ) : (
        /* Email List */
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
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={<EmptyView {...getEmptyProps()} />}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: 16 }]}
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
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  subheadingRow: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  subheadingText: {
    ...TYPOGRAPHY.caption,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md + 2,
    borderRadius: BORDER_RADIUS.full,
  },
  tabText: {
    ...TYPOGRAPHY.bodySmallMedium,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyList: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.colored,
  },
});
