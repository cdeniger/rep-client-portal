
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/auth/PrivateRoute';
import AdminGuard from './components/auth/AdminGuard';
import RoleGuard from './components/auth/RoleGuard';

import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Radar from './pages/Radar';
import Financials from './pages/Financials';
import Diagnostic from './pages/Diagnostic';
import RepLayout from './layouts/RepLayout';
import RepDashboard from './pages/rep/RepDashboard';
import Roster from './pages/rep/Roster';
import ClientDetail from './pages/rep/ClientDetail';
import GlobalPipeline from './pages/rep/GlobalPipeline';
import PendingRecs from './pages/rep/PendingRecs';
import JobRecs from './pages/JobRecs';
import Contacts from './pages/Contacts';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import PipelineConfig from './pages/admin/PipelineConfig';
import ActivityDefinitionBuilder from './pages/admin/ActivityDefinitionBuilder';
import ActivityTypes from './pages/admin/ActivityTypes';
import Activities from './pages/Activities';
import PodManager from './pages/admin/PodManager';
import SalesPipeline from './pages/internal/SalesPipeline';

function App() {
  console.log("App Rendering...");
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/financials" element={<Financials />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/recommendations" element={<JobRecs />} />
          </Route>

          {/* Internal Rep Routes (RBAC Protected) */}
          <Route element={<RoleGuard allowedRoles={['rep', 'admin']} redirectPath="/" />}>
            <Route path="/rep" element={<RepLayout />}>
              <Route index element={<RepDashboard />} />
              <Route path="roster" element={<Roster />} />
              <Route path="client/:id" element={<ClientDetail />} />
              <Route path="pipeline" element={<GlobalPipeline />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/:id" element={<CompanyDetail />} />
              <Route path="activities" element={<Activities />} />
              <Route path="sales-pipeline" element={<SalesPipeline />} />
              <Route path="pending-recs" element={<PendingRecs />} />
              <Route path="deals" element={<div className="p-8 text-slate-500">Deal Desk Placeholder</div>} />
              <Route path="invoices" element={<div className="p-8 text-slate-500">Invoices Placeholder</div>} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminGuard />}>
            <Route element={<RepLayout />}>
              <Route path="pipelines" element={<PipelineConfig />} />
              <Route path="definitions" element={<ActivityDefinitionBuilder />} />
              <Route path="activity-types" element={<ActivityTypes />} />
              <Route path="pods" element={<PodManager />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </Router>
  );
}

export default App;
