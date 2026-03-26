import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PrivateRoute } from '../common/PrivateRoute';
import { isAdminOrWorkunitPath } from '../common/routeMatching';

//home page
const Home = React.lazy(() => import('./home'));

const FileMonitoring = React.lazy(() => import('./fileMonitoring'));
const orbitProfileMonitoring = React.lazy(() => import('./orbitProfileMonitoring'));
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

const AppRoutes: React.FC<AppRoutesProps> = ({ allowAdminOrWorkunitPaths = false }) => {
  return (
    <Switch>
      <PrivateRoute exact path="/" component={Home} />
      <PrivateRoute path="/myAccount" component={MyAccount} />
      <PrivateRoute path="/:applicationId/fileMonitoring" component={FileMonitoring} />
      <PrivateRoute path="/:applicationId/ClusterMonitoring" component={ClusterMonitoring} />
      <PrivateRoute path="/:applicationId/orbit-profile-monitoring" component={orbitProfileMonitoring} />
      <PrivateRoute path="/:applicationId/jobMonitoring/timeSeriesAnalysis" component={TimeSeriesAnalysis} />
      <PrivateRoute path="/:applicationId/jobMonitoring" component={JobMonitoring} />
      <PrivateRoute path="/:applicationId/costMonitoring" component={CostMonitoring} />
      <PrivateRoute path="/:applicationId/landingZoneMonitoring" component={LandingZoneMonitoring} />
      <PrivateRoute path="/:applicationId/dashboard/notifications" component={Notifications} />
      <Route
        path="*"
        render={({ location }) => {
          if (isAdminOrWorkunitPath(location.pathname) && allowAdminOrWorkunitPaths) {
            return null;
          }

          return <Redirect to="/" />;
        }}
      />
    </Switch>
  );
};

export default AppRoutes;
