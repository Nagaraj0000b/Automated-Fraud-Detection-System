import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import OAuthSuccess from './pages/OAuthSuccess';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import UserDashboard from './pages/UserDashboard';
import MakePayment from './pages/MakePayment';
import MainLayout from './components/layout/MainLayout';
import AccountSuspended from './pages/AccountSuspended';
import Maintenance from './pages/Maintenance';
import AnalystDashboard from './pages/AnalystDashboardRealV2';

import DashboardOverview from './pages/dashboard/DashboardOverviewReal';
import TransactionMonitoring from './pages/dashboard/TransactionMonitoring';
import RiskRules from './pages/dashboard/RiskRules';
import FraudAnalytics from './pages/dashboard/FraudAnalytics';
import ModelManagement from './pages/dashboard/ModelManagement';
import ModelPerformance from './pages/dashboard/ModelPerformance';
import ComplianceLogs from './pages/dashboard/ComplianceLogs';
import SupportAppeals from './pages/dashboard/SupportAppeals';
import UserManagement from './pages/dashboard/UserManagement';
import SystemSettings from './pages/dashboard/SystemSettings';

// ✅ ADDED: ProtectedRoute component — guards routes by role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard if wrong role tries to access
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'analyst') return <Navigate to="/analyst/dashboard" replace />;
    return <Navigate to="/customer-dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/suspended" element={<AccountSuspended />} />
        <Route path="/maintenance" element={<Maintenance />} />

        <Route path="/dashboard" element={<Dashboard />} />

        {/* ✅ FIXED: Analyst dashboard is now protected — only analyst & admin allowed */}
        <Route
          path="/analyst/dashboard"
          element={
            <ProtectedRoute allowedRoles={['analyst', 'admin']}>
              <AnalystDashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ FIXED: Customer routes protected for users */}
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'analyst']}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/make-payment"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'analyst']}>
              <MakePayment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-dashboard"
          element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'analyst']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* ✅ FIXED: Admin dashboard protected — only admin allowed */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardOverview />} />
          <Route path="transactions" element={<TransactionMonitoring />} />
          <Route path="risk-rules" element={<RiskRules />} />
          <Route path="fraud-patterns" element={<FraudAnalytics />} />
          <Route path="ai-models" element={<ModelManagement />} />
          <Route path="performance" element={<ModelPerformance />} />
          <Route path="audit" element={<ComplianceLogs />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="support-appeals" element={<SupportAppeals />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
