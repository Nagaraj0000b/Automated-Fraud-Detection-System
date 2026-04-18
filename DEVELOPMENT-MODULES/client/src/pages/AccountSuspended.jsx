import React, { useState, useEffect, useRef } from 'react';
import { AlertOctagon, Send, CheckCircle, Loader2, HelpCircle, FileText, Clock, User, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { userAPI } from '@/services/api';

export default function AccountSuspended() {
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    
    const [email, setEmail] = useState(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) return JSON.parse(userStr).email || '';
            return '';
        } catch {
            return '';
        }
    });
    
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [error, setError] = useState(null);
    
    const [requestStatus, setRequestStatus] = useState(null); 
    const [messages, setMessages] = useState([]);
    const [hasCheckedStatus, setHasCheckedStatus] = useState(false);

    // Poll for updates every 10 seconds if we have an email and a checked status
    useEffect(() => {
        let interval;
        if (email && hasCheckedStatus && (requestStatus === 'pending' || requestStatus === 'needs_info')) {
            interval = setInterval(() => {
                checkStatus(email, true); // true for silent check
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [email, hasCheckedStatus, requestStatus]);

    useEffect(() => {
        if (email && !hasCheckedStatus) {
            checkStatus(email);
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const checkStatus = async (emailToCheck, silent = false) => {
        if (!emailToCheck) return;
        if (!silent) setCheckingStatus(true);
        setError(null);
        try {
            const data = await userAPI.getReactivationRequestStatusPublic(emailToCheck);
            if (data.request) {
                setRequestStatus(data.request.status);
                // Only update messages if they changed to avoid flickering or scroll resets
                setMessages(prev => {
                    const newMessages = data.request.messages || [];
                    if (JSON.stringify(prev) !== JSON.stringify(newMessages)) {
                        return newMessages;
                    }
                    return prev;
                });
                setHasCheckedStatus(true);
            } else {
                setRequestStatus(null);
                setMessages([]);
                setHasCheckedStatus(true);
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setRequestStatus(null);
                setMessages([]);
                setHasCheckedStatus(true);
            } else if (!silent) {
                setError('Failed to check status. Please try again.');
            }
        } finally {
            if (!silent) setCheckingStatus(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const res = await userAPI.submitReactivationRequest({ email, reason });
            // Re-fetch status to update UI and messages
            await checkStatus(email);
            setReason('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved': return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">Restored</span>;
            case 'rejected': return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">Rejected</span>;
            case 'needs_info': return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase">Action Needed</span>;
            case 'pending': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">Under Review</span>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px]">
                {/* Header */}
                <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                            <AlertOctagon className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Security Appeal Center</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Live Support Agent Available</p>
                            </div>
                        </div>
                    </div>
                    {requestStatus && getStatusBadge(requestStatus)}
                </div>

                {!hasCheckedStatus ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                         <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="w-8 h-8 text-slate-400" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">Identify Your Account</h2>
                        <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                            Enter the email address associated with your suspended account to start or view your appeal.
                        </p>
                        <div className="w-full max-w-xs space-y-3">
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                            <button 
                                onClick={() => checkStatus(email)}
                                disabled={checkingStatus || !email}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                {checkingStatus ? 'Locating Account...' : 'Continue to Appeal'}
                            </button>
                            <button 
                                onClick={() => navigate('/signin')}
                                className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
                            >
                                Back to Sign In
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Messages */}
                        <div 
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                                        <HelpCircle className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="text-slate-800 font-bold mb-2">How can we help?</h3>
                                    <p className="text-slate-500 text-sm max-w-xs">
                                        Your account has been flagged by our automated system. Please provide a detailed explanation of your recent activities to request reactivation.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                                                msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                                            }`}>
                                                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                    msg.sender === 'user' 
                                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                                }`}>
                                                    {msg.text}
                                                </div>
                                                <div className={`text-[10px] mt-1 font-medium text-slate-400 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            {requestStatus === 'approved' && (
                                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-emerald-900 font-bold text-sm">Account Restored</p>
                                        <p className="text-emerald-700 text-xs">Your appeal has been approved. You can now access all services.</p>
                                    </div>
                                    <button 
                                        onClick={() => navigate('/signin')}
                                        className="ml-auto px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all"
                                    >
                                        Login Now
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            {requestStatus === 'approved' ? (
                                <div className="text-center py-2">
                                    <p className="text-slate-400 text-xs italic">This conversation has been closed.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                                    <div className="flex-1 relative">
                                        <textarea 
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder={messages.length === 0 ? "Explain your appeal..." : "Type your message..."}
                                            rows={1}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none max-h-32"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSubmit(e);
                                                }
                                            }}
                                        />
                                        <div className="absolute right-3 bottom-3 flex items-center gap-2">
                                            {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                                        </div>
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={loading || !reason.trim()}
                                        className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-50 transition-all shadow-lg"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            )}
                            
                            {error && (
                                <div className="mt-2 text-center">
                                    <p className="text-[10px] text-red-500 font-medium">{error}</p>
                                </div>
                            )}

                            <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-slate-400 uppercase tracking-widest px-2">
                                <span>FraudGuard AI Security</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setHasCheckedStatus(false)} className="hover:text-slate-600 transition-colors">Change Account</button>
                                    <span>Support ID: {email.split('@')[0] || 'GUEST'}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            <div className="mt-6 flex items-center gap-6 text-slate-400">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Avg Response: 2-4 Hours</span>
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-medium">256-bit Encrypted</span>
                </div>
            </div>
        </div>
    );
}