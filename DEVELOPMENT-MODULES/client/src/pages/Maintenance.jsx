import React from 'react';
import { Settings, ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Settings className="w-10 h-10 text-amber-600 animate-spin-slow" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">System Under Maintenance</h1>
        <p className="text-slate-600 mb-8">
          Our systems are currently undergoing scheduled maintenance to improve our fraud detection capabilities. 
          We'll be back online shortly.
        </p>

        <div className="bg-slate-50 rounded-lg p-4 mb-8 flex items-start text-left">
          <ShieldAlert className="w-5 h-5 text-slate-400 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-500 italic">
            Admins still have access to the system through the administrative backend. 
            If you believe this is an error, please contact your systems administrator.
          </p>
        </div>

        <Link 
          to="/signin" 
          className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};

export default Maintenance;
