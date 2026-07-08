// ==============================================================
// Profile Service — Stub (No backend endpoint exists)
// Uses local data from JWT claims and storage API
// ==============================================================

const profileService = {
  /**
   * NOTE: No /api/profile or /api/users/me endpoint exists in the Flask backend.
   * Profile data is derived from:
   * 1. JWT claims (email) stored after login
   * 2. /api/storage endpoint for usage stats
   * 
   * When a backend profile API is added, update this service.
   */

  getLocalProfile(userData) {
    if (!userData) return null;
    return {
      id: userData.id,
      email: userData.email,
      displayName: userData.email
        ? userData.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'User',
      joinDate: 'Member since 2024',
      avatar: null,
    };
  },
};

export default profileService;
