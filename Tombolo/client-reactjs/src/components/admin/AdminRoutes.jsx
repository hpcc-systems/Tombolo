import React from 'react';
import { Switch } from 'react-router-dom';
import { PrivateRoute } from '../common/PrivateRoute';

// Admin pages
const Users = React.lazy(() => import('./Users'));
const AdminApplications = React.lazy(() => import('./apps/Applications'));
// const AdminClusters = React.lazy(() => import('./Clusters'));
const Clusters = React.lazy(() => import('@/pages/admin/Clusters'));
const ClusterLogs = React.lazy(() => import('@/pages/admin/ClusterLogs'));
// const Regulations = React.lazy(() => import('./ControlsAndRegulations'));
// const GitHubSettings = React.lazy(() => import('./GitHubSettings/GitHubSettings'));
const ScheduledJobsPage = React.lazy(() => import('./ScheduledJobsPage'));
// const Compliance = React.lazy(() => import('./Compliance/Compliance'));
const Integrations = React.lazy(() => import('./Integrations'));
const IntegrationSettings = React.lazy(() => import('./Integrations/IntegrationSettings'));
const UserManagement = React.lazy(() => import('./userManagement/index.jsx'));
const Settings = React.lazy(() => import('./settings'));
const WorkUnitHistory = React.lazy(() => import('./workunitHistory/index.jsx'));
const WorkUnitDetails = React.lazy(() => import('./workunitHistory/details/index.jsx'));
const WorkUnitAnalytics = React.lazy(() => import('./workunitAnalytics/index.jsx'));
const WorkUnitDashboard = React.lazy(() => import('./workunits/dashboard/'));

const AdminRoutes = () => {
  return (
    <Switch>
      <PrivateRoute path="/admin/applications" component={AdminApplications} />
      <PrivateRoute path="/admin/userManagement" component={UserManagement} />
      <PrivateRoute path="/admin/bree" component={ScheduledJobsPage} />
      <PrivateRoute path="/admin/clusters/logs" component={ClusterLogs} />
      <PrivateRoute path="/admin/clusters" component={Clusters} />
      {/* <PrivateRoute path="/admin/github" component={GitHubSettings} /> */}
      {/* <PrivateRoute path="/admin/compliance/:tabName?" component={Compliance} /> */}
      <PrivateRoute path="/admin/users" component={Users} />
      {/* <PrivateRoute path="/admin/controlsAndRegulations" component={Regulations} /> */}
      <PrivateRoute path="/admin/integrations/:integrationName" component={IntegrationSettings} />
      <PrivateRoute path="/admin/integrations" component={Integrations} />
      <PrivateRoute path="/admin/settings" component={Settings} />
      <PrivateRoute exact path="/workunits/history/:clusterId/:wuid" component={WorkUnitDetails} />
      <PrivateRoute path="/workunits/history" component={WorkUnitHistory} />
      <PrivateRoute path="/workunits/sql" component={WorkUnitAnalytics} />
      <PrivateRoute path="/workunits/dashboard" component={WorkUnitDashboard} />
    </Switch>
  );
};

export default AdminRoutes;
