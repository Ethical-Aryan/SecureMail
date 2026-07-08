import api from './api';
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
};

export default authService;
