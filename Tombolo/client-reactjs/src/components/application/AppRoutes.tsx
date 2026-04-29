import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PrivateRoute } from '../common/PrivateRoute';
import { isAdminOrWorkunitPath } from '../common/routeMatching';

//home page
const Home = React.lazy(() => import('./home'));

const FileMonitoring = React.lazy(() => import('./fileMonitoring'));
const OrbitProfileMonitoring = React.lazy(() => import('./orbitProfileMonitoring'));
const Notifications = React.lazy(() => import('./dashboard/notifications'));
const ClusterMonitoring = React.lazy(() => import('./clusterMonitoring'));
const JobMonitoring = React.lazy(() => import('./jobMonitoring'));
const CostMonitoring = React.lazy(() => import('./costMonitoring'));
const TimeSeriesAnalysis = React.lazy(() => import('./jobMonitoring/timeSeriesAnalysis/'));
const LandingZoneMonitoring = React.lazy(() => import('./LandingZoneMonitoring'));
const MyAccount = React.lazy(() => import('./myAccount/myAccount'));

type AppRoutesProps = {
  allowAdminOrWorkunitPaths?: boolean;
};

type AppRouteFallbackProps = {
  allowAdminOrWorkunitPaths: boolean;
};

const AppRouteFallback: React.FC<AppRouteFallbackProps> = ({ allowAdminOrWorkunitPaths }) => {
  const location = useLocation();

  if (isAdminOrWorkunitPath(location.pathname) && allowAdminOrWorkunitPaths) {
    return null;
  }

  return <Navigate to="/" replace />;
};

const AppRoutes: React.FC<AppRoutesProps> = ({ allowAdminOrWorkunitPaths = false }) => {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/myAccount" element={<MyAccount />} />
        <Route path="/:applicationId/fileMonitoring" element={<FileMonitoring />} />
        <Route path="/:applicationId/ClusterMonitoring" element={<ClusterMonitoring />} />
        <Route path="/:applicationId/orbit-profile-monitoring" element={<OrbitProfileMonitoring />} />
        <Route path="/:applicationId/jobMonitoring/timeSeriesAnalysis" element={<TimeSeriesAnalysis />} />
        <Route path="/:applicationId/jobMonitoring" element={<JobMonitoring />} />
        <Route path="/:applicationId/costMonitoring" element={<CostMonitoring />} />
        <Route path="/:applicationId/landingZoneMonitoring" element={<LandingZoneMonitoring />} />
        <Route path="/:applicationId/dashboard/notifications" element={<Notifications />} />
      </Route>
      <Route path="*" element={<AppRouteFallback allowAdminOrWorkunitPaths={allowAdminOrWorkunitPaths} />} />
    </Routes>
  );
};

export default AppRoutes;
