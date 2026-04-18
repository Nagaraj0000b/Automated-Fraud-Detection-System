import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Search, RefreshCw, CheckCircle, XCircle, AlertTriangle, Trash2, RotateCcw } from "lucide-react";
import { transactionAPI } from '../../services/api';

export default function TransactionMonitoring() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState('');

  const loadTransactions = useCallback(async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await transactionAPI.getAllTransactions({ limit: 50 });
      if (res.success) setTransactions(res.transactions);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  const handleUpdateStatus = async (txId, status) => {
    setActionLoadingId(txId);
    try {
      const res = await transactionAPI.updateStatus(txId, status);
      if (res.success) {
        setTransactions(prev =>
          prev.map(tx => tx._id === txId ? { ...tx, status } : tx)
        );
      }
    } catch (err) {
      alert('Action failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoadingId('');
    }
  };

  const handleDelete = async (txId) => {
    if (!window.confirm('Delete this transaction?')) return;
    setActionLoadingId(txId);
    try {
      const res = await transactionAPI.delete(txId);
      if (res.success) {
        setTransactions(prev => prev.filter(tx => tx._id !== txId));
      }
    } catch (err) {
      alert('Delete failed');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleRecover = async (txId) => {
    setActionLoadingId(txId);
    try {
      const res = await transactionAPI.recover(txId);
      if (res.success) {
        setTransactions(prev =>
          prev.map(tx => tx._id === txId ? { ...tx, status: 'approved' } : tx)
        );
      }
    } catch (err) {
      alert('Recovery failed');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete ALL transactions?')) return;
    setRefreshing(true);
    try {
      const res = await transactionAPI.deleteAll();
      if (res.success) setTransactions([]);
    } catch (err) {
      alert('Clear failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRecoverAll = async () => {
    if (!window.confirm('Recover/Approve ALL transactions?')) return;
    setRefreshing(true);
    try {
      const res = await transactionAPI.recoverAll();
      if (res.success) loadTransactions(true);
    } catch (err) {
      alert('Recover all failed');
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = transactions.filter(tx => {
    const q = search.toLowerCase();
    const matchSearch =
      (tx._id || '').toLowerCase().includes(q) ||
      (tx.recipient || '').toLowerCase().includes(q) ||
      (tx.user?.name || '').toLowerCase().includes(q) ||
      String(tx.amount).includes(q);
    const matchStatus = filterStatus === 'all' || tx.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-emerald-100 text-emerald-700',
      pending:  'bg-blue-100 text-blue-700',
      flagged:  'bg-amber-100 text-amber-700',
      blocked:  'bg-red-100 text-red-700',
    };
    return styles[status] || 'bg-slate-100 text-slate-600';
  };

  const getRiskStyle = (score = 0) => {
    if (score >= 80) return { badge: 'bg-red-100 text-red-700', label: 'Critical', color: 'bg-red-500' };
    if (score >= 50) return { badge: 'bg-orange-100 text-orange-700', label: 'High', color: 'bg-orange-500' };
    if (score >= 20) return { badge: 'bg-amber-100 text-amber-700', label: 'Medium', color: 'bg-amber-500' };
    return { badge: 'bg-emerald-100 text-emerald-700', label: 'Low', color: 'bg-emerald-500' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transaction Monitoring</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time fraud detection and manual review system</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={handleRecoverAll}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
                <RotateCcw className="w-4 h-4" /> Recover All
            </button>
            <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
            >
                <Trash2 className="w-4 h-4" /> Delete All
            </button>
            <button
                onClick={() => loadTransactions()}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center px-3 py-2 bg-white border border-slate-200 rounded-md flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>

        <div className="flex gap-1 flex-wrap">
          {['all', 'pending', 'approved', 'flagged', 'blocked'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                filterStatus === s ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm animate-pulse">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm italic">No records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Recipient</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Risk</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => {
                    const risk = getRiskStyle(tx.riskScorePercent);
                    const isBusy = actionLoadingId === tx._id;
                    return (
                      <tr key={tx._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-indigo-600 font-bold">TXN-{tx._id?.slice(-6).toUpperCase()}</td>
                        <td className="px-5 py-4">
                          <div className="font-medium">{tx.user?.name || 'User'}</div>
                          <div className="text-xs text-slate-400">{tx.user?.email}</div>
                        </td>
                        <td className="px-5 py-4">{tx.recipient}</td>
                        <td className="px-5 py-4 font-bold">₹{tx.amount?.toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusBadge(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${risk.badge}`}>{tx.riskScorePercent}%</span>
                             <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${risk.color}`} style={{ width: `${tx.riskScorePercent}%` }} />
                             </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <div className="flex justify-end gap-1">
                              <button disabled={isBusy} onClick={() => handleUpdateStatus(tx._id, 'approved')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                              <button disabled={isBusy} onClick={() => handleUpdateStatus(tx._id, 'flagged')} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Flag"><AlertTriangle className="w-4 h-4" /></button>
                              <button disabled={isBusy} onClick={() => handleUpdateStatus(tx._id, 'blocked')} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Block"><XCircle className="w-4 h-4" /></button>
                              <button disabled={isBusy} onClick={() => handleRecover(tx._id)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Recover"><RotateCcw className="w-4 h-4" /></button>
                              <button disabled={isBusy} onClick={() => handleDelete(tx._id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-[10px] text-slate-400 text-right uppercase tracking-widest">{filtered.length} total records matched</p>
    </div>
  );
}
