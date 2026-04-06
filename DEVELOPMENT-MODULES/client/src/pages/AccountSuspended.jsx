import React, { useState } from 'react';
import { AlertOctagon, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '@/services/api';

export default function AccountSuspended() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await userAPI.submitReactivationRequest({ email, reason });
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-red-100">
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertOctagon className="w-10 h-10 text-red-600" />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Account Suspended
                    </h1>
                    
                    <p className="text-slate-600 text-sm leading-relaxed">
                        Access to your dashboard and transactions has been restricted due to detected suspicious activity.
                    </p>
                </div>

                {!submitted ? (
                    <div className="space-y-6">
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                                Request Account Reactivation
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Registered Email</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Reason for appeal</label>
                                    <textarea 
                                        required
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Explain why your account should be reactivated..."
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Submit Appeal
                                </button>
                            </form>
                        </div>

                        <div className="flex flex-col space-y-3 pt-2">
                            <button 
                                onClick={() => window.location.href = "mailto:support@fraudguard.ai?subject=Account%20Suspension%20Appeal"}
                                className="w-full py-2 text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors"
                            >
                                Contact Support via Email
                            </button>
                            
                            <button 
                                onClick={() => navigate('/signin')}
                                className="w-full py-2.5 px-4 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Return to Sign In
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-2">Request Submitted</h2>
                        <p className="text-slate-600 text-sm mb-6">
                            Your appeal has been received. Our security team will review it and update your account status within 24-48 hours.
                        </p>
                        <button 
                            onClick={() => navigate('/signin')}
                            className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
            
            <p className="mt-8 text-sm text-slate-400">
                FraudGuard AI Security Team
            </p>
        </div>
    );
}
