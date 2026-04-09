import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { alertAPI, dashboardAPI } from '@/services/api';

const riskColors = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High: 'bg-orange-100 text-orange-700 border border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  Low: 'bg-green-100 text-green-700 border border-green-200',
};

export default function DashboardOverviewReal() {
  const [stats, setStats] = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, alertStatsRes, recentAlertsRes] = await Promise.all([
        dashboardAPI.getStats(),
        alertAPI.getStats(),
        alertAPI.getRecent(),
      ]);

      setStats(statsRes.stats || null);
      setAlertStats(alertStatsRes.stats || null);
      setRecentAlerts(recentAlertsRes.alerts || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-500">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-xl bg-red-50 p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">Live fraud, transaction, and model summary</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Fraud Detected</p>
            <h2 className="mt-2 text-3xl font-bold">{alertStats?.totalFraudDetected || 0}</h2>
            <p className="mt-2 text-xs text-slate-400">{alertStats?.weekChange || 0}% vs previous week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total Transactions</p>
            <h2 className="mt-2 text-3xl font-bold">{stats?.transactions?.total24h || 0}</h2>
            <p className="mt-2 text-xs text-slate-400">{stats?.transactions?.dayChange || 0}% in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Avg Risk</p>
            <h2 className="mt-2 text-3xl font-bold">{alertStats?.avgRiskScore || 0}</h2>
            <p className="mt-2 text-xs text-slate-400">{stats?.transactions?.flagged24h || 0} flagged today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Model Accuracy</p>
            <h2 className="mt-2 text-3xl font-bold">{stats?.models?.avgAccuracy || 0}%</h2>
            <p className="mt-2 text-xs text-slate-400">{stats?.riskRules?.activeRules || 0} active rules</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div key={alert._id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-indigo-600">{alert.alertId}</p>
                    <p className="text-sm text-slate-500">{alert.user?.email || 'Unknown user'}</p>
                  </div>
                  <div className="font-semibold text-slate-800">Rs. {Number(alert.amount || 0).toLocaleString('en-IN')}</div>
                  <div className="text-sm text-slate-500">{alert.type}</div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${riskColors[alert.riskLevel] || riskColors.Low}`}>
                    {alert.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No alerts detected.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
