import { useState } from 'react';
import { AlertOctagon, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supportAPI } from '../services/api';

export default function AccountSuspended() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    const submitRequest = async (e) => {
        e.preventDefault();
        setFeedback({ type: '', text: '' });

        if (!email.trim() || !message.trim()) {
            setFeedback({ type: 'error', text: 'Please enter your email and a short message.' });
            return;
        }

        setLoading(true);
        try {
            const res = await supportAPI.createTicket({
                email: email.trim(),
                message: message.trim(),
                type: 'ACCOUNT_SUSPENDED',
            });
            setFeedback({ type: 'success', text: res.message || 'Request sent to support.' });
            setMessage('');
        } catch (err) {
            setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to send request. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-red-100">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertOctagon className="w-10 h-10 text-red-600" />
                </div>
                
                <h1 className="text-2xl font-bold text-slate-900 mb-3">
                    Account Suspended
                </h1>
                
                <p className="text-slate-600 mb-8 leading-relaxed">
                    Your account has been temporarily suspended due to a violation of our terms of service or detected suspicious activity. 
                    For security reasons, access to your dashboard and transactions has been restricted.
                </p>

                <form onSubmit={submitRequest} className="space-y-4 text-left">
                    {feedback.text && (
                        <div className={`text-xs px-3 py-2 rounded-md ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {feedback.text}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Your email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/60"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Reason / details</label>
                        <textarea
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/60"
                            placeholder="Explain why you believe your account or payment should be unblocked."
                        />
                    </div>

                    <div className="space-y-3 pt-1">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending request...</>
                            ) : (
                                'Send unblock request to admin'
                            )}
                        </button>

                    <button 
                        onClick={() => navigate('/signin')}
                        className="w-full py-3 px-4 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        Return to Sign In
                    </button>
                    </div>
                </form>
            </div>
            
            <p className="mt-8 text-sm text-slate-400">
                FraudGuard AI Security Team
            </p>
        </div>
    );
}
