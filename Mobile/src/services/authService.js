import api from './api';
import { publicApi } from './api';
import { API_ENDPOINTS } from '../constants/constants';

// ==============================================================
// Auth Service — Maps to Flask /api/auth/* endpoints
// ==============================================================

const authService = {
  /**
   * POST /api/auth/login
   * Body: { email, password }
   * Returns: { message, user: { id, email }, access_token, refresh_token }
   * Status: 200 OK | 400 Bad Request | 401 Invalid credentials
   */
  async login(email, password) {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, {
      email: email.trim(),
      password,
    });
    return response.data;
  },

  /**
   * POST /api/auth/register
   * Body: { email, password }
   * Returns: { message, user_id }
   * Status: 201 Created | 400 Bad Request | 409 Conflict | 500 Server Error
   */
  async register(email, password) {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, {
      email: email.trim(),
      password,
    });
    return response.data;
  },

  /**
   * POST /api/auth/forgot-password
   * Body: { email }
   * Returns: { message } — OTP is printed to Flask terminal
   * Status: 200 OK | 400 Bad Request
   * Uses publicApi (no JWT required)
   */
  async requestPasswordReset(email) {
    const response = await publicApi.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      email: email.trim(),
    });
    return response.data;
  },

  /**
   * POST /api/auth/reset-password
   * Body: { email, otp, new_password }
   * Returns: { message }
   * Status: 200 OK | 400 Bad Request (expired/invalid OTP, weak password)
   * Uses publicApi (no JWT required)
   */
  async resetPassword(email, otp, newPassword) {
    const response = await publicApi.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      email: email.trim(),
      otp: otp.trim(),
      new_password: newPassword,
    });
    return response.data;
  },

  /**
   * POST /api/auth/refresh
   * Returns: { success, access_token }
   * Uses publicApi to pass the refresh token in the header manually
   */
  async refresh(refreshToken) {
    const response = await publicApi.post(API_ENDPOINTS.AUTH.REFRESH, {}, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    return response.data;
  },

  /**
   * POST /api/auth/logout
   * Returns: { success, message }
   * Uses api (attaches access_token automatically)
   */
  async logout() {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    return response.data;
  },
};

export default authService;

