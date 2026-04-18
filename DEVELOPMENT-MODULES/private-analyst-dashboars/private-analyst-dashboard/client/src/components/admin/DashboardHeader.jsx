import { useEffect, useState, useMemo } from 'react';
import { Bell, ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationAPI } from '@/services/api';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/signin', { replace: true });
  };

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const response = await notificationAPI.getMyNotifications();
        if (!isMounted || !response.success) return;
        setUnreadCount((response.notifications || []).filter((item) => !item.read).length);
      } catch (error) {
        console.error('Failed to load admin notifications', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Admin Dashboard</h1>
      </div>

      <div className="flex items-center gap-4 self-start sm:self-auto">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">AI Alerts</p>
            <p className="text-xs text-slate-500">
              {unreadCount > 0 ? `${unreadCount} pending decisions` : 'No pending decisions'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user.name || 'Admin User'}</p>
              <p className="text-xs text-slate-500">{user.email || 'admin@fraudshield.com'}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
