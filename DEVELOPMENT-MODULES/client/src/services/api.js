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

  googleAuth: () => {
    window.location.href = `${API_URL.replace('/api', '')}/api/auth/google`;
  },

  githubAuth: () => {
    window.location.href = `${API_URL.replace('/api', '')}/api/auth/github`;
  },
};

// Transaction API calls - For Customer Dashboard
export const transactionAPI = {
  // Fetch user transaction history
  getMyTransactions: async () => {
    const response = await api.get('/transactions/my-transactions');
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

export default api;
