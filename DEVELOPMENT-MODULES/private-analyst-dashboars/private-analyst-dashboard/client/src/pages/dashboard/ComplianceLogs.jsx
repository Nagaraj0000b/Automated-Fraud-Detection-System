import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { auditAPI } from '@/services/api';

export default function ComplianceLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await auditAPI.getLogs({ page, limit: 20 });
            if (response.success) {
                setLogs(response.logs);
                setTotalPages(response.pages);
                setError(null);
            } else {
                setError('Failed to load logs');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error connecting to the server');
            console.error('Audit Log Fetch Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Simple CSV export
        const headers = ["Timestamp", "Action", "Actor", "Target", "Result"];
        const csvContent = [
            headers.join(","),
            ...logs.map(log => [
                new Date(log.createdAt).toLocaleString(),
                log.action,
                log.actorName,
                log.target,
                log.result
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Compliance & Audit Logs</h2>
                    <p className="text-slate-500">Immutable record of system changes and administrative actions.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchLogs}
                        disabled={loading}
                        className="p-2 bg-white border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={handleExport}
                        disabled={loading || logs.length === 0}
                        className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                    <button onClick={fetchLogs} className="ml-auto text-sm underline hover:no-underline">Retry</button>
                </div>
            )}

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Timestamp</th>
                                    <th className="px-6 py-3 font-medium">Action</th>
                                    <th className="px-6 py-3 font-medium">Actor</th>
                                    <th className="px-6 py-3 font-medium">Target</th>
                                    <th className="px-6 py-3 font-medium">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading && logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                                                <p className="text-slate-500">Loading audit logs...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <p className="text-slate-400 italic">No audit logs found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-slate-900">{log.action}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-700 font-medium">{log.actorName}</span>
                                                    {log.ipAddress && <span className="text-[10px] text-slate-400 font-mono">{log.ipAddress}</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <span className="px-2 py-1 bg-slate-100 rounded text-xs border border-slate-200">
                                                    {log.target}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    log.result === 'Success' ? 'bg-emerald-100 text-emerald-800' : 
                                                    log.result === 'Failure' ? 'bg-red-100 text-red-800' : 
                                                    'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {log.result}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
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
