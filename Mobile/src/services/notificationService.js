// ==============================================================
// Notification Service — Stub (No backend endpoint exists)
// Generates local notifications from unread email data
// ==============================================================

const notificationService = {
  /**
   * NOTE: No /api/notifications endpoint exists in the Flask backend.
   * Notifications are derived locally from unread emails.
   * When a backend notification API is added, update this service.
   */

  generateNotifications(emails) {
    if (!Array.isArray(emails)) return [];

    const notifications = [];

    const unreadEmails = emails.filter((e) => e.unread && e.folder === 'inbox');
    unreadEmails.slice(0, 20).forEach((email) => {
      notifications.push({
        id: `email-${email.id}`,
        type: 'new_email',
        title: 'New message',
        message: `${email.sender} — ${email.subject}`,
        time: email.time,
        read: false,
        icon: email.locked ? 'lock' : 'mail',
        emailId: email.id,
      });
    });

    const encryptedEmails = emails.filter((e) => e.locked && e.folder === 'inbox');
    encryptedEmails.slice(0, 5).forEach((email) => {
      notifications.push({
        id: `encrypted-${email.id}`,
        type: 'security',
        title: 'Encrypted message received',
        message: `A passkey-protected message from ${email.sender}`,
        time: email.time,
        read: false,
        icon: 'shield',
        emailId: email.id,
      });
    });

    return notifications.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateB - dateA;
    });
  },
};

export default notificationService;
