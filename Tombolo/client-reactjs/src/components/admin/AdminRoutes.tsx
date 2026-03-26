import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PrivateRoute } from '../common/PrivateRoute';

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

const AdminRoutes: React.FC = () => {
  return (
    <Switch>
      <PrivateRoute path="/admin/applications" component={AdminApplications} />
      <PrivateRoute path="/admin/userManagement" component={UserManagement} />
      <PrivateRoute path="/admin/bree" component={ScheduledJobsPage} />
      <PrivateRoute path="/admin/clusters/logs" component={ClusterLogs} />
      <PrivateRoute path="/admin/clusters" component={Clusters} />
      <PrivateRoute path="/admin/users" component={Users} />
      <PrivateRoute path="/admin/integrations/:integrationName" component={IntegrationSettings} />
      <PrivateRoute path="/admin/integrations" component={Integrations} />
      <PrivateRoute path="/admin/settings" component={Settings} />
      <PrivateRoute path="/admin/hpcc-tools" component={HPCC_Tools} />
      <PrivateRoute exact path="/workunits/history/:clusterId/:wuid" component={WorkUnitDetails} />
      <PrivateRoute path="/workunits/history" component={WorkUnitHistory} />
      <PrivateRoute path="/workunits/sql" component={WorkUnitAnalytics} />
      <PrivateRoute path="/workunits/dashboard" component={WorkUnitDashboard} />
      <Route
        path="*"
        render={({ location }) => {
          const isAdminOrWorkunitPath =
            location.pathname.startsWith('/admin') || location.pathname.startsWith('/workunits');
          return isAdminOrWorkunitPath ? <Redirect to="/" /> : null;
        }}
      />
    </Switch>
  );
};

export default AdminRoutes;
