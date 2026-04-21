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
  (error) => Promise.reject(error)
);

// Handle global responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 403 && error.response.data?.code === 'ACCOUNT_SUSPENDED') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/suspended';
      } else if (error.response.status === 503 && error.response.data?.code === 'MAINTENANCE_MODE') {
        window.location.href = '/maintenance';
      } else if (error.response.status === 401 && window.location.pathname !== '/signin') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────────────
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
  googleAuth: (loginAs) => {
    const base = `${API_URL.replace('/api', '')}/api/auth/google`;
    window.location.href = loginAs ? `${base}?loginAs=${loginAs}` : base;
  },
  githubAuth: () => {
    window.location.href = `${API_URL.replace('/api', '')}/api/auth/github`;
  },
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export const transactionAPI = {
  getMyTransactions: async (accountId) => {
    const response = await api.get('/transactions/my-transactions', {
      params: accountId ? { accountId } : {},
    });
    return response.data;
  },
  getAllTransactions: async (params) => {
    const response = await api.get('/transactions/all', { params });
    return response.data;
  },
  updateStatus: async (transactionId, status) => {
    const response = await api.patch(`/transactions/${transactionId}/status`, { status });
    return response.data;
  },
  createTransaction: async (data) => {
    const response = await api.post('/transactions/create', data);
    return response.data;
  },
  raiseDispute: async (transactionId, reason) => {
    const response = await api.post(`/transactions/${transactionId}/dispute`, { reason });
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
  deleteAll: async () => {
    const response = await api.delete('/transactions/all');
    return response.data;
  },
  recover: async (id) => {
    const response = await api.patch(`/transactions/${id}/recover`);
    return response.data;
  },
  recoverAll: async () => {
    const response = await api.patch('/transactions/recover-all');
    return response.data;
  },
};

// ─── FRAUD ALERTS (NEW) ───────────────────────────────────────────────────────
export const alertAPI = {
  // Get all alerts with optional filters: { status, riskLevel, limit, page }
  getAll: async (params) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },
  // Last 4 hours alerts for dashboard widget
  getRecent: async () => {
    const response = await api.get('/alerts/recent');
    return response.data;
  },
  // Stat card numbers: totalFraudDetected, avgRiskScore, weekChange, byLevel
  getStats: async () => {
    const response = await api.get('/alerts/stats');
    return response.data;
  },
  // Update alert status: 'open' | 'reviewed' | 'resolved' | 'false_positive'
  updateStatus: async (alertId, status, notes = '') => {
    const response = await api.patch(`/alerts/${alertId}/status`, { status, notes });
    return response.data;
  },
  // Manually score a transaction by ID
  scoreTransaction: async (transactionId) => {
    const response = await api.post('/alerts/score', { transactionId });
    return response.data;
  },
};

// ─── WEBSOCKET SERVICE (NEW) ──────────────────────────────────────────────────
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

export const websocketService = {
  ws: null,
  listeners: new Map(),
  pingInterval: null,

  // Connect with JWT token — only for analyst/admin/auditor
  connect() {
    const token = localStorage.getItem('authToken');
    if (!token || this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(`${WS_URL}?token=${token}`);

    this.ws.onopen = () => {
      console.log('[WS] Connected to live fraud alert stream');
      // Keepalive ping every 30s
      this.pingInterval = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Notify all registered listeners for this message type
        const handlers = this.listeners.get(data.type) || [];
        handlers.forEach((fn) => fn(data));
        // Also notify wildcard listeners
        const allHandlers = this.listeners.get('*') || [];
        allHandlers.forEach((fn) => fn(data));
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    this.ws.onclose = (e) => {
      console.log('[WS] Disconnected:', e.code);
      clearInterval(this.pingInterval);
      // Auto-reconnect after 5s if not intentional close
      if (e.code !== 1000 && e.code !== 4001 && e.code !== 4003) {
        setTimeout(() => this.connect(), 5000);
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };
  },

  disconnect() {
    clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close(1000, 'User logout');
      this.ws = null;
    }
    this.listeners.clear();
  },

  // Register event listener: type = 'fraud_alert' | 'stats_update' | '*'
  on(type, fn) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(fn);
  },

  // Remove event listener
  off(type, fn) {
    const handlers = this.listeners.get(type) || [];
    this.listeners.set(type, handlers.filter((h) => h !== fn));
  },
};

// ─── ACCOUNTS ────────────────────────────────────────────────────────────────
export const accountAPI = {
  getMyAccounts: async () => {
    const response = await api.get('/accounts/my-accounts');
    return response.data;
  },
  addAccount: async (data) => {
    const response = await api.post('/accounts', data);
    return response.data;
  },
  addMoney: async (data) => {
    const response = await api.post('/accounts/add-money', data);
    return response.data;
  },
};

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────
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
  submitReactivationRequest: async (data) => {
    const response = await api.post('/users/reactivation-request', data);
    return response.data;
  },
  getReactivationRequestStatusPublic: async (email) => {
    const response = await api.get(`/users/reactivation-request/${encodeURIComponent(email)}`);
    return response.data;
  },
  getReactivationRequests: async () => {
    const response = await api.get('/users/reactivation-requests');
    return response.data;
  },
  updateReactivationStatus: async (id, data) => {
    const response = await api.patch(`/users/reactivation-requests/${id}/status`, data);
    return response.data;
  },
  unblockUser: async (userId) => {
    const response = await api.put(`/users/unblock/${userId}`);
    return response.data;
  }
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
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

export const dataAdminAPI = {
  restoreLatest: async () => {
    const response = await api.post('/data-admin/restore-latest');
    return response.data;
  },
  clearData: async () => {
    const response = await api.delete('/data-admin/clear');
    return response.data;
  },
};

// Support / Customer Care API
export const supportAPI = {
  createTicket: async (payload) => {
    const response = await api.post('/support/contact', payload);
    return response.data;
  },
  getTickets: async () => {
    const response = await api.get('/support/tickets');
    return response.data;
  },
};

// ─── AUDIT & COMPLIANCE ───────────────────────────────────────────────────────
export const auditAPI = {
  getLogs: async (params) => {
    const response = await api.get('/audit/logs', { params });
    return response.data;
  },
};

export const notificationAPI = {
  getMyNotifications: async () => {
    const response = await api.get('/notifications/my');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
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

// ─── RISK RULES ───────────────────────────────────────────────────────────────
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
  },
};

export const modelAPI = {
  getAll: async () => {
    const response = await api.get('/models');
    return response.data;
  },
  train: async (id) => {
    const response = await api.post(`/models/${id}/train`);
    return response.data;
  },
  stop: async (id) => {
    const response = await api.post(`/models/${id}/stop`);
    return response.data;
  },
};

export default api;
