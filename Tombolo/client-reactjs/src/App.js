import React, { Suspense } from 'react';
import { connect } from 'react-redux';
import { Layout, ConfigProvider, Spin, Card, Tour } from 'antd';
import { Router, Route, Switch } from 'react-router-dom';
import { Redirect } from 'react-router';
import history from './components/common/History';
import i18next from 'i18next';
import zh_CN from 'antd/es/locale/zh_CN'; // For every language import respective module from antd
import en_US from 'antd/es/locale/en_US';
import logo from './images/logo.png';

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
const DirectoryMonitoring = React.lazy(() => import('./components/application/DirectoryMonitoring'));

// Admin pages
const Users = React.lazy(() => import('./components/admin/Users'));
const AdminApplications = React.lazy(() => import('./components/admin/apps/Applications'));
// const AdminClusters = React.lazy(() => import('./components/admin/Clusters'));
const Clusters = React.lazy(() => import('./components/admin/clusters/'));
const AdminConsumers = React.lazy(() => import('./components/admin/Consumers'));
const Regulations = React.lazy(() => import('./components/admin/ControlsAndRegulations'));
const GitHubSettings = React.lazy(() => import('./components/admin/GitHubSettings/GitHubSettings'));
const ScheduledJobsPage = React.lazy(() => import('./components/admin/ScheduledJobsPage'));
const Compliance = React.lazy(() => import('./components/admin/Compliance/Compliance'));
const Integrations = React.lazy(() => import('./components/admin/Integrations'));
const IntegrationSettings = React.lazy(() => import('./components/admin/Integrations/IntegrationSettings'));
const TeamsNotification = React.lazy(() => import('./components/admin/notifications/MsTeams/Teams'));

// Shared layout, etc.
import { LeftNav } from './components/layout/LeftNav';
import LanguageSwitcher from './components/layout/LanguageSwitcher';
import { AppHeader } from './components/layout/Header';
import ErrorBoundary from './components/common/ErrorBoundary';
import Fallback from './components/common/Fallback';
import { PrivateRoute } from './components/common/PrivateRoute';
import { userActions } from './redux/actions/User';
import { checkBackendStatus } from './redux/actions/Backend';
import { store } from './redux/store/Store';
import { applicationActions } from './redux/actions/Application';

const { Header, Content } = Layout;

const BG_COLOR = '';

class App extends React.Component {
  state = {
    collapsed: false,
    locale: 'en',
    message: '',
    tourOpen: false,
    clusterTourOpen: false,
    appLinkRef: React.createRef(),
    clusterLinkRef: React.createRef(),
  };

  componentDidMount() {
    //if status of backend hasn't been retrieved, check it
    if (!this.props.backendStatus.statusRetrieved) {
      this.setState({ message: 'Connecting to...' });
      store.dispatch(checkBackendStatus());
    } else {
      if (!this.props.authWithAzure) {
        this.setState({ message: 'Authenticating...' });
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

    //listen for clicks on the document to close tour if nav link is clicked
    document.addEventListener('click', this.handleClick);
  }

  handleClick = (e) => {
    if (this.state.appLinkRef.current && this.state.appLinkRef.current.contains(e.target)) {
      this.setState({ tourOpen: false });
    }

    if (this.state.clusterLinkRef.current && this.state.clusterLinkRef.current.contains(e.target)) {
      this.setState({ clusterTourOpen: false });
    }
  };

  //function to handle tour shown close
  handleTourShownClose = () => {
    this.setState({ tourOpen: false });
  };

  //function to handle tour shown close
  handleClusterTourShownClose = () => {
    this.setState({ clusterTourOpen: false });
  };

  onCollapse = (collapsed) => {
    this.setState({ collapsed });
    //set collapsed into local storage
    localStorage.setItem('collapsed', collapsed);
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
    const isBackendConnected = this.props.backendStatus.isConnected;
    const isBackendStatusRetrieved = this.props.backendStatus.statusRetrieved;
    const isApplicationSet = this.props.application && this.props.application.applicationId !== '' ? true : false;

    //if an application doesn't exist and the tour hasn't been shown, show the tour
    if (this.props.noApplication.noApplication && !this.props.noApplication.firstTourShown && isBackendConnected) {
      //if you're not already on the application page, show the left nav tour
      if (window.location.pathname !== '/admin/applications') {
        this.setState({ tourOpen: true });
      }
      this.props.dispatch(applicationActions.updateApplicationLeftTourShown(true));
    }

    //if an application exists, but a cluster doesn't, show the cluster tour
    if (
      this.props.application?.applicationId &&
      this.props.noClusters.noClusters &&
      !this.props.noClusters.firstTourShown
    ) {
      //if you're not already on the cluster page, show the left nav tour
      if (window.location.pathname !== '/admin/clusters') {
        this.setState({ clusterTourOpen: true });
      }

      this.props.dispatch(applicationActions.updateClustersLeftTourShown(true));
    }

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

    //steps for tour
    const steps = [
      {
        title: 'Welcome to Tombolo',
        description:
          'There is some setup that we need to complete before being able to fully utilize Tombolo. We will unlock features as we move through this interactive tutorial.',
        target: null,
      },
      {
        title: 'Applications',
        description: (
          <>
            <p>
              It looks like you have not set up an application yet. Applications are a necessary part of Tombolos basic
              functions, and we must set one up before unlocking the rest of the application. Click on the navigation
              element to head to the application management screen and set one up.
            </p>
            <br />
            <p>
              If youre interested to read more about applications, head to our documentation page at{' '}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://hpcc-systems.github.io/Tombolo/docs/Quick-Start/application">
                https://hpcc-systems.github.io/Tombolo/docs/Quick-Start/application
              </a>
            </p>
          </>
        ),
        placement: 'right',
        arrow: true,
        target: () => this.state.appLinkRef?.current,
        nextButtonProps: { style: { display: 'none' }, disabled: true },
        prevButtonProps: { style: { display: 'none' }, disabled: true },
      },
    ];

    const clusterSteps = [
      {
        title: 'Clusters',
        description: (
          <>
            <p>
              Now that we have an application set up, we can connect to an hpcc systems cluster to unlock the rest of
              the application. Click the navigation element to head to the cluster management screen and set one up.
            </p>
            <br />
            <p>
              If youre interested to read more about Clusters, head to our documentation page at{' '}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://hpcc-systems.github.io/Tombolo/docs/Quick-Start/cluster">
                https://hpcc-systems.github.io/Tombolo/docs/Quick-Start/cluster
              </a>
            </p>
          </>
        ),
        placement: 'right',
        arrrow: true,
        target: () => this.state.clusterLinkRef?.current,
        nextButtonProps: { style: { display: 'none' }, disabled: true },
      },
    ];

    return (
      <ConfigProvider locale={this.locale(this.state.locale)}>
        <Suspense fallback={<Fallback />}>
          <Router history={history}>
            <Layout className="custom-scroll" style={{ height: '100vh', overflow: 'auto' }}>
              {/* Go through loading sequence, first check if backend is connected and report with proper message */}
              {!isBackendConnected || !this.props.authWithAzure || !this.props.user || !this.props.user.token ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#f0f2f5',
                  }}>
                  {!isBackendConnected && isBackendStatusRetrieved ? (
                    <Card title={<img src={logo} />} style={{ width: '50%', textAlign: 'center' }}>
                      <h2>
                        Tombolo has encountered a network issue, please refresh the page. If the issue persists, contact
                        your system administrator.
                      </h2>
                    </Card>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        width: '100%',
                      }}>
                      <div style={{ width: '100%', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <img src={logo} />
                      </div>
                      <Spin size="large" />
                      <div style={{ width: '100%', marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                        <h2>{this.state.message}</h2>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Now that everything is loaded, present the application */
                <>
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
                  <Tour
                    steps={steps}
                    open={this.state.tourOpen}
                    onClose={this.handleTourShownClose}
                    indicatorsRender={() => <></>}
                  />
                  <Tour
                    steps={clusterSteps}
                    open={this.state.clusterTourOpen}
                    onClose={this.handleClusterTourShownClose}
                  />
                  <Layout>
                    <LeftNav
                      BG_COLOR={BG_COLOR}
                      onCollapse={this.onCollapse}
                      collapsed={this.state.collapsed}
                      isApplicationSet={isApplicationSet}
                      clusters={this.props.clusters}
                      appLinkRef={this.state.appLinkRef}
                      clusterLinkRef={this.state.clusterLinkRef}
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
                            <PrivateRoute
                              path="/:applicationId/assets/fileTemplate/:assetId?"
                              component={FileTemplate}
                            />
                            <PrivateRoute path="/:applicationId/fileMonitoring" component={FileMonitoring} />
                            <PrivateRoute path="/:applicationId/superfileMonitoring" component={SuperFileMonitoring} />
                            <PrivateRoute path="/:applicationId/ClusterMonitoring" component={ClusterMonitoring} />
                            <PrivateRoute path="/:applicationId/OrbitMonitoring" component={OrbitMonitoring} />
                            <PrivateRoute path="/:applicationId/jobMonitoring" component={JobMonitoring} />
                            <PrivateRoute path="/:applicationId/directoryMonitoring" component={DirectoryMonitoring} />
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
                            <PrivateRoute path="/admin/clusters" component={Clusters} />
                            <PrivateRoute path="/admin/notification-settings/msTeams" component={TeamsNotification} />
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
                            <PrivateRoute path="/:applicationId/dataflowinstances" component={DataflowInstances} />{' '}
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
                </>
              )}
            </Layout>
          </Router>
        </Suspense>
      </ConfigProvider>
    );
  }
}

function mapStateToProps(state) {
  const { application, clusters, noApplication, noClusters } = state.applicationReducer;
  const backendStatus = state.backendReducer;
  const { user } = state.authenticationReducer;
  return { application, clusters, user, backendStatus, noApplication, noClusters };
}

const connectedApp = connect(mapStateToProps)(App);
export { connectedApp as App };
//export default App;
