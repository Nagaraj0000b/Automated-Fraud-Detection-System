import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, ShieldCheck, Activity, LogOut } from "lucide-react";

export default function UserDashboard() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setIsAuthenticated(false);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/signin');
    };

    if (!isAuthenticated) {
        return <Navigate to="/signin" replace />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Top Bar */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">FraudGuard AI</h1>
                        <p className="text-xs text-slate-500">User Portal</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">{user.name || 'User'}</p>
                        <p className="text-xs text-slate-500">{user.email || ''}</p>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-5xl mx-auto p-6 space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Welcome, {user.name || 'User'}!</h2>
                    <p className="text-slate-500">Here is your account overview.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">My Transactions</CardTitle>
                            <CreditCard className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">0</div>
                            <p className="text-xs text-slate-500 mt-1">No transactions yet</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Security Status</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600">Secure</div>
                            <p className="text-xs text-slate-500 mt-1">No threats detected</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">Account Activity</CardTitle>
                            <Activity className="h-4 w-4 text-slate-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">Normal</div>
                            <p className="text-xs text-slate-500 mt-1">All systems operational</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-40 text-slate-400">
                        No recent activity to display
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
