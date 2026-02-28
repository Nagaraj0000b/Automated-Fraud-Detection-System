import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    // Read auth state synchronously to prevent render flashing
    const token = localStorage.getItem('authToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    console.log('[MainLayout] Evaluating access:', { token: !!token, role: user.role });

    if (!token) {
        console.log('[MainLayout] No token, redirecting to /signin');
        return <Navigate to="/signin" replace />;
    }

    if (user.role !== 'admin') {
        console.log(`[MainLayout] User role is '${user.role}', redirecting to /user-dashboard`);
        return <Navigate to="/user-dashboard" replace />;
    }

    console.log('[MainLayout] Access GRANTED to Admin dashboard');

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar on the left */}
            <Sidebar />

            {/* Main Content Area on the right */}
            <div className="flex-1 ml-64 flex flex-col overflow-hidden">

                {/* We can add a Top Header here later if we want! */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 sticky top-0 z-10">
                    <h1 className="text-xl font-semibold text-slate-800">Admin Dashboard</h1>
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
