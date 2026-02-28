import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import OAuthSuccess from './pages/OAuthSuccess';
import UserDashboard from './pages/UserDashboard';
import MainLayout from './components/layout/MainLayout';

import DashboardOverview from './pages/dashboard/DashboardOverview';
import TransactionMonitoring from './pages/dashboard/TransactionMonitoring';
import RiskRules from './pages/dashboard/RiskRules';
import FraudAnalytics from './pages/dashboard/FraudAnalytics';
import ModelManagement from './pages/dashboard/ModelManagement';
import ModelPerformance from './pages/dashboard/ModelPerformance';
import ComplianceLogs from './pages/dashboard/ComplianceLogs';
import UserManagement from './pages/dashboard/UserManagement';
import SystemSettings from './pages/dashboard/SystemSettings';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public / Auth Routes */}
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />

        {/* Dashboard Routes wrapped in MainLayout */}
        <Route path="/admin-dashboard" element={<MainLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="transactions" element={<TransactionMonitoring />} />
          <Route path="risk-rules" element={<RiskRules />} />
          <Route path="fraud-patterns" element={<FraudAnalytics />} />
          <Route path="ai-models" element={<ModelManagement />} />
          <Route path="performance" element={<ModelPerformance />} />
          <Route path="audit" element={<ComplianceLogs />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
