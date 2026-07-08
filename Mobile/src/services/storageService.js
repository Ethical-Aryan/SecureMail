import api from './api';
import { API_ENDPOINTS } from '../constants/constants';

// ==============================================================
// Storage Service — Maps to Flask /api/storage endpoint
// ==============================================================

const storageService = {
  /**
   * GET /api/storage
   * Auth: JWT Required
   * Returns: { total_bytes, gb_used, percent_used, quota_gb }
   * Status: 200 OK | 404 User not found
   */
  async getStorageInfo() {
    const response = await api.get(API_ENDPOINTS.STORAGE.INFO);
    return response.data;
  },
};

export default storageService;
