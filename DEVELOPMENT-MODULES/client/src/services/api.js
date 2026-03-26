// (no change at top - keep existing imports)
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle global responses (e.g., suspended accounts, expired tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle Suspended Account
      if (error.response.status === 403 && error.response.data?.code === 'ACCOUNT_SUSPENDED') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/suspended';
      }
      // Handle Maintenance Mode
      else if (error.response.status === 503 && error.response.data?.code === 'MAINTENANCE_MODE') {
        window.location.href = '/maintenance';
      }
      // Handle Unauthorized / Expired Token
      else if (error.response.status === 401 && window.location.pathname !== '/signin') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  signIn: async (credentials) => {
    const response = await api.post('/auth/signin', credentials);
    return response.data;
  },

  signUp: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // OAuth: optional loginAs query for role-based redirect
  googleAuth: (loginAs) => {
    const base = `${API_URL.replace('/api', '')}/api/auth/google`;
    window.location.href = loginAs ? `${base}?loginAs=${loginAs}` : base;
  },

  githubAuth: () => {
    window.location.href = `${API_URL.replace('/api', '')}/api/auth/github`;
  },
};

// Transaction API calls - For Customer Dashboard
export const transactionAPI = {
  // Fetch user transaction history
  getMyTransactions: async (accountId) => {
    const response = await api.get('/transactions/my-transactions', {
      params: accountId ? { accountId } : {},
    });
    return response.data;
  },

  // Get all transactions (Admin only)
  getAllTransactions: async (params) => {
    const response = await api.get('/transactions/all', { params });
    return response.data;
  },

  // Update transaction status (Admin only)
  updateStatus: async (transactionId, status) => {
    const response = await api.patch(`/transactions/${transactionId}/status`, { status });
    return response.data;
  },

  // Create a new transaction (Send Money)
  createTransaction: async (data) => {
    // data = { amount, recipient, description, transactionType: 'transfer' }
    const response = await api.post('/transactions/create', data);
    return response.data;
  },

  // Raise a dispute for a specific transaction
  raiseDispute: async (transactionId, reason) => {
    const response = await api.post(`/transactions/${transactionId}/dispute`, { reason });
    return response.data;
  }
};

// Bank Accounts API calls (per-user accounts)
export const accountAPI = {
  getMyAccounts: async () => {
    const response = await api.get('/accounts/my-accounts');
    return response.data;
  },
  addAccount: async (data) => {
    const response = await api.post('/accounts', data);
    return response.data;
  },
};

// User Management API calls (Admin/Analyst)
export const userAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Dashboard API calls (Admin/Analyst overview)
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
  getRecentUsers: async () => {
    const response = await api.get('/dashboard/recent-users');
    return response.data;
  },
};

// Audit & Compliance API calls
export const auditAPI = {
  getLogs: async (params) => {
    const response = await api.get('/audit/logs', { params });
    return response.data;
  },
};

// System Settings API calls (Admin only)
export const settingAPI = {
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  updateSettings: async (settings) => {
    const response = await api.put('/settings', settings);
    return response.data;
  },
};

// Risk Rules API calls (Admin/Analyst)
export const ruleAPI = {
  getAllRules: async () => {
    const response = await api.get('/rules');
    return response.data;
  },
  createRule: async (ruleData) => {
    const response = await api.post('/rules', ruleData);
    return response.data;
  },
  updateRule: async (id, ruleData) => {
    const response = await api.put(`/rules/${id}`, ruleData);
    return response.data;
  },
  deleteRule: async (id) => {
    const response = await api.delete(`/rules/${id}`);
    return response.data;
  }
};

export default api;
