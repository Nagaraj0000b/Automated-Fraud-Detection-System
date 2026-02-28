import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignIn() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
                <p className="text-center text-slate-500 mb-4">Placeholder sign-in page</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}
