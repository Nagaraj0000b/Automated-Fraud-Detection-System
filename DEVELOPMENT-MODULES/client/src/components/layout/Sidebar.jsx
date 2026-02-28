import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard, Activity, ShieldAlert, ListFilter,
    BrainCircuit, BarChart4, FileText, Users, Settings
} from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { name: 'Dashboard Overview', path: '/admin-dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Transaction Monitoring', path: '/admin-dashboard/transactions', icon: <Activity size={20} /> },
        { name: 'Risk Rules Management', path: '/admin-dashboard/risk-rules', icon: <ShieldAlert size={20} /> },
        { name: 'Fraud Pattern Analytics', path: '/admin-dashboard/fraud-patterns', icon: <ListFilter size={20} /> },
        { name: 'AI Model Management', path: '/admin-dashboard/ai-models', icon: <BrainCircuit size={20} /> },
        { name: 'Model Performance', path: '/admin-dashboard/performance', icon: <BarChart4 size={20} /> },
        { name: 'Compliance & Audit', path: '/admin-dashboard/audit', icon: <FileText size={20} /> },
        { name: 'User Management', path: '/admin-dashboard/users', icon: <Users size={20} /> },
        { name: 'System Settings', path: '/admin-dashboard/settings', icon: <Settings size={20} /> },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0">
            <div className="p-6 flex items-center space-x-3">
                <ShieldAlert className="text-blue-500" size={28} />
                <span className="text-xl font-bold tracking-tight">FraudGuard AI</span>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
              flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors duration-200
              ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
            `}
                    >
                        {item.icon}
                        <span className="font-medium text-sm">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            {/* User profile section at the bottom */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                        AD
                    </div>
                    <div>
                        <p className="text-sm font-medium">Admin User</p>
                        <p className="text-xs text-slate-500">Security Team</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
