import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CreditCard, ShieldAlert, Users, Loader2 } from "lucide-react";
import { dashboardAPI } from '@/services/api';

export default function DashboardOverview() {
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, usersRes] = await Promise.all([
                dashboardAPI.getStats(),
                dashboardAPI.getRecentUsers()
            ]);
            setStats(statsRes.stats);
            setRecentUsers(usersRes.users);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-slate-500">Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <p className="font-medium">Error loading dashboard</p>
                <p className="text-sm mt-1">{error}</p>
                <button onClick={fetchDashboardData} className="mt-3 px-4 py-2 bg-red-100 rounded text-sm font-medium hover:bg-red-200">
                    Retry
                </button>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Transactions (24h)",
            value: stats?.transactions?.total24h?.toLocaleString() || '0',
            icon: <CreditCard className="h-4 w-4 text-slate-500" />,
            trend: stats?.transactions?.note || 'Pending setup'
        },
        {
            title: "Flagged Frauds",
            value: stats?.transactions?.flaggedFrauds?.toLocaleString() || '0',
            icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
            trend: stats?.transactions?.note || 'Pending setup'
        },
        {
            title: "Active AI Models",
            value: stats?.models?.activeModels?.toString() || '0',
            icon: <Activity className="h-4 w-4 text-blue-500" />,
            trend: stats?.models?.note || 'Pending setup'
        },
        {
            title: "System Users",
            value: stats?.users?.total?.toString() || '0',
            icon: <Users className="h-4 w-4 text-slate-500" />,
            trend: `${stats?.users?.active || 0} active, ${stats?.users?.recentSignups || 0} new this week`
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
                <p className="text-slate-500">Welcome back. Here is what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                {stat.title}
                            </CardTitle>
                            {stat.icon}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <p className="text-xs text-slate-500 mt-1">{stat.trend}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Users by Role */}
                <Card className="col-span-4 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Users by Role</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.users?.byRole?.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-sm font-medium text-slate-900 capitalize">{item._id}</span>
                                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{item.count}</span>
                                </div>
                            ))}
                            {(!stats?.users?.byRole || stats.users.byRole.length === 0) && (
                                <p className="text-slate-400 text-center py-8">No role data available</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Users */}
                <Card className="col-span-3 min-h-[400px]">
                    <CardHeader>
                        <CardTitle>Recent Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentUsers.map((user) => (
                                <div key={user._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {user.role}
                                    </span>
                                </div>
                            ))}
                            {recentUsers.length === 0 && (
                                <p className="text-slate-400 text-center py-8">No recent users</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
