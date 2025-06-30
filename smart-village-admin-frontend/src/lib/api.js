import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://smart-village-backend-production.up.railway.app';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Service Functions
export const apiService = {
  // Health Check
  async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  },

  // Villages API
  villages: {
    // Get all villages
    async getAll() {
      try {
        const response = await apiClient.get('/api/villages');
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch villages: ${error.response?.data?.message || error.message}`);
      }
    },

    // Get village by ID
    async getById(id) {
      try {
        const response = await apiClient.get(`/api/villages/${id}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch village: ${error.response?.data?.message || error.message}`);
      }
    },

    // Create new village
    async create(villageData) {
      try {
        const response = await apiClient.post('/api/villages', villageData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to create village: ${error.response?.data?.message || error.message}`);
      }
    },

    // Update village
    async update(id, villageData) {
      try {
        const response = await apiClient.put(`/api/villages/${id}`, villageData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to update village: ${error.response?.data?.message || error.message}`);
      }
    },

    // Delete village
    async delete(id) {
      try {
        const response = await apiClient.delete(`/api/villages/${id}`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to delete village: ${error.response?.data?.message || error.message}`);
      }
    }
  }
};

// Export API client for direct use if needed
export { apiClient };

// Export API base URL for reference
export { API_BASE_URL };

