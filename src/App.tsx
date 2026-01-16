
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/auth/PrivateRoute';
import DevTools from './components/dev/DevTools';
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

function App() {
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
          </Route>

          {/* Internal Rep Routes */}
          <Route path="/rep" element={<RepLayout />}>
            <Route index element={<RepDashboard />} />
            <Route path="roster" element={<Roster />} />
            <Route path="client/:id" element={<ClientDetail />} />
            <Route path="pipeline" element={<GlobalPipeline />} />
            <Route path="deals" element={<div className="p-8 text-slate-500">Deal Desk Placeholder</div>} />
            <Route path="invoices" element={<div className="p-8 text-slate-500">Invoices Placeholder</div>} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <DevTools />
    </Router>
  );
}

export default App;
