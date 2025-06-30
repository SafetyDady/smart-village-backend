/**
 * API Client for Smart Village Management System
 * Handles HTTP requests with authentication and error handling
 */

import axios from 'axios';

// API Configuration
const API_CONFIG = {
  // Use environment variables for API URLs
  AUTH_BASE_URL: import.meta.env.VITE_AUTH_API_URL || 'http://localhost:3002',
  MAIN_API_BASE_URL: import.meta.env.VITE_MAIN_API_URL || 'http://localhost:5002',
  TIMEOUT: 30000, // 30 seconds - เพิ่มจาก 10s เพื่อแก้ไขปัญหา timeout
  RETRY_ATTEMPTS: 5, // เพิ่มจาก 3 เป็น 5 ครั้ง
  RETRY_DELAY: 2000, // เพิ่มจาก 1s เป็น 2s
  RETRY_BACKOFF: 1.5 // Exponential backoff multiplier
};

// Create axios instance for Auth Service
const authApiClient = axios.create({
  baseURL: API_CONFIG.AUTH_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': 'web'
  }
});

// Create axios instance for Main API (future use)
const mainApiClient = axios.create({
  baseURL: API_CONFIG.MAIN_API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': '1.0.0',
    'X-Client-Platform': 'web'
  }
});

// Token management
let authToken = null;
let refreshToken = null;
let isRefreshing = false;
let failedQueue = [];

// Helper function to process failed queue
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Set authentication tokens
export const setAuthTokens = (token, refresh = null) => {
  authToken = token;
  refreshToken = refresh;
  
  if (token) {
    authApiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    mainApiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete authApiClient.defaults.headers.common['Authorization'];
    delete mainApiClient.defaults.headers.common['Authorization'];
  }
};

// Clear authentication tokens
export const clearAuthTokens = () => {
  authToken = null;
  refreshToken = null;
  delete authApiClient.defaults.headers.common['Authorization'];
  delete mainApiClient.defaults.headers.common['Authorization'];
};

// Request interceptor for Auth API
authApiClient.interceptors.request.use(
  (config) => {
    // Add request timestamp
    config.metadata = { startTime: new Date() };
    
    // Temporarily remove X-Correlation-ID due to CORS issue
    // TODO: Re-enable when Railway Auth Service CORS is fixed
    // config.headers['X-Correlation-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔐 Auth API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('🔐 Auth API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for Auth API
authApiClient.interceptors.response.use(
  (response) => {
    // Calculate response time
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    console.log(`✅ Auth API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      duration: `${duration}ms`,
      data: response.data
    });
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ Auth API Error: ${error.response?.status || 'Network'} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
      error: error.message,
      response: error.response?.data
    });

    // Handle 401 Unauthorized - Token refresh logic
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return authApiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        if (refreshToken) {
          const response = await authApiClient.post('/auth/refresh', {
            refreshToken: refreshToken
          });

          const newToken = response.data.token;
          setAuthTokens(newToken, refreshToken);
          
          processQueue(null, newToken);
          
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return authApiClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthTokens();
        
        // Redirect to login or emit logout event
        window.dispatchEvent(new CustomEvent('auth:logout', { 
          detail: { reason: 'token_refresh_failed' } 
        }));
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor for Main API
mainApiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    // Temporarily remove X-Correlation-ID due to CORS issue
    // TODO: Re-enable when Railway Backend CORS is fixed
    // config.headers['X-Correlation-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔗 Main API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('🔗 Main API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for Main API
mainApiClient.interceptors.response.use(
  (response) => {
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    
    console.log(`✅ Main API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      duration: `${duration}ms`,
      data: response.data
    });
    
    return response;
  },
  (error) => {
    console.error(`❌ Main API Error: ${error.response?.status || 'Network'} ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      error: error.message,
      response: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

// Enhanced retry logic for failed requests
const retryRequest = async (apiClient, config, attempt = 1) => {
  try {
    console.log(`🚀 API Request attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`📊 Request config:`, {
      url: config.url,
      method: config.method,
      headers: config.headers,
      timeout: apiClient.defaults.timeout
    });
    
    const response = await apiClient(config);
    console.log(`✅ Request successful on attempt ${attempt}`);
    return response;
  } catch (error) {
    console.error(`❌ Request failed on attempt ${attempt}:`, {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data
    });
    
    const isRetryableError = 
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ENOTFOUND' ||    // DNS resolution failed
      error.code === 'ECONNREFUSED' || // Connection refused
      error.code === 'ETIMEDOUT' ||    // Connection timeout
      error.message?.includes('timeout') || // Timeout in message
      error.message?.includes('Network Error') || // Network error
      error.message?.includes('ERR_NETWORK') || // Chrome network error
      (error.response?.status >= 500 && error.response?.status < 600); // Server errors

    if (attempt < API_CONFIG.RETRY_ATTEMPTS && isRetryableError) {
      const delay = API_CONFIG.RETRY_DELAY * Math.pow(API_CONFIG.RETRY_BACKOFF, attempt - 1);
      console.log(`🔄 Retrying request (${attempt}/${API_CONFIG.RETRY_ATTEMPTS}) after ${delay}ms: ${error.message}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(apiClient, config, attempt + 1);
    }
    
    console.error(`❌ Request failed after ${attempt} attempts:`, error.message);
    
    // Provide more specific error messages
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new Error(`Connection timeout after ${attempt} attempts. Please check your internet connection.`);
    } else if (error.code === 'ENOTFOUND') {
      throw new Error(`Cannot reach server. Please check your internet connection.`);
    } else if (error.response?.status === 401) {
      throw new Error('Invalid username or password');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else {
      throw new Error(error.response?.data?.message || error.message || 'Network error occurred');
    }
  }
};

// Authentication API methods
export const authApi = {
  // Login with retry logic
  login: async (credentials) => {
    try {
      console.log('🔐 Starting login process with enhanced retry logic...');
      const response = await retryRequest(authApiClient, {
        method: 'post',
        url: '/auth/login',
        data: credentials
      });
      
      // Handle different token structures from Production API
      const tokens = response.data.tokens || {};
      const accessToken = tokens.accessToken || response.data.token || response.data.access_token;
      const refreshTokenValue = tokens.refreshToken || response.data.refreshToken || response.data.refresh_token;
      
      // Set tokens after successful login
      if (accessToken) {
        // Store tokens in localStorage
        localStorage.setItem('auth_token', accessToken);
        if (refreshTokenValue) {
          localStorage.setItem('refresh_token', refreshTokenValue);
        }
        
        setAuthTokens(accessToken, refreshTokenValue);
        console.log('✅ Login successful, tokens set and stored in localStorage');
      }
      
      return response.data;
    } catch (error) {
      console.error('🔐 Login failed after all retry attempts:', error);
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  },

  // Logout
  logout: async () => {
    try {
      await authApiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    } finally {
      clearAuthTokens();
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await authApiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },

  // Refresh token
  refreshToken: async (token) => {
    try {
      const response = await authApiClient.post('/auth/refresh', {
        refreshToken: token
      });
      
      if (response.data.token) {
        setAuthTokens(response.data.token, token);
      }
      
      return response.data;
    } catch (error) {
      clearAuthTokens();
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await authApiClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Auth service is not available');
    }
  }
};

// Main API methods (placeholder for future)
export const mainApi = {
  // Users
  getUsers: async (params = {}) => {
    try {
      const response = await mainApiClient.get('/api/v1/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get users');
    }
  },

  // Properties (placeholder)
  getProperties: async (params = {}) => {
    try {
      const response = await mainApiClient.get('/api/v1/properties', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get properties');
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await mainApiClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Main API service is not available');
    }
  }
};

// Error handling utilities
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return { type: 'validation', message: data.message || 'Invalid request data' };
      case 401:
        return { type: 'authentication', message: 'Authentication required' };
      case 403:
        return { type: 'authorization', message: 'Access denied' };
      case 404:
        return { type: 'not_found', message: 'Resource not found' };
      case 429:
        return { type: 'rate_limit', message: 'Too many requests. Please try again later.' };
      case 500:
        return { type: 'server', message: 'Internal server error' };
      default:
        return { type: 'unknown', message: data.message || 'An error occurred' };
    }
  } else if (error.request) {
    // Network error
    return { type: 'network', message: 'Network error. Please check your connection.' };
  } else {
    // Other error
    return { type: 'unknown', message: error.message || 'An unexpected error occurred' };
  }
};

// Initialize tokens from localStorage
const initializeTokens = () => {
  const token = localStorage.getItem('auth_token');
  const refresh = localStorage.getItem('refresh_token');
  
  console.log('🔑 Initializing tokens from localStorage:', { 
    hasToken: !!token, 
    hasRefresh: !!refresh,
    tokenLength: token?.length || 0
  });
  
  if (token) {
    setAuthTokens(token, refresh);
    console.log('✅ Tokens set successfully');
  } else {
    console.log('❌ No token found in localStorage');
  }
};

// Villages API
const villagesApi = {
  // Get all villages
  async getAll() {
    try {
      const response = await mainApiClient.get('/api/villages');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch villages: ${error.response?.data?.message || error.message}`);
    }
  },

  // Get village by ID
  async getById(id) {
    try {
      const response = await mainApiClient.get(`/api/villages/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch village: ${error.response?.data?.message || error.message}`);
    }
  },

  // Create new village
  async create(villageData) {
    try {
      const response = await mainApiClient.post('/api/villages', villageData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create village: ${error.response?.data?.message || error.message}`);
    }
  },

  // Update village
  async update(id, villageData) {
    try {
      const response = await mainApiClient.put(`/api/villages/${id}`, villageData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update village: ${error.response?.data?.message || error.message}`);
    }
  },

  // Delete village
  async delete(id) {
    try {
      const response = await mainApiClient.delete(`/api/villages/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete village: ${error.response?.data?.message || error.message}`);
    }
  }
};

// Initialize on module load
initializeTokens();

export default {
  authApi,
  mainApi,
  villagesApi,
  setAuthTokens,
  clearAuthTokens,
  handleApiError
};

