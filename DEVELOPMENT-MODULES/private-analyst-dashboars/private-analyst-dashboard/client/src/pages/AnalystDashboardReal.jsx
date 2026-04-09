import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Bell,
  BrainCircuit,
  CreditCard,
  Loader2,
  LogOut,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { alertAPI, dashboardAPI, transactionAPI } from '@/services/api';

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

const getRiskLevelFromScore = (score = 0) => {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
};

export default function AnalystDashboardReal() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (parseError) {
      return {};
    }
  }, []);

  const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [statsRes, alertStatsRes, alertsRes, transactionsRes] = await Promise.all([
        dashboardAPI.getStats(),
        alertAPI.getStats(),
        alertAPI.getAll({ limit: 12 }),
        transactionAPI.getAllTransactions({ limit: 12, page: 1 }),
      ]);

      setDashboardStats(statsRes.stats || null);
      setAlertStats(alertStatsRes.stats || null);
      setAlerts(alertsRes.alerts || []);
      setTransactions(transactionsRes.transactions || []);
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/signin', { replace: true });
  };

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
      helper: `${dashboardStats?.riskRules?.activeRules ?? 0} active rules`,
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
                <h1 className="text-3xl font-black tracking-tight">Overview</h1>
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
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50"
                >
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

            {(activeView === 'overview' || activeView === 'alerts') && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Recent Fraud Alerts</h2>
                    <p className="text-sm text-slate-500">High-risk transactions pulled from live backend data.</p>
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
                        <th className="pb-3 font-medium">Status</th>
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

            {(activeView === 'overview' || activeView === 'transactions') && (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Transaction Monitoring</h2>
                    <p className="text-sm text-slate-500">Latest system transactions with analyst actions.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    {transactions.length} records
                  </span>
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
                      {transactions.map((transaction) => {
                        const riskScore = Math.round((transaction.riskScore || 0) * 100);
                        const riskLevel = getRiskLevelFromScore(riskScore);

                        return (
                          <tr key={transaction._id} className="border-b border-slate-100 last:border-b-0">
                            <td className="py-4 font-mono font-semibold text-indigo-600">
                              TXN-{String(transaction._id).slice(-6).toUpperCase()}
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
                                {riskScore}
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
              <section className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-500">Accuracy Estimate</p>
                  <p className="mt-4 text-4xl font-black tracking-tight">
                    {dashboardStats?.models?.avgAccuracy ?? 0}%
                  </p>
                  <p className="mt-3 text-sm text-slate-400">Derived from current approval and high-risk ratios.</p>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-500">Active Models</p>
                  <p className="mt-4 text-4xl font-black tracking-tight">
                    {dashboardStats?.models?.activeModels ?? 0}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">Currently represented by active risk-rule coverage.</p>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-500">Risk Coverage</p>
                  <p className="mt-4 text-4xl font-black tracking-tight">
                    {dashboardStats?.models?.riskCoverage ?? 0}%
                  </p>
                  <p className="mt-3 text-sm text-slate-400">Share of traffic currently marked high risk.</p>
                </div>
              </section>
            )}

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-indigo-500" />
                  <p className="font-semibold">Users</p>
                </div>
                <p className="mt-4 text-3xl font-black">{dashboardStats?.users?.total ?? 0}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {dashboardStats?.users?.active ?? 0} active, {dashboardStats?.users?.recentSignups ?? 0} joined this week
                </p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <p className="font-semibold">Flagged Frauds</p>
                </div>
                <p className="mt-4 text-3xl font-black">{dashboardStats?.transactions?.flaggedFrauds ?? 0}</p>
                <p className="mt-2 text-sm text-slate-400">
                  {dashboardStats?.transactions?.blockedFrauds ?? 0} blocked across total dataset
                </p>
              </div>
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                  <p className="font-semibold">24h Amount</p>
                </div>
                <p className="mt-4 text-3xl font-black">{formatAmount(dashboardStats?.transactions?.totalAmount24h ?? 0)}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Approval rate: {dashboardStats?.transactions?.approvalRate ?? 0}%
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
