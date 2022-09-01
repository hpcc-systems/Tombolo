import React, { Suspense } from 'react';
import { connect } from 'react-redux';
import { Layout } from 'antd';
import { Router, Route, Switch } from 'react-router-dom';
import { Redirect } from 'react-router';
import history from './components/common/History';

// Auth pages

import Assets from './components/application/Assets'; // This is "home" view, can go into main bundle
const LoginPage = React.lazy(() => import('./components/login/LoginPage'));
const LoggedOut = React.lazy(() => import('./components/login/LoggedOut'));
const ForgotPassword = React.lazy(() => import('./components/login/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./components/login/ResetPassword'));
const RegisterPage = React.lazy(() => import('./components/login/RegisterPage'));
//Dataflow pages
const Dataflow = React.lazy(() => import('./components/application/Dataflow'));
const DataflowDetails = React.lazy(() => import('./components/application/Dataflow/DataflowDetails'));
const DataflowInstances = React.lazy(() => import('./components/application/DataflowInstances/DataflowInstances'));
const DataflowInstanceDetails = React.lazy(() =>
  import('./components/application/DataflowInstances/DataflowInstanceDetails')
);
// Application pages
const FileDetailsForm = React.lazy(() => import('./components/application/FileDetails'));
const FileTemplate = React.lazy(() => import('./components/application/templates/FileTemplate'));
const JobDetailsForm = React.lazy(() => import('./components/application/Jobs/JobDetails'));
const IndexDetailsForm = React.lazy(() => import('./components/application/IndexDetails'));
const QueryDetailsForm = React.lazy(() => import('./components/application/queries/QueryDetails'));
const VisualizationDetailsForm = React.lazy(() => import('./components/application/VisualizationDetails'));
const ManualJobDetail = React.lazy(() => import('./components/application/Jobs/ManualJobDetail'));
const Actions = React.lazy(() => import('./components/application/actions/actions'));
const AddJobsForm = React.lazy(() => import('./components/application/Jobs/AddjobsForm/AddJobsForm'));
// Admin pages
const Users = React.lazy(() => import('./components/admin/Users'));
const AdminApplications = React.lazy(() => import('./components/admin/apps/Applications'));
const AdminClusters = React.lazy(() => import('./components/admin/Clusters'));
const ClusterDetails = React.lazy(() => import('./components/admin/ClusterDetails'));
const AdminConsumers = React.lazy(() => import('./components/admin/Consumers'));
const Regulations = React.lazy(() => import('./components/admin/ControlsAndRegulations'));
const GitHubSettings = React.lazy(() => import('./components/admin/GitHubSettings/GitHubSettings'));
const ScheduledJobsPage = React.lazy(() => import('./components/admin/ScheduledJobsPage'));
const Constraints = React.lazy(() => import('./components/admin/Constraints/Constraints'));

// Shared layout, etc.
import { LeftNav } from './components/layout/LeftNav';
import { AppHeader } from './components/layout/Header';
import ErrorBoundary from './components/common/ErrorBoundary';
import Fallback from './components/common/Fallback';
import { PrivateRoute } from './components/common/PrivateRoute';
import { userActions } from './redux/actions/User';
import { store } from './redux/store/Store';

import tomboloLogo from './images/logo.png';

const { Header, Content } = Layout;

const BG_COLOR = '';

class App extends React.Component {
  state = {
    collapsed: true,
  };

  componentDidMount() {
    if (!this.props.authWithAzure) {
      store.dispatch(userActions.validateToken());
    }
  }

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
  };

  render() {
    const isApplicationSet = this.props.application && this.props.application.applicationId !== '' ? true : false;
    const dataFlowComp = () => {
      let applicationId = this.props.application ? this.props.application.applicationId : '';
      let applicationTitle = this.props.application ? this.props.application.applicationTitle : '';
      return <Dataflow applicationId={applicationId} applicationTitle={applicationTitle} user={this.props.user} />;
    };

    const getAssets = () => {
      const applicationId = this.props.application?.applicationId;
      if (applicationId) {
        return <Redirect to={`/${applicationId}/assets`} />;
      } else {
        return <Assets />;
      }
    };

    return (
      <Router history={history}>
        <Layout className="custom-scroll" style={{ height: '100vh', overflow: 'auto' }}>
          <Header
            style={{
              backgroundColor: BG_COLOR,
              maxHeight: '50px',
              position: 'fixed',
              zIndex: 100,
              width: '100%',
            }}>
            {this.props.user && this.props.user.token ? (
              <AppHeader />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                <img src={tomboloLogo} alt="Tombolo logo" />
              </div>
            )}
          </Header>
          <Layout>
            <LeftNav
              BG_COLOR={BG_COLOR}
              onCollapse={this.onCollapse}
              collapsed={this.state.collapsed}
              isApplicationSet={isApplicationSet}
            />

            <Content
              style={{
                transition: '.1s linear',
                margin: '55px 16px',
                marginLeft: this.state.collapsed ? '70px' : '215px',
              }}>
              <ErrorBoundary>
                <Suspense fallback={<Fallback />}>
                  {!this.props.authWithAzure ? ( // value is passed via AzureApp component
                    <>
                      <Route exact path="/login" component={LoginPage} />
                      <Route exact path="/register" component={RegisterPage} />
                      <Route exact path="/forgot-password" component={ForgotPassword} />
                      <Route exact path="/reset-password/:id" component={ResetPassword} />
                      <Route exact path="/logout" component={LoggedOut} />
                    </>
                  ) : null}

                  <Switch>
                    <PrivateRoute exact path="/" component={getAssets} />
                    <PrivateRoute path="/:applicationId/assets/file/:assetId?" component={FileDetailsForm} />
                    <PrivateRoute path="/:applicationId/assets/fileTemplate/:assetId?" component={FileTemplate} />
                    <PrivateRoute path="/:applicationId/assets/add-jobs" component={AddJobsForm} />
                    <PrivateRoute path="/:applicationId/assets/job/:assetId?" component={JobDetailsForm} />
                    <PrivateRoute path="/:applicationId/assets/index/:assetId?" component={IndexDetailsForm} />
                    <PrivateRoute path="/:applicationId/assets/query/:assetId?" component={QueryDetailsForm} />
                    <PrivateRoute
                      path="/:applicationId/assets/visualizations/:visualizationId?"
                      component={VisualizationDetailsForm}
                    />

                    <PrivateRoute path="/:applicationId/assets" component={Assets} />
                    <PrivateRoute path="/:applicationId/dataflow/details/:dataflowId?" component={DataflowDetails} />
                    <PrivateRoute path="/:applicationId/dataflow" component={dataFlowComp} />
                    <PrivateRoute path="/admin/applications" component={AdminApplications} />
                    <PrivateRoute path="/admin/bree" component={ScheduledJobsPage} />
                    <PrivateRoute path="/admin/clusters/:clusterId" component={ClusterDetails} />
                    <PrivateRoute path="/admin/clusters" component={AdminClusters} />
                    <PrivateRoute path="/admin/constraints/:tabName?" component={Constraints} />
                    <PrivateRoute path="/admin/github" component={GitHubSettings} />
                    <PrivateRoute path="/admin/users" component={Users} />
                    <PrivateRoute path="/admin/consumers" component={AdminConsumers} />
                    <PrivateRoute path="/admin/controlsAndRegulations" component={Regulations} />
                    <PrivateRoute
                      path="/:applicationId/dataflowinstances/dataflowInstanceDetails/:dataflowId?/:executionGroupId?"
                      component={DataflowInstanceDetails}
                    />
                    <PrivateRoute path="/:applicationId/dataflowinstances" component={DataflowInstances} />
                    <PrivateRoute path="/:applicationId/actions" component={Actions} />
                    <PrivateRoute
                      path="/:applicationId/manualJobDetails/:jobId/:jobExecutionId"
                      component={ManualJobDetail}
                    />
                    {this.props.authWithAzure ? <Route exact path="*" component={getAssets} /> : null}
                  </Switch>
                </Suspense>
              </ErrorBoundary>
            </Content>
          </Layout>
        </Layout>
      </Router>
    );
  }
}

function mapStateToProps(state) {
  const { application } = state.applicationReducer;
  const { user } = state.authenticationReducer;
  return { application, user };
}

const connectedApp = connect(mapStateToProps)(App);
export { connectedApp as App };
//export default App;
