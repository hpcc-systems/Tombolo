/* eslint-disable unused-imports/no-unused-vars */
import React from 'react';
import { Switch } from 'react-router-dom';
import { PrivateRoute } from '../common/PrivateRoute';

//home page
const Home = React.lazy(() => import('./home'));
//Dataflow & Asset pages
const Assets = React.lazy(() => import('./Assets'));
// const Dataflow = React.lazy(() => import('./Dataflow'));
// const DataflowDetails = React.lazy(() => import('./Dataflow/DataflowDetails'));
// const DataflowInstances = React.lazy(() => import('./DataflowInstances/DataflowInstances'));
// const DataflowInstanceDetails = React.lazy(() => import('./DataflowInstances/DataflowInstanceDetails'));

// Application pages
const FileDetailsForm = React.lazy(() => import('./files/FileDetails'));
const FileTemplate = React.lazy(() => import('./templates/FileTemplate'));
const JobDetailsForm = React.lazy(() => import('./Jobs/JobDetails'));
const IndexDetailsForm = React.lazy(() => import('./IndexDetails'));
const QueryDetailsForm = React.lazy(() => import('./queries/QueryDetails'));
const ManualJobDetail = React.lazy(() => import('./Jobs/ManualJobDetail'));
const AddJobsForm = React.lazy(() => import('./Jobs/AddjobsForm/AddJobsForm'));
const FileMonitoring = React.lazy(() => import('./fileMonitoring/FileMonitoring'));
const OrbitMonitoring = React.lazy(() => import('./orbitMonitoring/OrbitMonitoring'));
const Orbit = React.lazy(() => import('./dashboard/Orbit/Orbit'));
const Notifications = React.lazy(() => import('./dashboard/notifications'));
const ClusterUsage = React.lazy(() => import('./dashboard/clusterUsage/'));
const ClusterMonitoring = React.lazy(() => import('./clusterMonitoring'));
const JobMonitoring = React.lazy(() => import('./jobMonitoring'));
const CostMonitoring = React.lazy(() => import('./costMonitoring'));
const TimeSeriesAnalysis = React.lazy(() => import('./jobMonitoring/timeSeriesAnalysis/'));
const LandingZoneMonitoring = React.lazy(() => import('./LandingZoneMonitoring'));
const MyAccount = React.lazy(() => import('./myAccount/myAccount'));

const AppRoutes = ({ application, authenticationReducer }) => {
  // const dataFlowComp = () => {
  //   let applicationId = application ? application.applicationId : '';
  //   let applicationTitle = application ? application.applicationTitle : '';
  //   return <Dataflow applicationId={applicationId} applicationTitle={applicationTitle} user={authenticationReducer} />;
  // };
  return (
    <Switch>
      <PrivateRoute exact path="/" component={Home} />
      <PrivateRoute path="/myAccount" component={MyAccount} />
      <PrivateRoute path="/:applicationId/assets/file/:assetId?" component={FileDetailsForm} />
      <PrivateRoute path="/:applicationId/assets/fileTemplate/:assetId?" component={FileTemplate} />
      <PrivateRoute path="/:applicationId/fileMonitoring" component={FileMonitoring} />
      <PrivateRoute path="/:applicationId/ClusterMonitoring" component={ClusterMonitoring} />
      <PrivateRoute path="/:applicationId/OrbitMonitoring" component={OrbitMonitoring} />
      <PrivateRoute path="/:applicationId/jobMonitoring/timeSeriesAnalysis" component={TimeSeriesAnalysis} />
      <PrivateRoute path="/:applicationId/jobMonitoring" component={JobMonitoring} />
      <PrivateRoute path="/:applicationId/costMonitoring" component={CostMonitoring} />
      <PrivateRoute path="/:applicationId/landingZoneMonitoring" component={LandingZoneMonitoring} />
      <PrivateRoute path="/:applicationId/dashboard/notifications" component={Notifications} />
      <PrivateRoute path="/:applicationId/dashboard/clusterUsage" component={ClusterUsage} />
      <PrivateRoute path="/:applicationId/dashboard/Orbit" component={Orbit} />
      <PrivateRoute path="/:applicationId/assets/add-jobs" component={AddJobsForm} />
      <PrivateRoute path="/:applicationId/assets/job/:assetId?" component={JobDetailsForm} />
      <PrivateRoute path="/:applicationId/assets/index/:assetId?" component={IndexDetailsForm} />
      <PrivateRoute path="/:applicationId/assets/query/:assetId?" component={QueryDetailsForm} />
      <PrivateRoute path="/:applicationId/assets" component={Assets} />
      {/* <PrivateRoute path="/:applicationId/dataflow/details/:dataflowId?" component={DataflowDetails} />
      <PrivateRoute
        path="/:applicationId/dataflowinstances/dataflowInstanceDetails/:dataflowId?/:executionGroupId?"
        component={DataflowInstanceDetails}
      />
      <PrivateRoute path="/:applicationId/dataflowinstances" component={DataflowInstances} />{' '}
      <PrivateRoute path="/:applicationId/dataflowinstances" component={DataflowInstances} /> */}
      <PrivateRoute path="/:applicationId/manualJobDetails/:jobId/:jobExecutionId" component={ManualJobDetail} />
      {/* <PrivateRoute path="/:applicationId/dataflow" component={dataFlowComp} /> */}
    </Switch>
  );
};

export default AppRoutes;
