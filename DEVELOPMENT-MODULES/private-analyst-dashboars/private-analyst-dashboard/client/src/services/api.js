
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws';

// ─── Helper: make authenticated requests ────────────────────────────────────
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ─── Helper: handle response ─────────────────────────────────────────────────
const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.response = { data, status: response.status };
    throw error;
  }
  return data;
};

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  signIn: async ({ email, password, rememberMe }) => {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });
    return handleResponse(response);
  },

  signUp: async ({ name, email, password, role }) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return handleResponse(response);
  },

  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  googleAuth: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  githubAuth: () => {
    window.location.href = `${API_BASE_URL}/auth/github`;
  },
};

// ─── Dashboard API ────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAnalystStats: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/analyst-stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getRecentUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/dashboard/recent-users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ─── Transactions API ─────────────────────────────────────────────────────────
export const transactionAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/transactions/all?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (transactionData) => {
    const response = await fetch(`${API_BASE_URL}/transactions/create`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transactionData),
    });
    return handleResponse(response);
  },

  // ✅ NAYA — Transaction approve karo
  approveTransaction: async (txId) => {
    const response = await fetch(`${API_BASE_URL}/data-admin/transactions/${txId}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // ✅ NAYA — Transaction block karo
  blockTransaction: async (txId) => {
    const response = await fetch(`${API_BASE_URL}/data-admin/transactions/${txId}/block`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateStatus: async (txId, status) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${txId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  recover: async (txId) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${txId}/recover`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  delete: async (txId) => {
    const response = await fetch(`${API_BASE_URL}/transactions/${txId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  deleteAll: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions/all`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  recoverAll: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions/recover-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // Backward-compatible names
  getAllTransactions: async (params = {}) => transactionAPI.getAll(params),
  getMyTransactions: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/transactions/my-transactions?accountId=${accountId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  createTransaction: async (transactionData) => transactionAPI.create(transactionData),
};

// ─── Alerts API ───────────────────────────────────────────────────────────────
export const alertAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/alerts?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/alerts/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/alerts/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ─── Users API ────────────────────────────────────────────────────────────────
export const userAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/users?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  updateStatus: async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  create: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  update: async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ─── Accounts API ─────────────────────────────────────────────────────────────
export const accountAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getMyAccount: async () => {
    const response = await fetch(`${API_BASE_URL}/accounts/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getMyNotifications: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/my`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  markRead: async (id) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  markAllRead: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ─── Risk Rules API ───────────────────────────────────────────────────────────
export const riskRuleAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/rules`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  create: async (rule) => {
    const response = await fetch(`${API_BASE_URL}/rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule),
    });
    return handleResponse(response);
  },

  update: async (id, rule) => {
    const response = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getAllRules: async () => riskRuleAPI.getAll(),
  createRule: async (rule) => riskRuleAPI.create(rule),
  updateRule: async (id, rule) => riskRuleAPI.update(id, rule),
  deleteRule: async (id) => riskRuleAPI.delete(id),
};

// ─── Settings API ─────────────────────────────────────────────────────────────
export const settingsAPI = {
  get: async () => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  update: async (settings) => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings),
    });
    return handleResponse(response);
  },

  getSettings: async () => settingsAPI.get(),
  updateSettings: async (settings) => settingsAPI.update(settings),
};

// ─── ML / Model API ───────────────────────────────────────────────────────────
export const mlAPI = {
  predict: async (transactionData) => {
    const response = await fetch(`${API_BASE_URL}/ml/predict`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transactionData),
    });
    return handleResponse(response);
  },

  getModels: async () => {
    const response = await fetch(`${API_BASE_URL}/models`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

export const modelAPI = {
  getAll: async () => {
    const metricsRes = await fetch(`${API_BASE_URL}/ml/metrics`, {
      headers: getAuthHeaders(),
    });

    if (!metricsRes.ok) {
      if (metricsRes.status === 503) {
        return {
          success: true,
          models: [
            {
              id: 'neural-network-v1',
              name: 'Neural Network',
              type: 'Fraud Detection Model',
              version: 'v1.0',
              status: 'not_trained',
              accuracy: 0,
              coverage: 0,
              progress: 0,
              lastTrainedAt: null,
            },
          ],
        };
      }
      return handleResponse(metricsRes);
    }

    const metrics = await metricsRes.json();
    return {
      success: true,
      models: [
        {
          id: 'neural-network-v1',
          name: 'Neural Network',
          type: 'Fraud Detection Model',
          version: 'v1.0',
          status: metrics.status || 'active',
          accuracy: Number(metrics.accuracy || 0),
          coverage: Number(metrics.coverage || 0),
          progress: 100,
          lastTrainedAt: metrics.lastTrained || null,
          totalSamples: metrics.totalSamples || 0,
          fraudRate: metrics.fraudRate || 0,
        },
      ],
    };
  },

  train: async () => {
    const response = await fetch(`${API_BASE_URL}/ml/train`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  stop: async () => {
    return { success: true, message: 'Stop is not supported for this real model.' };
  },
};

// ─── Data Admin API ───────────────────────────────────────────────────────────
export const dataAdminAPI = {
  restoreLatest: async () => {
    const response = await fetch(`${API_BASE_URL}/data-admin/restore-latest`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  clearData: async () => {
    const response = await fetch(`${API_BASE_URL}/data-admin/clear`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ─── Audit API ────────────────────────────────────────────────────────────────
export const auditAPI = {
  getLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/audit?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

// ─── Health Check ─────────────────────────────────────────────────────────────
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  } catch {
    return { status: 'unreachable' };
  }
};

// Alias exports
export const ruleAPI = riskRuleAPI;
export const settingAPI = settingsAPI;

export { WS_URL };
export default API_BASE_URL;