import React from 'react';
import { Switch } from 'react-router-dom';
import { PrivateRoute } from '../common/PrivateRoute';

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

const AppRoutes = () => {
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
    </Switch>
  );
};

export default AppRoutes;
