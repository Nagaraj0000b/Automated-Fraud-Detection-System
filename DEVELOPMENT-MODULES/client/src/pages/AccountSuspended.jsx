import { AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountSuspended() {
    const navigate = useNavigate();

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

                <div className="space-y-3">
                    <button 
                        onClick={() => window.location.href = "mailto:ritik.yadav23b@iiitg.a.cin?subject=Account%20Suspension%20Appeal"}
                        className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Contact Support
                    </button>
                    
                    <button 
                        onClick={() => navigate('/signin')}
                        className="w-full py-3 px-4 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        Return to Sign In
                    </button>
                </div>
            </div>
            
            <p className="mt-8 text-sm text-slate-400">
                FraudGuard AI Security Team
            </p>
        </div>
    );
}
