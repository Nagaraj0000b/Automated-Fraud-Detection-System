import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeftRight,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  UserRound,
} from 'lucide-react';
import { alertAPI, authAPI, ruleAPI, transactionAPI } from '../services/api';
import { getHomePathForUser } from '../lib/auth';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'alerts', label: 'Fraud Alerts', icon: AlertTriangle },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'rules', label: 'Detection Rules', icon: ShieldAlert },
];

const ALERT_LEVEL = {
  Critical: 'border-red-500/30 bg-red-500/10 text-red-100',
  High: 'border-orange-500/30 bg-orange-500/10 text-orange-100',
  Medium: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  Low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
};

const ALERT_STATUS = {
  open: 'border-red-500/30 bg-red-500/10 text-red-100',
  reviewed: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  resolved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  false_positive: 'border-slate-500/30 bg-slate-500/10 text-slate-100',
};

const TX_STATUS = {
  approved: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
  flagged: 'border-orange-500/30 bg-orange-500/10 text-orange-100',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-100',
};

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function dateTime(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function label(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function risk(value) {
  return Math.round(Number(value || 0) * 100);
}

function matches(values, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return values.some((value) => String(value || '').toLowerCase().includes(q));
}

function Badge({ text, tone }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{text}</span>;
}

export default function AnalystDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [rulesError, setRulesError] = useState('');
  const [actioning, setActioning] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [rules, setRules] = useState([]);
  const [alertSearch, setAlertSearch] = useState('');
  const [alertLevel, setAlertLevel] = useState('all');
  const [alertStatus, setAlertStatus] = useState('all');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionStatus, setTransactionStatus] = useState('all');

  const loadData = async (full = false) => {
    if (full) setLoading(true);
    else setRefreshing(true);
    setError('');

    const storedUser = readStoredUser();
    const failures = [];

    try {
      const [meRes, statsRes, alertsRes, recentRes, txRes, rulesRes] = await Promise.allSettled([
        authAPI.getMe(),
        alertAPI.getStats(),
        alertAPI.getAll({ limit: 200 }),
        alertAPI.getRecent(),
        transactionAPI.getAllTransactions({ limit: 200 }),
        ruleAPI.getAllRules(),
      ]);

      if (meRes.status === 'fulfilled') {
        const nextUser = { ...storedUser, ...(meRes.value.user || {}) };
        if (nextUser.role && !['admin', 'analyst'].includes(nextUser.role)) {
          navigate(getHomePathForUser(nextUser), { replace: true });
          return;
        }
        setUser(nextUser);
      } else if (storedUser?.role) {
        setUser(storedUser);
      }

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats || null);
      else failures.push(statsRes.reason?.response?.data?.message || 'Alert stats unavailable.');

      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.alerts || []);
      else failures.push(alertsRes.reason?.response?.data?.message || 'Alerts unavailable.');

      if (recentRes.status === 'fulfilled') setRecentAlerts(recentRes.value.alerts || []);
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value.transactions || []);
        setTransactionTotal(txRes.value.total || 0);
      } else {
        failures.push(txRes.reason?.response?.data?.message || 'Transactions unavailable.');
      }

      if (rulesRes.status === 'fulfilled') {
        setRules(rulesRes.value.data || []);
        setRulesError('');
      } else {
        setRules([]);
        setRulesError(rulesRes.reason?.response?.data?.message || 'Rules unavailable.');
      }

      setError(failures.join(' '));
      setUpdatedAt(new Date().toISOString());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = readStoredUser();

    if (!token) {
      navigate('/signin', { replace: true });
      return;
    }

    if (storedUser?.role && !['admin', 'analyst'].includes(storedUser.role)) {
      navigate(getHomePathForUser(storedUser), { replace: true });
      return;
    }

    if (storedUser?.role) setUser(storedUser);
    void loadData(true);
  }, [navigate]);

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (logoutError) {
      console.error(logoutError);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
      navigate('/signin', { replace: true });
    }
  };

  const updateTransaction = async (transactionId, status) => {
    setActioning(`${transactionId}:${status}`);
    try {
      await transactionAPI.updateStatus(transactionId, status);
      await loadData(false);
    } catch (actionError) {
      setError(actionError.response?.data?.message || 'Transaction action failed.');
    } finally {
      setActioning('');
    }
  };

  const filteredAlerts = alerts.filter((item) => {
    if (alertLevel !== 'all' && item.riskLevel !== alertLevel) return false;
    if (alertStatus !== 'all' && item.status !== alertStatus) return false;
    return matches([item.alertId, item.user?.email, item.user?.name, item.type, item.location], alertSearch);
  });

  const filteredTransactions = transactions.filter((item) => {
    if (transactionStatus !== 'all' && item.status !== transactionStatus) return false;
    return matches(
      [item._id, item.user?.email, item.user?.name, item.recipient, item.description, item.location],
      transactionSearch
    );
  });

  const activeRules = rules.filter((rule) => rule.isActive).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
          <span>Loading live analyst data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      <aside className="border-b border-white/10 bg-slate-900/80 p-5 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-cyan-100">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold">FraudGuard</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Live Analyst Desk</p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-800 p-3">
              <UserRound className="h-5 w-5 text-cyan-100" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name || 'Analyst User'}</p>
              <p className="truncate text-xs uppercase tracking-[0.2em] text-slate-400">{label(user?.role || 'analyst')}</p>
            </div>
          </div>
          <p className="mt-3 truncate text-xs text-slate-400">{user?.email || 'No email available'}</p>
        </div>

        <nav className="mt-6 space-y-2">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                  active ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100 hover:bg-red-500/20 lg:mt-10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Live Monitoring</p>
            <h1 className="mt-2 text-2xl font-semibold">{TABS.find((item) => item.id === tab)?.label}</h1>
            <p className="mt-1 text-sm text-slate-400">{updatedAt ? `Last refresh: ${dateTime(updatedAt)}` : 'Waiting for first refresh'}</p>
          </div>
          <button
            type="button"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error ? <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">{error}</div> : null}

        {tab === 'overview' ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">High Risk Alerts</p><p className="mt-3 text-3xl font-semibold">{stats?.totalFraudDetected ?? alerts.length}</p><p className="mt-2 text-sm text-slate-400">{stats?.weekChange ?? 0}% vs previous week</p></div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Average Risk Score</p><p className="mt-3 text-3xl font-semibold">{stats?.avgRiskScore ?? 0}</p><p className="mt-2 text-sm text-slate-400">Across live alert records</p></div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Transactions Monitored</p><p className="mt-3 text-3xl font-semibold">{transactionTotal}</p><p className="mt-2 text-sm text-slate-400">{transactions.length} latest records loaded</p></div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Rules</p><p className="mt-3 text-3xl font-semibold">{activeRules}</p><p className="mt-2 text-sm text-slate-400">{rules.length} total live rules</p></div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Recent Live Alerts</h2><button type="button" onClick={() => setTab('alerts')} className="text-sm text-cyan-200">View all</button></div>
                <div className="space-y-3">
                  {recentAlerts.length ? recentAlerts.slice(0, 6).map((item) => (
                    <div key={item._id} className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div><p className="font-semibold">{item.alertId}</p><p className="text-sm text-slate-300">{item.user?.email || 'Unknown account'}</p></div>
                        <div className="flex flex-wrap gap-2">
                          <Badge text={item.riskLevel} tone={ALERT_LEVEL[item.riskLevel] || ALERT_LEVEL.Low} />
                          <Badge text={label(item.status)} tone={ALERT_STATUS[item.status] || ALERT_STATUS.reviewed} />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400"><span>{money(item.amount)}</span><span>{item.riskScore}% risk</span><span>{dateTime(item.createdAt)}</span></div>
                    </div>
                  )) : <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-slate-400">No live alerts available yet.</div>}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-lg font-semibold">Severity Breakdown</h2>
                <div className="mt-4 space-y-3">
                  {['Critical', 'High', 'Medium', 'Low'].map((level) => (
                    <div key={level} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4">
                      <span>{level}</span>
                      <Badge text={String(stats?.byLevel?.[level] || 0)} tone={ALERT_LEVEL[level] || ALERT_LEVEL.Low} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'alerts' ? (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={alertSearch} onChange={(event) => setAlertSearch(event.target.value)} placeholder="Search alert, user, type" className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-400/40" /></label>
              <select value={alertLevel} onChange={(event) => setAlertLevel(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-cyan-400/40"><option value="all">All severity</option><option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select>
              <select value={alertStatus} onChange={(event) => setAlertStatus(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-cyan-400/40"><option value="all">All statuses</option><option value="open">Open</option><option value="reviewed">Reviewed</option><option value="resolved">Resolved</option><option value="false_positive">False Positive</option></select>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {filteredAlerts.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-[0.2em] text-slate-400"><tr><th className="px-5 py-4">Alert</th><th className="px-5 py-4">Account</th><th className="px-5 py-4">Risk</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th></tr></thead>
                    <tbody className="divide-y divide-white/10 text-sm text-slate-200">
                      {filteredAlerts.map((item) => (
                        <tr key={item._id}>
                          <td className="px-5 py-4"><p className="font-semibold">{item.alertId}</p><p className="mt-1 text-xs text-slate-500">{item.type}</p></td>
                          <td className="px-5 py-4"><p>{item.user?.email || 'Unknown account'}</p><p className="mt-1 text-xs text-slate-500">{item.location || 'No location'}</p></td>
                          <td className="px-5 py-4"><div className="flex items-center gap-2"><Badge text={item.riskLevel} tone={ALERT_LEVEL[item.riskLevel] || ALERT_LEVEL.Low} /><span className="text-xs text-slate-400">{item.riskScore}%</span></div></td>
                          <td className="px-5 py-4">{money(item.amount)}</td>
                          <td className="px-5 py-4"><Badge text={label(item.status)} tone={ALERT_STATUS[item.status] || ALERT_STATUS.reviewed} /></td>
                          <td className="px-5 py-4"><div className="flex flex-wrap gap-2">{item.transactionId ? (<><button type="button" onClick={() => updateTransaction(item.transactionId, 'approved')} disabled={actioning === `${item.transactionId}:approved`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 disabled:opacity-60">Approve</button><button type="button" onClick={() => updateTransaction(item.transactionId, 'blocked')} disabled={actioning === `${item.transactionId}:blocked`} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 disabled:opacity-60">Block</button></>) : <span className="text-xs text-slate-500">No action</span>}</div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="px-5 py-10 text-center text-sm text-slate-400">No live alerts match the current filters.</div>}
            </div>
          </div>
        ) : null}

        {tab === 'transactions' ? (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search tx, user, recipient" className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-sm outline-none focus:border-cyan-400/40" /></label>
              <select value={transactionStatus} onChange={(event) => setTransactionStatus(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm outline-none focus:border-cyan-400/40"><option value="all">All statuses</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="flagged">Flagged</option><option value="blocked">Blocked</option></select>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {filteredTransactions.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-[0.2em] text-slate-400"><tr><th className="px-5 py-4">Transaction</th><th className="px-5 py-4">Account</th><th className="px-5 py-4">Recipient</th><th className="px-5 py-4">Risk</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Review</th></tr></thead>
                    <tbody className="divide-y divide-white/10 text-sm text-slate-200">
                      {filteredTransactions.map((item) => {
                        const txId = item._id || item.id;
                        return (
                          <tr key={txId}>
                            <td className="px-5 py-4"><p className="font-semibold">{txId}</p><p className="mt-1 text-xs text-slate-500">{dateTime(item.createdAt)}</p></td>
                            <td className="px-5 py-4"><p>{item.user?.email || item.user?.name || 'Unknown account'}</p><p className="mt-1 text-xs text-slate-500">{item.location || 'No location'}</p></td>
                            <td className="px-5 py-4"><p>{item.recipient || 'No recipient'}</p><p className="mt-1 text-xs text-slate-500">{item.description || 'No description'}</p></td>
                            <td className="px-5 py-4"><p>{money(item.amount)}</p><p className="mt-1 text-xs text-slate-400">{risk(item.riskScore)}% risk</p></td>
                            <td className="px-5 py-4"><Badge text={label(item.status)} tone={TX_STATUS[item.status] || TX_STATUS.pending} /></td>
                            <td className="px-5 py-4"><div className="flex flex-wrap gap-2">{['approved', 'flagged', 'blocked'].map((status) => (<button key={status} type="button" onClick={() => updateTransaction(txId, status)} disabled={item.status === status || actioning === `${txId}:${status}`} className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${status === 'approved' ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : status === 'flagged' ? 'border border-orange-500/30 bg-orange-500/10 text-orange-100' : 'border border-red-500/30 bg-red-500/10 text-red-100'}`}>{label(status)}</button>))}</div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <div className="px-5 py-10 text-center text-sm text-slate-400">No live transactions match the current filters.</div>}
            </div>
          </div>
        ) : null}

        {tab === 'rules' ? (
          <div className="space-y-6">
            {rulesError ? <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">{rulesError}</div> : null}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Rules</p><p className="mt-3 text-3xl font-semibold">{rules.length}</p></div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Rules</p><p className="mt-3 text-3xl font-semibold">{activeRules}</p></div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5"><p className="text-xs uppercase tracking-[0.2em] text-slate-400">Inactive Rules</p><p className="mt-3 text-3xl font-semibold">{Math.max(rules.length - activeRules, 0)}</p></div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {rules.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-slate-900/70 text-left text-xs uppercase tracking-[0.2em] text-slate-400"><tr><th className="px-5 py-4">Rule</th><th className="px-5 py-4">Target</th><th className="px-5 py-4">Threshold</th><th className="px-5 py-4">Severity</th><th className="px-5 py-4">State</th></tr></thead>
                    <tbody className="divide-y divide-white/10 text-sm text-slate-200">
                      {rules.map((item) => (
                        <tr key={item._id}>
                          <td className="px-5 py-4"><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.description}</p></td>
                          <td className="px-5 py-4">{label(item.targetField)}</td>
                          <td className="px-5 py-4">{item.operator} {String(item.value)}</td>
                          <td className="px-5 py-4"><Badge text={item.severity} tone={ALERT_LEVEL[item.severity] || ALERT_LEVEL.Low} /></td>
                          <td className="px-5 py-4"><Badge text={item.isActive ? 'Active' : 'Inactive'} tone={item.isActive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-slate-500/30 bg-slate-500/10 text-slate-100'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <div className="px-5 py-10 text-center text-sm text-slate-400">No live rules available.</div>}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
