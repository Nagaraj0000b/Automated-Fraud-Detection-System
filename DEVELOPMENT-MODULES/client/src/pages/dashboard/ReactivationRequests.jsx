import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, UserCheck, Loader2, MessageSquare } from "lucide-react";
import { userAPI } from '@/services/api';

export default function ReactivationRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await userAPI.getReactivationRequests();
            setRequests(data.requests);
            setError(null);
        } catch (err) {
            setError('Failed to load reactivation requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, status) => {
        const notes = window.prompt(`Enter notes for this ${status}:`);
        if (notes === null) return;

        try {
            setProcessingId(requestId);
            await userAPI.updateReactivationStatus(requestId, { status, adminNotes: notes });
            // Update local state
            setRequests(requests.map(req => 
                req._id === requestId ? { ...req, status, adminNotes: notes } : req
            ));
        } catch (err) {
            alert('Failed to update request');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-slate-500">Loading requests...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Account Reactivation Requests</h2>
                <p className="text-slate-500">Review and approve appeals from suspended users.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="grid gap-4">
                {requests.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-slate-500">
                            No reactivation requests found.
                        </CardContent>
                    </Card>
                ) : (
                    requests.map((request) => (
                        <Card key={request._id} className={request.status === 'pending' ? 'border-l-4 border-l-blue-500' : ''}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{request.user?.name || 'Unknown User'}</h3>
                                                <p className="text-sm text-slate-500">{request.email}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${
                                                request.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                                request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {request.status === 'pending' ? <Clock className="w-3 h-3 mr-1" /> : 
                                                 request.status === 'approved' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : 
                                                 <XCircle className="w-3 h-3 mr-1" />}
                                                {request.status.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                                                <MessageSquare className="w-3 h-3 mr-1" /> User's Reason
                                            </p>
                                            <p className="text-sm text-slate-700 leading-relaxed italic">
                                                "{request.reason}"
                                            </p>
                                        </div>

                                        {request.adminNotes && (
                                            <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100">
                                                <p className="text-xs font-semibold text-blue-600 mb-1">Admin Resolution Notes:</p>
                                                <p className="text-sm text-slate-700">{request.adminNotes}</p>
                                            </div>
                                        )}

                                        <div className="text-xs text-slate-400">
                                            Submitted on: {new Date(request.createdAt).toLocaleString()}
                                        </div>
                                    </div>

                                    {request.status === 'pending' && (
                                        <div className="flex flex-row md:flex-col gap-2 justify-end">
                                            <button 
                                                onClick={() => handleAction(request._id, 'approved')}
                                                disabled={processingId === request._id}
                                                className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 min-w-[120px]"
                                            >
                                                {processingId === request._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleAction(request._id, 'rejected')}
                                                disabled={processingId === request._id}
                                                className="flex items-center justify-center px-4 py-2 bg-white border border-red-200 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 min-w-[120px]"
                                            >
                                                {processingId === request._id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
