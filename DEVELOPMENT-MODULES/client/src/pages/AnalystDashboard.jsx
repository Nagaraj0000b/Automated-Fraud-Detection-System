import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  BrainCircuit,
  CreditCard,
  Filter,
  Loader2,
  LogOut,
  Search,
  ShieldAlert,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { alertAPI, dashboardAPI, modelAPI, transactionAPI } from '../services/api';

const views = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'alerts', label: 'Fraud Alerts', icon: ShieldAlert },
  { id: 'transactions', label: 'Transactions', icon: CreditCard },
  { id: 'models', label: 'AI Models', icon: BrainCircuit },
];

const riskBadge = {
  Critical: 'bg-red-50 text-red-600',
  High: 'bg-orange-50 text-orange-600',
  Medium: 'bg-amber-50 text-amber-600',
  Low: 'bg-emerald-50 text-emerald-600',
};

const statusBadge = {
  approved: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-amber-50 text-amber-600',
  flagged: 'bg-orange-50 text-orange-600',
  blocked: 'bg-red-50 text-red-600',
  training: 'bg-blue-50 text-blue-600',
  active: 'bg-emerald-50 text-emerald-600',
  ready: 'bg-slate-100 text-slate-600',
  stopped: 'bg-red-50 text-red-600',
};

const formatAmount = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;

const formatDateTime = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const humanizeRiskLevel = (value = '') => {
  if (!value) return 'Low';
  return String(value)
    .replace(/_RISK$/i, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getRiskLevelFromScore = (score = 0) => {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
};

const getDisplayTransactionId = (value = '') => `TXN-${String(value).slice(-6).toUpperCase()}`;

export default function AnalystDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [modelLoadingId, setModelLoadingId] = useState('');
  const [modelsError, setModelsError] = useState('');
  const [mlMetrics, setMlMetrics] = useState(null);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const q = alertSearchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        (alert.alertId && String(alert.alertId).toLowerCase().includes(q)) ||
        (alert.user?.email && alert.user.email.toLowerCase().includes(q)) ||
        (alert.user?.name && alert.user.name.toLowerCase().includes(q))
      );
    });
  }, [alerts, alertSearchTerm]);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const [statsRes, alertStatsRes, alertsRes, transactionsRes] = await Promise.all([
        dashboardAPI.getStats(),
        alertAPI.getStats(),
        alertAPI.getAll({ limit: 30 }),
        transactionAPI.getAllTransactions({ limit: 30, page: 1 }),
      ]);

      let realModels = [];
      try {
        const modelsRes = await modelAPI.getAll();
        realModels = modelsRes.models || [];
        setModelsError('');
      } catch (err) {
        console.error('Failed to fetch models:', err);
        setModelsError('Failed to load AI models data.');
      }

      setDashboardStats(statsRes.stats || null);
      setAlertStats(alertStatsRes.stats || null);
      setAlerts(alertsRes.alerts || []);
      setTransactions(transactionsRes.transactions || []);
      
      setModels(realModels);
      if (realModels[0]) {
        setMlMetrics({
          accuracy: realModels[0].accuracy,
          coverage: realModels[0].coverage,
          lastTrained: realModels[0].lastTrainedAt,
          totalSamples: realModels[0].totalSamples,
          fraudRate: realModels[0].fraudRate,
          status: realModels[0].status,
        });
      } else {
        setMlMetrics(null);
      }
      setError('');
    } catch (fetchError) {
      console.error(fetchError);
      setError(fetchError.response?.data?.message || 'Failed to load analyst dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signin', { replace: true });
      return;
    }
    if (!['admin', 'analyst'].includes(user.role)) {
      navigate('/user-dashboard', { replace: true });
      return;
    }
    fetchDashboard();
  }, [fetchDashboard, navigate, user.role]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard({ silent: true });
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/signin', { replace: true });
  };

  const handleModelAction = async (modelId, action) => {
    try {
      setModelLoadingId(modelId);
      if (action === 'train') await modelAPI.train(modelId);
      await fetchDashboard({ silent: true });
    } catch (actionError) {
      console.error(actionError);
      setError(actionError.response?.data?.message || 'Failed to update model state');
    } finally {
      setModelLoadingId('');
    }
  };

  const handleUpdateTransactionStatus = async (transactionId, newStatus) => {
    try {
      setRefreshing(true);
      const res = await transactionAPI.updateStatus(transactionId, newStatus);
      if (res.success) {
        setTransactions(prev => prev.map(txn => 
          txn._id === transactionId ? { ...txn, status: newStatus } : txn
        ));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update transaction status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteAllTransactions = async () => {
    if (!window.confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) return;
    try {
      setRefreshing(true);
      const res = await transactionAPI.deleteAll();
      if (res.success) {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to delete all transactions:', err);
      setError('Failed to clear transactions');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecoverAllTransactions = async () => {
    if (!window.confirm('Are you sure you want to approve/recover ALL transactions?')) return;
    try {
      setRefreshing(true);
      const res = await transactionAPI.recoverAll();
      if (res.success) {
        setTransactions(prev => prev.map(txn => ({ ...txn, status: 'approved' })));
      }
    } catch (err) {
      console.error('Failed to recover all transactions:', err);
      setError('Failed to recover transactions');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      setRefreshing(true);
      const res = await transactionAPI.delete(id);
      if (res.success) {
        setTransactions(prev => prev.filter(t => t._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setError('Failed to delete');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecoverTransaction = async (id) => {
    try {
      setRefreshing(true);
      const res = await transactionAPI.recover(id);
      if (res.success) {
        setTransactions(prev => prev.map(txn => 
          txn._id === id ? { ...txn, status: 'approved' } : txn
        ));
      }
    } catch (err) {
      console.error('Failed to recover transaction:', err);
      setError('Failed to recover');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const q = searchTerm.trim().toLowerCase();
      const riskScore = transaction.riskScorePercent ?? Math.round((transaction.riskScore || 0) * 100);
      const riskLevel = humanizeRiskLevel(transaction.riskLevel || getRiskLevelFromScore(riskScore));
      const displayTransactionId = getDisplayTransactionId(transaction._id).toLowerCase();

      const matchesSearch =
        !q ||
        String(transaction._id).toLowerCase().includes(q) ||
        displayTransactionId.includes(q) ||
        transaction.recipient?.toLowerCase().includes(q) ||
        transaction.user?.name?.toLowerCase().includes(q) ||
        transaction.user?.email?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || riskLevel.toLowerCase() === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [transactions, searchTerm, statusFilter, riskFilter]);

  const overviewCards = [
    {
      label: 'Fraud Detected',
      value: alertStats?.totalFraudDetected ?? 0,
      helper: `${alertStats?.weekChange ?? 0}% vs previous week`,
      icon: ShieldAlert,
      accent: 'bg-red-50 text-red-500',
    },
    {
      label: 'Total Transactions',
      value: dashboardStats?.transactions?.total24h ?? 0,
      helper: `Real-time activity`,
      icon: CreditCard,
      accent: 'bg-blue-50 text-blue-500',
    },
    {
      label: 'Avg Risk Score',
      value: `${alertStats?.avgRiskScore ?? 0}`,
      helper: `${dashboardStats?.transactions?.flaggedFrauds ?? 0} flagged total`,
      icon: Activity,
      accent: 'bg-orange-50 text-orange-500',
    },
    {
      label: 'Model Accuracy',
      value: `${dashboardStats?.models?.avgAccuracy ?? 0}`,
      helper: `Neural Network Active`,
      icon: BrainCircuit,
      accent: 'bg-emerald-50 text-emerald-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          <span className="text-sm font-medium text-slate-600">Loading analyst dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col bg-slate-900 px-5 py-7 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">FraudGuard</p>
              <p className="text-sm text-slate-400">Analyst Portal</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Navigation</p>
            <div className="mt-4 space-y-2">
              {views.map((view) => {
                const Icon = view.icon;
                const active = activeView === view.id;
                return (
                  <button
                    key={view.id}
                    type="button"
                    onClick={() => setActiveView(view.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                      active
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-950/20'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{view.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto rounded-2xl bg-slate-800/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold">
                {(user.name || 'A').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{user.name || 'Analyst User'}</p>
                <p className="text-sm text-slate-400">{user.email || 'security@team.local'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-400/60 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1">
          <header className="border-b border-slate-200 bg-white/90 px-6 py-5 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  {views.find((view) => view.id === activeView)?.label || 'Overview'}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  LIVE
                </span>
                <button
                  type="button"
                  onClick={() => fetchDashboard({ silent: true })}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <button type="button" className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50">
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {activeView === 'overview' && (
              <>
                <section className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
                  {overviewCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-slate-500">{card.label}</p>
                            <p className="mt-4 text-4xl font-black tracking-tight">{card.value}</p>
                            <p className="mt-3 text-sm text-slate-400">{card.helper}</p>
                          </div>
                          <div className={`rounded-2xl p-3 ${card.accent}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>

                <section className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-500">Users</p>
                    <p className="mt-4 text-3xl font-black">{dashboardStats?.users?.total ?? 0}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {dashboardStats?.users?.active ?? 0} active, {dashboardStats?.users?.recentSignups ?? 0} joined recently
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-500">Blocked Frauds</p>
                    <p className="mt-4 text-3xl font-black">{dashboardStats?.transactions?.blockedFrauds ?? 0}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {dashboardStats?.transactions?.flaggedFrauds ?? 0} total flagged records
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <p className="text-sm font-medium text-slate-500">Approval Rate</p>
                    <p className="mt-4 text-3xl font-black">{dashboardStats?.transactions?.approvalRate ?? '100%'}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Based on overall transaction history
                    </p>
                  </div>
                </section>
              </>
            )}

            {activeView === 'alerts' && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Fraud Alerts</h2>
                    <p className="text-sm text-slate-500">Only flagged and blocked fraud cases are listed here.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {filteredAlerts.length} alerts
                  </span>
                </div>

                <div className="mb-5 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={alertSearchTerm}
                    onChange={(event) => setAlertSearchTerm(event.target.value)}
                    placeholder="Search by user or alert id"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="text-slate-400">
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 font-medium">Alert ID</th>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Risk</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAlerts.map((alert) => (
                        <tr key={alert._id} className="border-b border-slate-100 last:border-b-0">
                          <td className="py-4 font-semibold text-indigo-600">{alert.alertId}</td>
                          <td className="py-4">{alert.user?.email || 'Unknown user'}</td>
                          <td className="py-4 font-semibold">{formatAmount(alert.amount)}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full ${
                                    alert.riskLevel === 'Critical'
                                      ? 'bg-red-500'
                                      : alert.riskLevel === 'High'
                                        ? 'bg-orange-500'
                                        : alert.riskLevel === 'Medium'
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(alert.riskScore, 100)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-slate-700">{alert.riskScore}</span>
                            </div>
                          </td>
                          <td className="py-4 text-slate-600">{alert.type}</td>
                          <td className="py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadge[alert.riskLevel] || riskBadge.Low}`}>
                              {alert.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeView === 'transactions' && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Transaction Monitoring</h2>
                    <p className="text-sm text-slate-500">Search and filter system transactions quickly.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDeleteAllTransactions}
                      className="flex items-center px-4 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors border border-red-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Delete All
                    </button>
                    <button 
                      onClick={handleRecoverAllTransactions}
                      className="flex items-center px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors border border-indigo-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Recover All
                    </button>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                      {filteredTransactions.length} records
                    </span>
                  </div>
                </div>

                <div className="mb-5 grid gap-3 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by txn id, user, email, recipient"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-indigo-300"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-indigo-300"
                    >
                      <option value="all">All Status</option>
                      <option value="approved">Approved</option>
                      <option value="flagged">Flagged</option>
                      <option value="blocked">Blocked</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-300"
                  >
                    <option value="all">All Risk</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="text-slate-400">
                      <tr className="border-b border-slate-100">
                        <th className="pb-3 font-medium">Txn ID</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Recipient</th>
                        <th className="pb-3 font-medium">Amount</th>
                         <th className="pb-3 font-medium">Risk</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">AI Recommendation</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => {
                        const riskScore = transaction.riskScorePercent ?? Math.round((transaction.riskScore || 0) * 100);
                        const riskLevel = humanizeRiskLevel(transaction.riskLevel || getRiskLevelFromScore(riskScore));

                        return (
                          <tr key={transaction._id} className="border-b border-slate-100 last:border-b-0">
                            <td className="py-4 font-mono font-semibold text-indigo-600">
                              {getDisplayTransactionId(transaction._id)}
                            </td>
                            <td className="py-4 text-slate-500">{formatDateTime(transaction.createdAt)}</td>
                            <td className="py-4">
                              <div className="font-medium text-slate-800">{transaction.user?.name || 'Unknown User'}</div>
                              <div className="text-slate-500">{transaction.user?.email || 'N/A'}</div>
                            </td>
                            <td className="py-4 text-slate-600">{transaction.recipient}</td>
                            <td className="py-4 font-semibold">{formatAmount(transaction.amount)}</td>
                            <td className="py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${riskBadge[riskLevel] || riskBadge.Low}`}>
                                {riskScore}% {riskLevel}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadge[transaction.status] || 'bg-slate-100 text-slate-600'}`}>
                                {transaction.status}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                riskScore >= 80 ? 'bg-red-50 text-red-600' : 
                                riskScore >= 50 ? 'bg-amber-50 text-amber-600' : 
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                                {riskScore >= 80 ? 'Block Recommended' : riskScore >= 50 ? 'Flag for Review' : 'Safe to Approve'}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleUpdateTransactionStatus(transaction._id, 'approved')}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleUpdateTransactionStatus(transaction._id, 'flagged')}
                                  className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                  title="Flag for Review"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleUpdateTransactionStatus(transaction._id, 'blocked')}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Block"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <div className="w-px h-4 bg-slate-200 mx-1" />
                                <button 
                                  onClick={() => handleRecoverTransaction(transaction._id)}
                                  className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                  title="Recover / Approve"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTransaction(transaction._id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeView === 'models' && (
              <section className="space-y-4">
                {modelsError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {modelsError}
                  </div>
                ) : null}
                {models.map((model) => (
                  <div key={model.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <BrainCircuit className="h-6 w-6 text-indigo-500" />
                          <h2 className="text-2xl font-black tracking-tight">{model.name}</h2>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadge[model.status] || 'bg-slate-100 text-slate-600'}`}>
                            {model.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{model.type} | {model.version}</p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleModelAction(model.id, 'train')}
                          disabled={modelLoadingId === model.id || model.status === 'training'}
                          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {modelLoadingId === model.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                          {model.status === 'training' ? 'Training...' : 'Train Model'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
