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
  Square,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { alertAPI, dashboardAPI, dataAdminAPI, modelAPI, transactionAPI } from '@/services/api';

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

export default function AnalystDashboardRealV2() {
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [modelLoadingId, setModelLoadingId] = useState('');
  const [dataActionLoading, setDataActionLoading] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [mlMetrics, setMlMetrics] = useState(null);

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

      const [statsRes, alertStatsRes, alertsRes, transactionsRes, modelsRes] = await Promise.all([
        dashboardAPI.getStats(),
        alertAPI.getStats(),
        alertAPI.getAll({ limit: 30 }),
        transactionAPI.getAllTransactions({ limit: 30, page: 1 }),
        modelAPI.getAll(),
      ]);

      setDashboardStats(statsRes.stats || null);
      setAlertStats(alertStatsRes.stats || null);
      setAlerts(alertsRes.alerts || []);
      setTransactions(transactionsRes.transactions || []);
      setModels(modelsRes.models || []);

      try {
        const mlRes = await fetch(import.meta.env.VITE_API_URL + '/ml/metrics');
        if (mlRes.ok) {
          const mlData = await mlRes.json();
          if (mlData && mlData.accuracy) {
            setMlMetrics(mlData);
            setModels(prev => prev.map((m, i) => i === 0 ? Object.assign({}, m, { accuracy: mlData.accuracy, coverage: mlData.coverage, lastTrainedAt: mlData.lastTrained, status: 'active' }) : m));
          }
        }
      } catch (_) {}
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
    }, models.some((model) => model.status === 'training') ? 2500 : 10000);

    return () => clearInterval(interval);
  }, [fetchDashboard, models]);

  useEffect(() => {
    const refreshOnFocus = () => {
      fetchDashboard({ silent: true });
    };

    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboard({ silent: true });
      }
    };

    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisible);

    return () => {
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisible);
    };
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
      if (action === 'stop') await modelAPI.stop(modelId);
      await fetchDashboard({ silent: true });
    } catch (actionError) {
      console.error(actionError);
      setError(actionError.response?.data?.message || 'Failed to update model state');
    } finally {
      setModelLoadingId('');
    }
  };

  const handleDataAction = async (action) => {
    try {
      setDataActionLoading(action);
      setActionMessage('');

      let response;
      if (action === 'restore') response = await dataAdminAPI.restoreLatest();
      if (action === 'clear') response = await dataAdminAPI.clearData();

      setActionMessage(response?.message || 'Action completed successfully.');
      await fetchDashboard({ silent: true });
    } catch (actionError) {
      console.error(actionError);
      setError(actionError.response?.data?.message || 'Failed to complete data action');
    } finally {
      setDataActionLoading('');
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
      helper: `${dashboardStats?.transactions?.dayChange ?? 0}% in last 24h`,
      icon: CreditCard,
      accent: 'bg-blue-50 text-blue-500',
    },
    {
      label: 'Avg Risk Score',
      value: `${alertStats?.avgRiskScore ?? 0}`,
      helper: `${dashboardStats?.transactions?.flagged24h ?? 0} flagged today`,
      icon: Activity,
      accent: 'bg-orange-50 text-orange-500',
    },
    {
      label: 'Model Accuracy',
      value: `${dashboardStats?.models?.avgAccuracy ?? 0}%`,
      helper: `${models.filter((model) => model.status === 'active').length} active models`,
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

            {actionMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {actionMessage}
              </div>
            ) : null}

            {activeView === 'overview' && (
              <>
                <section className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleDataAction('restore')}
                    disabled={dataActionLoading !== ''}
                    className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {dataActionLoading === 'restore' ? 'Restoring...' : 'Restore Backup'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDataAction('clear')}
                    disabled={dataActionLoading !== ''}
                    className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    {dataActionLoading === 'clear' ? 'Clearing...' : 'Delete User Data'}
                  </button>
                </section>

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
                      {dashboardStats?.users?.active ?? 0} active, {dashboardStats?.users?.recentSignups ?? 0} joined this week
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
                    <p className="text-sm font-medium text-slate-500">24h Amount</p>
                    <p className="mt-4 text-3xl font-black">{formatAmount(dashboardStats?.transactions?.totalAmount24h ?? 0)}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Approval rate: {dashboardStats?.transactions?.approvalRate ?? 0}%
                    </p>
                  </div>
                </section>
              </>
            )}

            {activeView === 'alerts' && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Fraud Alerts</h2>
                    <p className="text-sm text-slate-500">Only flagged and blocked fraud cases are listed here.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {alerts.length} alerts
                  </span>
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
                      {alerts.map((alert) => (
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
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {filteredTransactions.length} records
                  </span>
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
                          <span className={mlMetrics ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"}>
                            {mlMetrics ? "● live ML" : "simulated"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{model.type} | {model.version}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {mlMetrics ? `Live model · Trained on ${mlMetrics.totalSamples} samples · Fraud rate ${mlMetrics.fraudRate}%` : "Training controls simulate analyst workflow state and do not run a live neural-network retraining job yet."}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleModelAction(model.id, 'train')}
                          disabled={modelLoadingId === model.id || model.status === 'training'}
                          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {modelLoadingId === model.id && model.status !== 'stopped' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                          Train
                        </button>
                        <button
                          type="button"
                          onClick={() => handleModelAction(model.id, 'stop')}
                          disabled={modelLoadingId === model.id || model.status === 'stopped' || model.status === 'ready'}
                          className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Square className="h-4 w-4" />
                          Stop
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Accuracy</p>
                        <p className="mt-2 text-3xl font-black">{model.accuracy}%</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Coverage</p>
                        <p className="mt-2 text-3xl font-black">{model.coverage}%</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Last Trained</p>
                        <p className="mt-2 text-sm font-semibold text-slate-700">
                          {model.lastTrainedAt ? formatDateTime(model.lastTrainedAt) : 'Not trained yet'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
                        <span>Training Progress</span>
                        <span>{model.progress || 0}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                          style={{ width: `${model.progress || 0}%` }}
                        />
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
