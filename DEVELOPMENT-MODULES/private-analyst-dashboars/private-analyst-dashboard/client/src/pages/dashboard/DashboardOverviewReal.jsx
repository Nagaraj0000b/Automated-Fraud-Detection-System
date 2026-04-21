import { useEffect, useState } from 'react';
import RecentSignups from '@/components/admin/RecentSignups';
import StatsCards from '@/components/admin/StatsCards';
import UsersByRole from '@/components/admin/UsersByRole';
import { dashboardAPI, notificationAPI } from '@/services/api';

export default function DashboardOverviewReal() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [notificationSummary, setNotificationSummary] = useState({
    unread: 0,
    latest: 'No new AI decisions in the queue.',
  });

  useEffect(() => {
    let isMounted = true;

    const loadOverview = async () => {
      try {
        const [statsResponse, recentUsersResponse, notificationsResponse] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getRecentUsers(),
          notificationAPI.getMyNotifications(),
        ]);

        if (!isMounted) return;

        const dashboardStats = statsResponse.stats || null;
        const notifications = notificationsResponse.notifications || [];
        const latestNotification = notifications[0];

        setStats(dashboardStats);
        setRecentUsers(
          (recentUsersResponse.users || []).map((user) => ({
            initial: user.name?.slice(0, 1)?.toUpperCase() || 'U',
            name: user.name || 'Unknown User',
            email: user.email || '',
            role: (user.role || 'user').replace(/^./, (char) => char.toUpperCase()),
          }))
        );
        setNotificationSummary({
          unread: notifications.filter((item) => !item.read).length,
          latest: latestNotification?.message || 'No new AI decisions in the queue.',
        });
      } catch (error) {
        console.error('Failed to load admin overview', error);
      }
    };

    loadOverview();
    const interval = setInterval(loadOverview, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const roles =
    stats?.users?.byRole?.map((item) => ({
      name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Unknown',
      count: item.count,
    })) || undefined;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Dashboard Overview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back. Here is what&apos;s happening today.
            </p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 lg:max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              AI Decision Feed
            </p>
            <p className="mt-2 text-sm text-slate-700">{notificationSummary.latest}</p>
            <p className="mt-2 text-xs text-blue-700">
              {notificationSummary.unread} unread admin notification{notificationSummary.unread === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </section>

      <StatsCards stats={stats} />

      <div className="grid gap-4 xl:grid-cols-2">
        <UsersByRole roles={roles} />
        <RecentSignups signups={recentUsers.length ? recentUsers : undefined} />
      </div>
    </div>
  );
}
