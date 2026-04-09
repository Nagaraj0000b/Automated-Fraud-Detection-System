import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { dashboardAPI, alertAPI, websocketService } from '@/services/api';

const riskColors = {
  Critical: 'bg-red-100 text-red-700 border border-red-200',
  High: 'bg-orange-100 text-orange-700 border border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  Low: 'bg-green-100 text-green-700 border border-green-200',
};

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [alertStats, setAlertStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

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

      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    websocketService.connect();

    const handleAlert = (data) => {
      setRecentAlerts((prev) => [data.alert, ...prev.slice(0, 19)]);
    };

    websocketService.on('fraud_alert', handleAlert);

    const wsCheck = setInterval(() => {
      setWsConnected(websocketService.ws?.readyState === WebSocket.OPEN);
    }, 2000);

    return () => {
      websocketService.off('fraud_alert', handleAlert);
      clearInterval(wsCheck);
    };
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-slate-500">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard Overview</h2>
        <div className={`px-3 py-1 rounded-full text-xs ${wsConnected ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>
          {wsConnected ? 'LIVE' : 'Connecting...'}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <p>Fraud Detected</p>
            <h2 className="text-xl font-bold">{alertStats?.totalFraudDetected || 0}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p>Total Transactions</p>
            <h2>{stats?.transactions?.total24h || 0}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p>Avg Risk</p>
            <h2>{alertStats?.avgRiskScore || 0}</h2>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p>Users</p>
            <h2>{stats?.users?.total || 0}</h2>
          </CardContent>
        </Card>
      </div>

      {/* ALERTS */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length > 0 ? (
            recentAlerts.map((a) => (
              <div key={a._id} className="flex justify-between border-b py-2 text-sm">
                <span>{a.alertId}</span>
                <span>{a.user?.email}</span>
                <span>₹{a.amount}</span>
                <span className={riskColors[a.riskLevel]}>{a.riskLevel}</span>
              </div>
            ))
          ) : (
            <p>No alerts</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
