import axios from 'axios';
import { API_BASE_URL, TIMEOUTS, ERROR_MESSAGES } from '../constants/constants';
import secureStorage from '../utils/secureStorage';

// ==============================================================
// Axios Instance with Interceptors
// ==============================================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUTS.DEFAULT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Auth event listeners (set by AuthContext)
let onUnauthorized = null;

export function setOnUnauthorized(callback) {
  onUnauthorized = callback;
}

// Token refresh state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const forceLogout = async (error, data) => {
  try {
    await secureStorage.clearTokens();
    await secureStorage.clearUserData();
    if (onUnauthorized) {
      onUnauthorized();
    }
  } catch (e) {
    // Ignore storage errors on logout
  }
  error.userMessage = data?.error || ERROR_MESSAGES.UNAUTHORIZED;
  return Promise.reject(error);
};

// ==============================================================
// Request Interceptor — Attach JWT
// ==============================================================
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Silently continue without token
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==============================================================
// Response Interceptor — Handle errors globally
// ==============================================================
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // No response (network error, timeout)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.userMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
      } else if (error.message === 'Network Error') {
        error.userMessage = ERROR_MESSAGES.NETWORK_ERROR;
      } else {
        error.userMessage = ERROR_MESSAGES.GENERIC;
      }
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    switch (status) {
      case 401:
        // Unauthorized — token expired or invalid
        const originalRequest = error.config;
        
        // If it's a login request, refresh request, or already retried, do not attempt to refresh
        const isLoginRequest = originalRequest.url === API_ENDPOINTS.AUTH.LOGIN || originalRequest.url.endsWith(API_ENDPOINTS.AUTH.LOGIN);
        if (originalRequest._retry || originalRequest.url === API_ENDPOINTS.AUTH.REFRESH || isLoginRequest) {
          if (isLoginRequest) {
            error.userMessage = data?.error || ERROR_MESSAGES.UNAUTHORIZED;
            return Promise.reject(error);
          }
          return forceLogout(error, data);
        }

        if (isRefreshing) {
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = await secureStorage.getRefreshToken();
          if (!refreshToken) {
            throw new Error("No refresh token");
          }

          const response = await publicApi.post(API_ENDPOINTS.AUTH.REFRESH, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });

          const { access_token } = response.data;
          
          await secureStorage.setTokens(access_token, refreshToken);
          
          processQueue(null, access_token);
          
          originalRequest.headers.Authorization = 'Bearer ' + access_token;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          return forceLogout(error, data);
        } finally {
          isRefreshing = false;
        }

      case 403:
        error.userMessage = data?.error || ERROR_MESSAGES.FORBIDDEN;
        break;

      case 404:
        error.userMessage = data?.error || ERROR_MESSAGES.NOT_FOUND;
        break;

      case 409:
        error.userMessage = data?.error || 'This resource already exists.';
        break;

      case 422:
        error.userMessage = data?.error || 'Invalid data provided.';
        break;

      case 400:
        error.userMessage = data?.error || 'Bad request. Please check your input.';
        break;

      case 500:
      default:
        error.userMessage = data?.error || ERROR_MESSAGES.SERVER_ERROR;
        break;
    }

    return Promise.reject(error);
  }
);
// ==============================================================
// Public API — No JWT interceptor (for forgot-password, reset-password)
// ==============================================================

const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUTS.AUTH,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor for publicApi — user-friendly error messages only
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.userMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
      } else if (error.message === 'Network Error') {
        error.userMessage = ERROR_MESSAGES.NETWORK_ERROR;
      } else {
        error.userMessage = ERROR_MESSAGES.GENERIC;
      }
    } else {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          error.userMessage = data?.error || 'Bad request. Please check your input.';
          break;
        case 401:
          error.userMessage = data?.error || ERROR_MESSAGES.UNAUTHORIZED;
          break;
        case 403:
          error.userMessage = data?.error || ERROR_MESSAGES.FORBIDDEN;
          break;
        case 404:
          error.userMessage = data?.error || ERROR_MESSAGES.NOT_FOUND;
          break;
        case 409:
          error.userMessage = data?.error || 'This resource already exists.';
          break;
        case 422:
          error.userMessage = data?.error || 'Invalid data provided.';
          break;
        default:
          error.userMessage = data?.error || (status >= 500 ? ERROR_MESSAGES.SERVER_ERROR : ERROR_MESSAGES.GENERIC);
          break;
      }
    }
    return Promise.reject(error);
  }
);

export { publicApi };
export default api;
