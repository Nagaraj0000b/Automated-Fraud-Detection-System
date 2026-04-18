import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldAlert, CreditCard, Activity, Users, Zap } from "lucide-react";
import { dashboardAPI, alertAPI, websocketService } from '../../services/api';

const riskColors = {
  Critical: 'bg-red-50 text-red-600 border-red-100',
  High: 'bg-orange-50 text-orange-600 border-orange-100',
  Medium: 'bg-amber-50 text-amber-600 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-600 border-emerald-100',
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
      setRecentAlerts((prev) => [data.alert, ...prev.slice(0, 9)]);
    };

    websocketService.on('fraud_alert', handleAlert);

    const wsCheck = setInterval(() => {
      setWsConnected(websocketService.ws?.readyState === WebSocket.OPEN);
    }, 5000);

    return () => {
      websocketService.off('fraud_alert', handleAlert);
      clearInterval(wsCheck);
    };
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="text-slate-400 font-medium text-sm animate-pulse">Loading real-time intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-red-600 text-center">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-bold text-lg">System Error</p>
        <p className="text-sm opacity-80">{error}</p>
        <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-red-100 rounded-xl text-xs font-bold hover:bg-red-200 transition-colors">Retry Fetch</button>
      </div>
    );
  }

  const cards = [
    { label: 'Fraud Detected', value: alertStats?.totalFraudDetected || 0, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Total Activity', value: stats?.transactions?.total24h || 0, icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Avg Risk Score', value: alertStats?.avgRiskScore || 0, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Total Users', value: stats?.users?.total || 0, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">System Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time fraud intelligence and network status</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${wsConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'} transition-all`}>
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="text-xs font-bold uppercase tracking-widest">{wsConnected ? 'Live Connection' : 'Offline Mode'}</span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{c.label}</p>
                  <h3 className="text-3xl font-black text-slate-900">{c.value}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${c.bg} ${c.color}`}>
                  <c.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Alerts Feed */}
      <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Recent Threat Feed</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{recentAlerts.length} Active Alerts</span>
        </div>
        <CardContent className="p-0">
          {recentAlerts.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {recentAlerts.map((a) => (
                <div key={a._id} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400 group-hover:bg-white transition-colors">
                        {a.alertId?.slice(-4)}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-800">{a.user?.name || a.user?.email || 'System Transaction'}</div>
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Event ID: {a.alertId}</div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    <div className="text-right">
                        <div className="text-sm font-black text-slate-900">₹{Number(a.amount).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{a.type || 'Generic Fraud'}</div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${riskColors[a.riskLevel] || 'bg-slate-100 text-slate-600'}`}>
                        {a.riskLevel || 'Low'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 text-center">
                <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-medium italic">No immediate threats detected in current cycle.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Footer System Meta */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] px-2">
          <div>GuardEngine v2.4.0</div>
          <div>Last Synchronized: {new Date().toLocaleTimeString()}</div>
      </div>
    </div>
  );
}
