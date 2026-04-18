import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BellRing,
    FileText,
    LayoutDashboard,
    Settings,
    Shield,
    Users,
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard Overview', path: '/admin-dashboard', icon: LayoutDashboard, end: true },
    { name: 'Transaction Monitoring', path: '/admin-dashboard/transactions', icon: Shield },
    { name: 'Compliance & Audit', path: '/admin-dashboard/audit', icon: FileText },
    { name: 'User Management', path: '/admin-dashboard/users', icon: Users },
    { name: 'Support & Appeals', path: '/admin-dashboard/support-appeals', icon: BellRing },
    { name: 'System Settings', path: '/admin-dashboard/settings', icon: Settings },
  ];

  return (
    <aside className="hidden h-screen w-[250px] shrink-0 flex-col justify-between bg-[#0b1220] px-4 py-6 text-white lg:fixed lg:left-0 lg:top-0 lg:flex">
      <div>
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-950/40">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">FraudGuard AI</p>
          </div>
        </div>

        <nav className="mt-10 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
            AD
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Admin User</p>
            <p className="text-xs text-slate-400">Security Team</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
