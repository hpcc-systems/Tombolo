import React, { Suspense } from 'react';
import { connect } from 'react-redux';
import { Layout, ConfigProvider } from 'antd';
import { Router, Route, Switch } from 'react-router-dom';
import { Redirect } from 'react-router';
import history from './components/common/History';
import i18next from 'i18next';
import zh_CN from 'antd/es/locale/zh_CN'; // For every language import respective module from antd
import en_US from 'antd/es/locale/en_US';

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
const FileDetailsForm = React.lazy(() => import('./components/application/files/FileDetails'));
const FileTemplate = React.lazy(() => import('./components/application/templates/FileTemplate'));
const JobDetailsForm = React.lazy(() => import('./components/application/Jobs/JobDetails'));
const IndexDetailsForm = React.lazy(() => import('./components/application/IndexDetails'));
const QueryDetailsForm = React.lazy(() => import('./components/application/queries/QueryDetails'));
const VisualizationDetailsForm = React.lazy(() => import('./components/application/VisualizationDetails'));
const ManualJobDetail = React.lazy(() => import('./components/application/Jobs/ManualJobDetail'));
const Actions = React.lazy(() => import('./components/application/actions/actions'));
const AddJobsForm = React.lazy(() => import('./components/application/Jobs/AddjobsForm/AddJobsForm'));
const FileMonitoring = React.lazy(() => import('./components/application/fileMonitoring/FileMonitoring'));
const OrbitMonitoring = React.lazy(() => import('./components/application/orbitMonitoring/OrbitMonitoring'));
const SuperFileMonitoring = React.lazy(() =>
  import('./components/application/superfileMonitoring/SuperFileMonitoring')
);
const Orbit = React.lazy(() => import('./components/application/dashboard/Orbit/Orbit'));
const Notifications = React.lazy(() => import('./components/application/dashboard/notifications'));
const ClusterUsage = React.lazy(() => import('./components/application/dashboard/clusterUsage/'));
const ClusterMonitoring = React.lazy(() => import('./components/application/clusterMonitoring'));
const JobMonitoring = React.lazy(() => import('./components/application/jobMonitoring'));

// Admin pages
const Users = React.lazy(() => import('./components/admin/Users'));
const AdminApplications = React.lazy(() => import('./components/admin/apps/Applications'));
const AdminClusters = React.lazy(() => import('./components/admin/Clusters'));
const ClusterDetails = React.lazy(() => import('./components/admin/ClusterDetails'));
const AdminConsumers = React.lazy(() => import('./components/admin/Consumers'));
const Regulations = React.lazy(() => import('./components/admin/ControlsAndRegulations'));
const GitHubSettings = React.lazy(() => import('./components/admin/GitHubSettings/GitHubSettings'));
const ScheduledJobsPage = React.lazy(() => import('./components/admin/ScheduledJobsPage'));
const Compliance = React.lazy(() => import('./components/admin/Compliance/Compliance'));
const Integrations = React.lazy(() => import('./components/admin/Integrations'));
const IntegrationSettings = React.lazy(() => import('./components/admin/Integrations/IntegrationSettings'));
const TeamsNotification = React.lazy(() => import('./components/admin/notifications/MsTeams/Teams'));
const emails = React.lazy(() => import('./components/admin/notifications/Emails/index'));

// Shared layout, etc.
import { LeftNav } from './components/layout/LeftNav';
import LanguageSwitcher from './components/layout/LanguageSwitcher';
import { AppHeader } from './components/layout/Header';
import ErrorBoundary from './components/common/ErrorBoundary';
import Fallback from './components/common/Fallback';
import { PrivateRoute } from './components/common/PrivateRoute';
import { userActions } from './redux/actions/User';
import { store } from './redux/store/Store';

const { Header, Content } = Layout;

const BG_COLOR = '';

class App extends React.Component {
  state = {
    collapsed: true,
    locale: 'en',
  };

  componentDidMount() {
    if (!this.props.authWithAzure) {
      store.dispatch(userActions.validateToken());
    }

    // When app loads if there is language set in local storage use that.
    const appLanguage = localStorage.getItem('i18nextLng');
    if (!appLanguage || appLanguage.length < 2) {
      i18next.changeLanguage('en');
    } else {
      this.setState({ locale: appLanguage });
      i18next.changeLanguage(localStorage.getItem('i18nextLng'));
    }
  }

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
  };

  // Setting locale for antd components.
  setLocale = (language) => {
    this.setState({ locale: language });
  };

  // Returns which locale module to use based on users selection of language
  locale = (lang) => {
    switch (lang) {
      case 'cn':
        return zh_CN;
      default:
        return en_US;
    }
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
      <ConfigProvider locale={this.locale(this.state.locale)}>
        <Suspense fallback={<Fallback />}>
          <Router history={history}>
            <Layout className="custom-scroll" style={{ height: '100vh', overflow: 'auto' }}>
              {this.props.user && this.props.user.token ? (
                <Header
                  style={{
                    backgroundColor: BG_COLOR,
                    maxHeight: '50px',
                    position: 'fixed',
                    zIndex: 100,
                    width: '100%',
                  }}>
                  <AppHeader
                    setLocale={this.setLocale}
                    languageSwitcher={<LanguageSwitcher setLocale={this.setLocale} />}
                  />
                </Header>
              ) : null}
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
                        <PrivateRoute path="/:applicationId/fileMonitoring" component={FileMonitoring} />
                        <PrivateRoute path="/:applicationId/superfileMonitoring" component={SuperFileMonitoring} />
                        <PrivateRoute path="/:applicationId/ClusterMonitoring" component={ClusterMonitoring} />
                        <PrivateRoute path="/:applicationId/OrbitMonitoring" component={OrbitMonitoring} />
                        <PrivateRoute path="/:applicationId/jobMonitoring" component={JobMonitoring} />{' '}
                        <PrivateRoute path="/:applicationId/dashboard/notifications" component={Notifications} />
                        <PrivateRoute path="/:applicationId/dashboard/clusterUsage" component={ClusterUsage} />
                        <PrivateRoute path="/:applicationId/dashboard/Orbit" component={Orbit} />
                        <PrivateRoute path="/:applicationId/assets/add-jobs" component={AddJobsForm} />
                        <PrivateRoute path="/:applicationId/assets/job/:assetId?" component={JobDetailsForm} />
                        <PrivateRoute path="/:applicationId/assets/index/:assetId?" component={IndexDetailsForm} />
                        <PrivateRoute path="/:applicationId/assets/query/:assetId?" component={QueryDetailsForm} />
                        <PrivateRoute
                          path="/:applicationId/assets/visualizations/:visualizationId?"
                          component={VisualizationDetailsForm}
                        />
                        <PrivateRoute path="/:applicationId/assets" component={Assets} />
                        <PrivateRoute
                          path="/:applicationId/dataflow/details/:dataflowId?"
                          component={DataflowDetails}
                        />
                        <PrivateRoute path="/:applicationId/dataflow" component={dataFlowComp} />
                        <PrivateRoute path="/admin/applications" component={AdminApplications} />
                        <PrivateRoute path="/admin/bree" component={ScheduledJobsPage} />
                        <PrivateRoute path="/admin/clusters/:clusterId" component={ClusterDetails} />
                        <PrivateRoute path="/admin/clusters" component={AdminClusters} />
                        <PrivateRoute path="/admin/notification-settings/msTeams" component={TeamsNotification} />
                        <PrivateRoute path="/admin/notification-settings/emails" component={emails} />
                        <PrivateRoute path="/admin/github" component={GitHubSettings} />
                        <PrivateRoute path="/admin/compliance/:tabName?" component={Compliance} />
                        <PrivateRoute path="/admin/users" component={Users} />
                        <PrivateRoute path="/admin/consumers" component={AdminConsumers} />
                        <PrivateRoute path="/admin/controlsAndRegulations" component={Regulations} />
                        <PrivateRoute path="/admin/integrations/:integrationName" component={IntegrationSettings} />
                        <PrivateRoute path="/admin/integrations" component={Integrations} />
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
        </Suspense>
      </ConfigProvider>
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
