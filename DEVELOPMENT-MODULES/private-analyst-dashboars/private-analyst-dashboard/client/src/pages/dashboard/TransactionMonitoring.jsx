import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Filter, ArrowUpDown, Loader2, MoreVertical, CheckCircle, XCircle, AlertTriangle, UserX } from "lucide-react";
import { transactionAPI, userAPI } from '@/services/api';
import { getDecisionRecommendation, getDecisionTone } from '@/lib/adminDecision';

export default function TransactionMonitoring() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Pagination & Filtering
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [updatingTxnId, setUpdatingTxnId] = useState(null);

    // Dropdown state for simple row-level actions
    const [openDropdown, setOpenDropdown] = useState(null);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await transactionAPI.getAllTransactions({
                page,
                limit: 15,
                search: searchTerm,
                status: statusFilter
            });
            
            if (response.success) {
                setTransactions(response.transactions);
                setTotalPages(response.pages);
                setError(null);
            }
        } catch (err) {
            setError('Failed to load transactions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search slightly
        const delayDebounceFn = setTimeout(() => {
            fetchTransactions();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [page, searchTerm, statusFilter]);

    const handleUpdateStatus = async (transactionId, newStatus) => {
        try {
            setUpdatingTxnId(transactionId);
            const res = await transactionAPI.updateStatus(transactionId, newStatus);
            if (res.success) {
                // Update local state
                setTransactions(transactions.map(txn => 
                    txn._id === transactionId ? { ...txn, status: newStatus } : txn
                ));
            }
            setOpenDropdown(null);
        } catch (err) {
            alert('Failed to update status');
            console.error(err);
        } finally {
            setUpdatingTxnId(null);
        }
    };

    const handleSuspendAccount = async (userId, transactionId) => {
        if (!window.confirm("Are you sure you want to suspend this user's account?")) return;
        
        try {
            setUpdatingTxnId(transactionId); // Just using this for the loading spinner on the row
            const res = await userAPI.update(userId, { status: 'suspended' });
            if (res.success) {
                alert(`User account suspended successfully.`);
            }
            setOpenDropdown(null);
        } catch (err) {
            alert('Failed to suspend account');
            console.error(err);
        } finally {
            setUpdatingTxnId(null);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
            case 'flagged': return 'bg-amber-100 text-amber-700 border border-amber-200';
            case 'blocked': return 'bg-red-100 text-red-700 border border-red-200';
            case 'pending': default: return 'bg-slate-100 text-slate-700 border border-slate-200';
        }
    };

    const getRiskStyle = (score) => {
        if (score >= 0.8) return 'bg-red-100 text-red-700';
        if (score >= 0.5) return 'bg-orange-100 text-orange-700';
        return 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Transaction Monitoring</h2>
                    <p className="text-slate-500">Real-time view of all system transactions.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <select 
                        className="px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-600 outline-none"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="flagged">Flagged</option>
                        <option value="blocked">Blocked</option>
                    </select>
                    <button onClick={() => { setSearchTerm(''); setStatusFilter(''); setPage(1); }} className="px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50">
                        Clear Filters
                    </button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-md w-full max-w-sm">
                        <Search className="w-4 h-4 text-slate-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search recipient or description..." 
                            className="bg-transparent border-none outline-none text-sm w-full"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left">
                                 <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                     <tr>
                                         <th className="px-6 py-3 font-medium">Txn ID / Date</th>
                                         <th className="px-6 py-3 font-medium">User</th>
                                         <th className="px-6 py-3 font-medium">Recipient</th>
                                         <th className="px-6 py-3 font-medium">Location</th>
                                         <th className="px-6 py-3 font-medium">Amount</th>
                                         <th className="px-6 py-3 font-medium">Status</th>
                                         <th className="px-6 py-3 font-medium">AI Recommendation / Reason</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-50">
                                     {loading && transactions.length === 0 ? (
                                         <tr>
                                             <td colSpan="7" className="px-6 py-12 text-center">
                                                 <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                                                 <p className="mt-2 text-slate-500">Loading transactions...</p>
                                             </td>
                                         </tr>
                                     ) : transactions.length === 0 ? (
                                         <tr>
                                             <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                                 No transactions found matching your criteria.
                                             </td>
                                         </tr>
                                     ) : (
                                         transactions.map((txn) => (
                                             <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors">
                                                 <td className="px-6 py-4">
                                                     <div className="font-mono text-xs text-slate-500">{txn._id.slice(-8)}</div>
                                                     <div className="text-xs text-slate-400 mt-0.5">{new Date(txn.createdAt).toLocaleString()}</div>
                                                 </td>
                                                 <td className="px-6 py-4">
                                                     <div className="font-medium text-slate-900">{txn.user?.name || 'Unknown User'}</div>
                                                     <div className="text-xs text-slate-500">{txn.user?.email || 'N/A'}</div>
                                                 </td>
                                                 <td className="px-6 py-4">
                                                     <div className="text-slate-700">{txn.recipient}</div>
                                                     {txn.description && <div className="text-xs text-slate-500 truncate max-w-[150px]">{txn.description}</div>}
                                                 </td>
                                                 <td className="px-6 py-4 text-xs text-slate-500">
                                                     {txn.location || 'Unknown'}
                                                 </td>
                                                 <td className="px-6 py-4 font-medium text-slate-900">
                                                     ${txn.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                 </td>
                                                 <td className="px-6 py-4">
                                                     <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(txn.status)}`}>
                                                         {txn.status}
                                                     </span>
                                                 </td>
                                                 <td className="px-6 py-4">
                                                     <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getDecisionTone(txn.status)}`}>
                                                            {txn.aiRecommendation || getDecisionRecommendation(txn.status)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 italic">
                                                          {txn.triggeredRules?.length > 0 
                                                            ? txn.triggeredRules.map(rule => {
                                                                if(rule === 'SINGLE_TXN_LIMIT_EXCEEDED') return 'Single Txn Limit Exceeded';
                                                                if(rule === 'DAILY_LIMIT_EXCEEDED') return 'Daily Limit Exceeded';
                                                                if(rule === 'DIFFERENT_COUNTRY') return 'Different Country';
                                                                if(rule === 'CITY_CHANGE') return 'City Change';
                                                                if(rule === 'IP_CHANGE') return 'IP Address Change';
                                                                if(rule === 'IP_AND_COUNTRY_CHANGE') return 'IP & Country Change';
                                                                if(rule === 'CRITICAL_FREQUENCY') return 'Critical Frequency';
                                                                if(rule === 'HIGH_FREQUENCY') return 'High Frequency';
                                                                return rule;
                                                              }).join(' & ')
                                                            : txn.status === 'blocked' ? 'Auto-blocked: Critical risk' : 
                                                              txn.status === 'flagged' ? 'Flagged: AI review required' : 
                                                              'Approved: Within safe limits'}
                                                        </span>
                                                     </div>
                                                 </td>
                                             </tr>
                                         ))
                                     )}
                                 </tbody>

                        </table>
                    </div>
                </CardContent>
            </Card>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm text-slate-500">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
