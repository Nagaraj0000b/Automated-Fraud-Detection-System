import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import DashboardHeader from '../admin/DashboardHeader';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  if (user.role && user.role !== 'admin') {
    return <Navigate to="/user-dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-h-screen flex-1 flex-col lg:ml-[250px]">
          <DashboardHeader />
          <main className="flex-1 bg-slate-50 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
