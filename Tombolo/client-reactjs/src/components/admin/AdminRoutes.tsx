import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PrivateRoute } from '../common/PrivateRoute';
import { isAdminOrWorkunitPath } from '../common/routeMatching';

const Users = React.lazy(() => import('./Users'));
const AdminApplications = React.lazy(() => import('./apps/Applications'));
const Clusters = React.lazy(() => import('@/pages/admin/Clusters'));
const ClusterLogs = React.lazy(() => import('@/pages/admin/ClusterLogs'));
const ScheduledJobsPage = React.lazy(() => import('./ScheduledJobsPage'));
const Integrations = React.lazy(() => import('./Integrations'));
const IntegrationSettings = React.lazy(() => import('./Integrations/IntegrationSettings'));
const UserManagement = React.lazy(() => import('./userManagement'));
const Settings = React.lazy(() => import('./settings'));
const WorkUnitHistory = React.lazy(() => import('./workunits/history'));
const WorkUnitDetails = React.lazy(() => import('./workunits/history/details'));
const WorkUnitAnalytics = React.lazy(() => import('./workunits/analytics'));
const WorkUnitDashboard = React.lazy(() => import('./workunits/dashboard/'));
const HPCC_Tools = React.lazy(() => import('./HPCCTools'));

const AdminRouteFallback: React.FC = () => {
  const location = useLocation();

  if (isAdminOrWorkunitPath(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return null;
};

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/admin/applications" element={<AdminApplications />} />
        <Route path="/admin/userManagement" element={<UserManagement />} />
        <Route path="/admin/bree" element={<ScheduledJobsPage />} />
        <Route path="/admin/clusters/logs" element={<ClusterLogs />} />
        <Route path="/admin/clusters" element={<Clusters />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/integrations/:integrationName" element={<IntegrationSettings />} />
        <Route path="/admin/integrations" element={<Integrations />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/hpcc-tools" element={<HPCC_Tools />} />
        <Route path="/workunits/history/:clusterId/:wuid" element={<WorkUnitDetails />} />
        <Route path="/workunits/history" element={<WorkUnitHistory />} />
        <Route path="/workunits/sql" element={<WorkUnitAnalytics />} />
        <Route path="/workunits/dashboard" element={<WorkUnitDashboard />} />
      </Route>
      <Route path="*" element={<AdminRouteFallback />} />
    </Routes>
  );
};

export default AdminRoutes;
