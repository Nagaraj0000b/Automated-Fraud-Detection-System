import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, UserCheck, Loader2, MessageSquare, HelpCircle, FileText, Send, User, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { userAPI } from '@/services/api';

export default function ReactivationRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    
    // UI state for expanded chat and actions
    const [expandedChatId, setExpandedChatId] = useState(null);
    const [actionState, setActionState] = useState({ id: null, type: null }); // type: 'approved', 'rejected', 'needs_info', 'message'
    const [actionNotes, setActionNotes] = useState('');

    const scrollRefs = useRef({});

    useEffect(() => {
        fetchRequests();
    }, []);

    useEffect(() => {
        if (expandedChatId && scrollRefs.current[expandedChatId]) {
            scrollRefs.current[expandedChatId].scrollTop = scrollRefs.current[expandedChatId].scrollHeight;
        }
    }, [expandedChatId, requests]);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await userAPI.getReactivationRequests();
            setRequests(data.requests);
            setError(null);
        } catch (err) {
            setError('Failed to load support & appeals requests');
        } finally {
            setLoading(false);
        }
    };

    const submitAction = async (requestId, status) => {
        try {
            setProcessingId(requestId);
            const res = await userAPI.updateReactivationStatus(requestId, { 
                status: status === 'message' ? undefined : status, 
                adminNotes: actionNotes 
            });
            
            // Update local state with the returned request which includes new messages
            setRequests(requests.map(req => 
                req._id === requestId ? { ...res.request, user: req.user } : req
            ));
            
            // Reset action state
            setActionState({ id: null, type: null });
            setActionNotes('');
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Security Appeal Center</h2>
                    <p className="text-slate-500 text-sm">Review and manage account reactivation requests from suspended users.</p>
                </div>
                <button 
                    onClick={fetchRequests}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    title="Refresh Requests"
                >
                    <Clock className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="grid gap-6">
                {requests.length === 0 ? (
                    <Card className="border-dashed border-2">
                        <CardContent className="py-20 text-center text-slate-400">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-lg font-medium">No pending appeals</p>
                            <p className="text-sm">When users appeal their suspension, they will appear here.</p>
                        </CardContent>
                    </Card>
                ) : (
                    requests.map((request) => (
                        <Card key={request._id} className={`overflow-hidden transition-all duration-300 ${
                            request.status === 'pending' ? 'ring-1 ring-blue-500 shadow-md border-l-4 border-l-blue-500' : 
                            request.status === 'needs_info' ? 'border-l-4 border-l-amber-500' : ''
                        }`}>
                            <CardContent className="p-0">
                                {/* Header Section */}
                                <div className="p-6 bg-white flex flex-col md:flex-row justify-between gap-4 border-b border-slate-50">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 flex-shrink-0">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900">{request.user?.name || 'Unknown User'}</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    request.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                                    request.status === 'needs_info' ? 'bg-amber-100 text-amber-700' :
                                                    request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {request.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{request.email}</p>
                                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 uppercase font-bold tracking-tighter">
                                                <Clock className="w-3 h-3" /> Submitted {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setExpandedChatId(expandedChatId === request._id ? null : request._id)}
                                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            {expandedChatId === request._id ? 'Hide Chat' : 'View Full History'}
                                            {expandedChatId === request._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        
                                        {(request.status === 'pending' || request.status === 'needs_info') && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => { setActionState({ id: request._id, type: 'approved' }); setActionNotes(''); }}
                                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                                                    title="Approve & Reactivate"
                                                >
                                                    <UserCheck className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => { setActionState({ id: request._id, type: 'rejected' }); setActionNotes(''); }}
                                                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                                                    title="Reject Appeal"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Summary Block (always visible) */}
                                <div className="px-6 py-4 bg-slate-50/50">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Original Reason</p>
                                    <p className="text-sm text-slate-700 italic border-l-2 border-slate-200 pl-4 py-1">
                                        "{request.reason}"
                                    </p>
                                </div>

                                {/* Expanded Chat History */}
                                {expandedChatId === request._id && (
                                    <div className="border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div 
                                            ref={el => scrollRefs.current[request._id] = el}
                                            className="max-h-[300px] overflow-y-auto p-6 space-y-4 bg-slate-100/30"
                                        >
                                            {request.messages && request.messages.length > 0 ? (
                                                request.messages.map((msg, midx) => (
                                                    <div key={midx} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
                                                        <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                                msg.sender === 'user' ? 'bg-white border border-slate-200 text-slate-400' : 'bg-slate-800 text-white'
                                                            }`}>
                                                                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <div className={`p-3 rounded-xl text-sm ${
                                                                    msg.sender === 'user' 
                                                                        ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm' 
                                                                        : 'bg-slate-800 text-white rounded-tr-none'
                                                                }`}>
                                                                    {msg.text}
                                                                </div>
                                                                <p className={`text-[10px] text-slate-400 mt-1 ${msg.sender === 'user' ? 'text-left' : 'text-right'}`}>
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-center text-slate-400 text-xs py-10 italic">No message history available.</p>
                                            )}
                                        </div>

                                        {/* Action Bar */}
                                        <div className="p-4 bg-white border-t border-slate-100">
                                            {actionState.id === request._id ? (
                                                <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                                                            {actionState.type === 'approved' ? '🚀 Approving Request' : 
                                                             actionState.type === 'needs_info' ? '💬 Message to User' : 
                                                             actionState.type === 'rejected' ? '❌ Rejecting Appeal' : '💬 Send Message'}
                                                        </span>
                                                        <button onClick={() => setActionState({ id: null, type: null })} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        autoFocus
                                                        value={actionNotes}
                                                        onChange={(e) => setActionNotes(e.target.value)}
                                                        placeholder={actionState.type === 'approved' ? "Enter internal notes (optional)..." : "Type your message to the user..."}
                                                        className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px]"
                                                    />
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => setActionState({ id: null, type: null })}
                                                            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => submitAction(request._id, actionState.type)}
                                                            disabled={processingId === request._id || (!actionNotes.trim() && actionState.type !== 'approved')}
                                                            className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-all flex items-center gap-2 ${
                                                                actionState.type === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                                                actionState.type === 'rejected' ? 'bg-red-600 hover:bg-red-700' :
                                                                'bg-blue-600 hover:bg-blue-700'
                                                            }`}
                                                        >
                                                            {processingId === request._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                                            {actionState.type === 'approved' ? 'Confirm Approval' : 'Send Response'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <div 
                                                        onClick={() => setActionState({ id: request._id, type: 'needs_info' })}
                                                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-400 cursor-text hover:bg-slate-100 transition-all flex items-center gap-3"
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                        Reply to this appeal...
                                                    </div>
                                                    <button 
                                                        onClick={() => setActionState({ id: request._id, type: 'needs_info' })}
                                                        className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all"
                                                    >
                                                        <Send className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}