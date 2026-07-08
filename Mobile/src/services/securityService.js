// ==============================================================
// Security Service — Stub (No backend endpoint exists)
// Provides local-only security status information
// ==============================================================

const securityService = {
  /**
   * NOTE: No /api/security endpoint exists in the Flask backend.
   * Security data is generated locally based on app state.
   * When a backend security API is added, update this service.
   */

  getSecurityStatus(userData, emails) {
    const encryptedCount = Array.isArray(emails)
      ? emails.filter((e) => e.locked).length
      : 0;
    const totalCount = Array.isArray(emails) ? emails.length : 0;

    return {
      overallScore: 85,
      encryption: {
        status: 'active',
        label: 'End-to-End Encryption',
        description: 'All messages are encrypted using AES-256',
        icon: 'shield',
      },
      twoFactor: {
        status: 'available',
        label: 'Two-Factor Authentication',
        description: 'Not yet available — pending backend support',
        icon: 'smartphone',
      },
      biometric: {
        status: 'available',
        label: 'Biometric Lock',
        description: 'Use Face ID or fingerprint to unlock the app',
        icon: 'lock',
      },
      stats: {
        encryptedEmails: encryptedCount,
        totalEmails: totalCount,
        encryptionPercentage: totalCount > 0
          ? Math.round((encryptedCount / totalCount) * 100)
          : 0,
      },
      recentActivity: [
        {
          id: '1',
          action: 'Login',
          device: 'This device',
          time: 'Just now',
          icon: 'log-in',
        },
      ],
    };
  },
};

export default securityService;
