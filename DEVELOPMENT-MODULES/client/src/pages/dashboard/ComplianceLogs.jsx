import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, AlertCircle } from "lucide-react";
import api from '../../services/api';

export default function ComplianceLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/audit-logs');
            setLogs(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
            setError('Failed to load compliance logs. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (logs.length === 0) return;

        const headers = ['Timestamp', 'Action', 'Actor', 'Target', 'Result', 'Details'];
        const csvContent = [
            headers.join(','),
            ...logs.map(log => {
                const date = new Date(log.timestamp).toLocaleString();
                const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
                return `"${date}","${log.action}","${log.actor}","${log.target}","${log.result}","${details}"`;
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
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
                <button
                    onClick={handleExportCSV}
                    disabled={logs.length === 0 || loading}
                    className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                    <Download className="w-4 h-4 mr-2" /> Export CSV
                </button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                                <p>Loading audit trail...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center p-12 text-red-500">
                                <AlertCircle className="h-8 w-8 mb-4" />
                                <p>{error}</p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                                <p>No audit logs found.</p>
                            </div>
                        ) : (
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
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log._id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                                            <td className="px-6 py-4 text-slate-600">{log.actor}</td>
                                            <td className="px-6 py-4 text-slate-600">{log.target}</td>
                                            <td className={`px-6 py-4 font-medium ${log.result === 'Success' ? 'text-emerald-600' :
                                                log.result === 'Failed' ? 'text-red-600' : 'text-amber-600'
                                                }`}>
                                                {log.result}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
