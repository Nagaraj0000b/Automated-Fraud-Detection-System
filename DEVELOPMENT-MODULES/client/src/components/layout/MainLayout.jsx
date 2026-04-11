import React from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { LogOut } from 'lucide-react';
import { getHomePathForUser } from '../../lib/auth';

const MainLayout = () => {
    const navigate = useNavigate();

    // Read auth state synchronously to prevent render flashing
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        navigate('/signin');
    };

    console.log('[MainLayout] Evaluating access:', { token: !!token, role: user.role });

    if (!token) {
        console.log('[MainLayout] No token, redirecting to /signin');
        return <Navigate to="/signin" replace />;
    }

    if (user.role !== 'admin') {
        console.log(`[MainLayout] User role is '${user.role}', redirecting to role home`);
        return <Navigate to={getHomePathForUser(user)} replace />;
    }

    console.log('[MainLayout] Access GRANTED to Admin dashboard');

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar on the left */}
            <Sidebar />

            {/* Main Content Area on the right */}
            <div className="flex-1 ml-64 flex flex-col overflow-hidden">

                {/* We can add a Top Header here later if we want! */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
                    <h1 className="text-xl font-semibold text-slate-800">Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">{user.name || 'Admin User'}</p>
                            <p className="text-xs text-slate-500">{user.email || ''}</p>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors" title="Logout">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* This Outlet is where the actual page content goes (like specific Dashboard or Transaction views) */}
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default MainLayout;
