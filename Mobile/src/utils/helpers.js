import { COLORS } from '../theme/theme';

// ==============================================================
// Helper Utilities
// ==============================================================

/**
 * Format a timestamp string into a relative or absolute time display
 */
export function formatTime(timestamp) {
  if (!timestamp || timestamp === 'Just Now') return 'Just Now';

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just Now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (date.getFullYear() === now.getFullYear()) {
      return `${monthNames[date.getMonth()]} ${date.getDate()}`;
    }
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch {
    return timestamp;
  }
}

/**
 * Format a full date for email detail view
 */
export function formatFullDate(timestamp) {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  } catch {
    return timestamp;
  }
}

/**
 * Generate initials from an email address
 */
export function getInitials(email) {
  if (!email) return 'US';
  const name = email.split('@')[0];
  const parts = name.split('.');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Generate a display name from an email address
 */
export function getDisplayName(email) {
  if (!email) return 'Unknown User';
  const name = email.split('@')[0];
  return name
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get a consistent color for an avatar based on the email
 */
export function getAvatarColor(email) {
  if (!email) return COLORS.primary;
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.avatarColors.length;
  return COLORS.avatarColors[index];
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '…';
}

/**
 * Format file size bytes into human-readable string
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Format storage usage
 */
export function formatStorageUsage(gbUsed, quotaGb) {
  if (gbUsed < 0.01) {
    return `${Math.round(gbUsed * 1024)} MB`;
  }
  return `${gbUsed.toFixed(2)} GB`;
}

/**
 * Debounce a function call
 */
export function debounce(func, wait = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a greeting based on the time of day
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Extract email body preview text
 */
export function getEmailPreview(body, maxLength = 80) {
  if (!body) return '';
  if (Array.isArray(body)) {
    return truncateText(body.join(' '), maxLength);
  }
  return truncateText(body, maxLength);
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safely parse JSON
 */
export function safeParseJSON(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Count unread emails
 */
export function countUnread(emails) {
  if (!Array.isArray(emails)) return 0;
  return emails.filter((e) => e.unread).length;
}

/**
 * Filter emails by folder
 */
export function filterByFolder(emails, folder) {
  if (!Array.isArray(emails)) return [];
  if (folder === 'all') return emails;
  if (folder === 'starred') return emails.filter((e) => e.starred);
  return emails.filter((e) => e.folder === folder);
}

/**
 * Search emails by query
 */
export function searchEmails(emails, query) {
  if (!query || !Array.isArray(emails)) return emails;
  const lowerQuery = query.toLowerCase();
  return emails.filter(
    (e) =>
      (e.subject && e.subject.toLowerCase().includes(lowerQuery)) ||
      (e.sender && e.sender.toLowerCase().includes(lowerQuery)) ||
      (e.senderEmail && e.senderEmail.toLowerCase().includes(lowerQuery)) ||
      (e.preview && e.preview.toLowerCase().includes(lowerQuery))
  );
}
