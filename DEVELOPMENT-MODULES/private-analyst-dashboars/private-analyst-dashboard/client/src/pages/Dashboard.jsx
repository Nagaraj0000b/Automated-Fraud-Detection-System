import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (!token) {
      navigate('/signin');
      return;
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }

    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [navigate]);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, [now]);

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b0f1a] text-white">
      <div className="relative overflow-hidden">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-20 -right-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/5 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Fraud Detection System</p>
              <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
                {greeting},{' '}
                <span className="text-emerald-300">
                  {user?.name || user?.email || 'Analyst'}
                </span>
              </h1>
              <p className="mt-2 text-white/70">
                Here is a quick snapshot of your fraud monitoring pipeline.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
              >
                View alerts
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-full bg-white text-slate-900 px-4 py-2 text-sm font-semibold transition hover:bg-white/90"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
              <p className="text-sm text-white/60">Transactions scanned</p>
              <p className="mt-4 text-3xl font-semibold">12,480</p>
              <p className="mt-3 text-xs text-emerald-300">+8.2% vs last week</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
              <p className="text-sm text-white/60">Flagged anomalies</p>
              <p className="mt-4 text-3xl font-semibold">164</p>
              <p className="mt-3 text-xs text-amber-300">32 need review</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
              <p className="text-sm text-white/60">Model confidence</p>
              <p className="mt-4 text-3xl font-semibold">94.6%</p>
              <p className="mt-3 text-xs text-cyan-300">Stable since retrain</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
              <h2 className="text-lg font-semibold">Recent alerts</h2>
              <div className="mt-6 space-y-4 text-sm text-white/70">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-white">Card-not-present spike</p>
                    <p className="text-xs text-white/50">Risk score 0.89 • 3 minutes ago</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs text-emerald-200">Investigate</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-white">Suspicious refund pattern</p>
                    <p className="text-xs text-white/50">Risk score 0.82 • 27 minutes ago</p>
                  </div>
                  <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs text-amber-200">Queued</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-white">Merchant velocity anomaly</p>
                    <p className="text-xs text-white/50">Risk score 0.77 • 1 hour ago</p>
                  </div>
                  <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs text-cyan-200">Review</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
              <h2 className="text-lg font-semibold">System status</h2>
              <div className="mt-6 space-y-5 text-sm text-white/70">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Streaming pipeline</p>
                    <p className="text-xs text-white/50">Latency 230ms • 99.98% uptime</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Risk engine</p>
                    <p className="text-xs text-white/50">Model v4.2 • last retrain 3 days ago</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white">Manual review queue</p>
                    <p className="text-xs text-white/50">32 open cases • SLA 4h</p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">Next action</p>
                  <p className="mt-2 text-white">
                    Review the high-risk refund cluster flagged in region APAC.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
