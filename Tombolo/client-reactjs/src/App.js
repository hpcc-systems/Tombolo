//libraries and hooks
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { connect, useSelector } from 'react-redux';
import { Layout, ConfigProvider, Spin, Card, Tour } from 'antd';
import { Router, Route, Switch } from 'react-router-dom';
import history from './components/common/History';
import logo from './images/logo.png';
import { useDispatch } from 'react-redux';

// Shared layout, etc.
import LeftNav from './components/layout/LeftNav.js';
import AppHeader from './components/layout/Header/Header.js';
import ErrorBoundary from './components/common/ErrorBoundary';
import Fallback from './components/common/Fallback';
import { PrivateRoute } from './components/common/PrivateRoute';
// import { userActions } from './redux/actions/User';
import { checkBackendStatus } from './redux/actions/Backend';
import { applicationActions } from './redux/actions/Application';
import { authActions } from './redux/actions/Auth';
import BasicLayout from './components/common/BasicLayout.js';

//home page
import Home from './components/application/home/index.js';

// Auth pages
const Login = React.lazy(() => import('./components/login/login'));
const Register = React.lazy(() => import('./components/login/register'));
const ResetPassword = React.lazy(() => import('./components/login/ResetPassword.js'));
const ForgotPassword = React.lazy(() => import('./components/login/ForgotPassword.js'));

//Dataflow & Asset pages
const Assets = React.lazy(() => import('./components/application/Assets'));
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
const MyAccount = React.lazy(() => import('./components/application/myAccount/myAccount'));

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
const UserManagement = React.lazy(() => import('./components/admin/userManagement/index.jsx'));

const { Content } = Layout;

const App = () => {
  //left nav collapsed state
  const [collapsed, setCollapsed] = useState(localStorage.getItem('collapsed') === 'true');

  //login page states
  const [user, setUser] = useState(null);

  //loading message states
  const [message, setMessage] = useState('');

  //tour states
  const [tourOpen, setTourOpen] = useState(false);
  const [clusterTourOpen, setClusterTourOpen] = useState(false);
  const appLinkRef = useRef(null);
  const clusterLinkRef = useRef(null);

  //get redux states
  const { applicationReducer, authenticationReducer, backendReducer } = useSelector((state) => state);

  //get child objects from redux states for ease of use
  const { application, applicationsRetrieved, noApplication, noClusters } = applicationReducer;
  const { isConnected, statusRetrieved } = backendReducer;

  //redux dispatch
  const dispatch = useDispatch();

  //retrieve backend status on load to display message to user or application
  useEffect(() => {
    if (!statusRetrieved) {
      setMessage('Connecting to Server...');
      dispatch(checkBackendStatus());
    }
  }, []);

  //add event listener to close tour on click
  useEffect(() => {
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  //login page redirecting logic
  const loginPages = [
    {
      url: 'login',
    },
    {
      url: 'register',
    },
    {
      url: 'reset-password',
    },
    {
      url: 'forgot-password',
    },
  ];

  const isLogin = loginPages.some((step) => window.location.pathname.split('/')[1] === step.url);

  useEffect(() => {
    //get user from storage and check if id's and tokens are matching
    const storageUser = JSON.parse(localStorage.getItem('user'));
    const matchingTokens = user && storageUser && user.token === storageUser.token;
    const matchingIds = user && storageUser && user.id === storageUser.id;

    if (!user || !matchingTokens || !matchingIds) {
      setUser(JSON.parse(localStorage.getItem('user')));
    }
  }, [isLogin, user]);

  //Check if user is authenticated or is in local storage and redirect to login page if not
  useEffect(() => {
    if (authenticationReducer.isAuthenticated) return;
    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.token) {
      dispatch(authActions.loadUserFromStorage());
    } else {
      //if you're not on a login page and there is no user, redirect to login
      if (!isLogin) window.location.href = '/login';
    }
  }, [authenticationReducer]);

  //useEffect to show tours for new users
  useEffect(() => {
    if (
      !application?.applicationId &&
      !noApplication.noApplication &&
      !noApplication.firstTourShown &&
      applicationsRetrieved
    ) {
      if (window.location.pathname !== '/admin/applications') {
        setTourOpen(true);
      }
      dispatch(applicationActions.updateApplicationLeftTourShown(true));
    }

    if (application?.applicationId && noClusters.noClusters && !noClusters.firstTourShown) {
      if (window.location.pathname !== '/admin/clusters') {
        setClusterTourOpen(true);
      }

      dispatch(applicationActions.updateClustersLeftTourShown(true));
    }
  }, [application, noApplication, noClusters]);

  //click handler for tour closing
  const handleClick = (e) => {
    if (appLinkRef.current && appLinkRef.current.contains(e.target)) {
      setTourOpen(false);
    }

    if (clusterLinkRef.current && clusterLinkRef.current.contains(e.target)) {
      setClusterTourOpen(false);
    }
  };

  //tour closing methods
  const handleTourShownClose = () => {
    setTourOpen(false);
  };

  const handleClusterTourShownClose = () => {
    setClusterTourOpen(false);
  };

  //left nav collapse method
  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
    localStorage.setItem('collapsed', collapsed);
  };

  const dataFlowComp = () => {
    let applicationId = application ? application.applicationId : '';
    let applicationTitle = application ? application.applicationTitle : '';
    return <Dataflow applicationId={applicationId} applicationTitle={applicationTitle} user={authenticationReducer} />;
  };

  //app tour steps
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
              href="https://hpcc-systems.github.io/Tombolo/docs/User-Guides/application">
              our documentation site.
            </a>
          </p>
        </>
      ),
      placement: 'right',
      arrow: true,
      target: appLinkRef.current,
      nextButtonProps: { style: { display: 'none' }, disabled: true },
      prevButtonProps: { style: { display: 'none' }, disabled: true },
    },
  ];

  //cluster tour steps
  const clusterSteps = [
    {
      title: 'Clusters',
      description: (
        <>
          <p>
            Now that we have an application set up, we can connect to an hpcc systems cluster to unlock the rest of the
            application. Click the navigation element to head to the cluster management screen and set one up.
          </p>
          <br />
          <p>
            If youre interested to read more about Clusters, head to our documentation page at{' '}
            <a target="_blank" rel="noreferrer" href="https://hpcc-systems.github.io/Tombolo/docs/User-Guides/cluster">
              our documentation site.
            </a>
          </p>
        </>
      ),
      placement: 'right',
      arrrow: true,
      target: clusterLinkRef.current,
      nextButtonProps: { style: { display: 'none' }, disabled: true },
    },
  ];

  return (
    <ConfigProvider>
      <Suspense fallback={<Fallback />}>
        <Router history={history}>
          <Layout className="custom-scroll" style={{ height: '100vh', overflow: 'auto' }}>
            {/* Backend Connection Loading */}
            {!isConnected ? (
              <>
                {/* Loading screens to communicate loading sequence */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#f0f2f5',
                  }}>
                  {!isConnected && statusRetrieved ? (
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
                        <h2>{message}</h2>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Application Loaded, server running, Login Pages */}
                {isLogin && !user?.token ? (
                  <BasicLayout
                    content={
                      <Switch>
                        <Route path="/login" component={Login} />
                        <Route path="/register" component={Register} />
                        <Route path="/reset-password/:resetToken" component={ResetPassword} />
                        <Route path="/forgot-password" component={ForgotPassword} />
                      </Switch>
                    }
                  />
                ) : (
                  <>
                    {/* Main Application, Only enters if user is authenticated and backend is connected */}
                    <AppHeader />
                    <Tour steps={steps} open={tourOpen} onClose={handleTourShownClose} indicatorsRender={() => <></>} />
                    <Tour steps={clusterSteps} open={clusterTourOpen} onClose={handleClusterTourShownClose} />
                    <Layout style={{ marginTop: '69px' }}>
                      <LeftNav
                        onCollapse={onCollapse}
                        collapsed={collapsed}
                        appLinkRef={appLinkRef}
                        clusterLinkRef={clusterLinkRef}
                      />

                      <Content
                        style={{
                          transition: '.1s linear',
                          // margin: '55px 0px',
                          marginLeft: collapsed ? '55px' : '200px',
                        }}>
                        <ErrorBoundary>
                          <Suspense fallback={<Fallback />}>
                            <Switch>
                              <PrivateRoute exact path="/" component={Home} />
                              <PrivateRoute path="/myAccount" component={MyAccount} />
                              <PrivateRoute path="/:applicationId/assets/file/:assetId?" component={FileDetailsForm} />
                              <PrivateRoute
                                path="/:applicationId/assets/fileTemplate/:assetId?"
                                component={FileTemplate}
                              />
                              <PrivateRoute path="/:applicationId/fileMonitoring" component={FileMonitoring} />
                              <PrivateRoute
                                path="/:applicationId/superfileMonitoring"
                                component={SuperFileMonitoring}
                              />
                              <PrivateRoute path="/:applicationId/ClusterMonitoring" component={ClusterMonitoring} />
                              <PrivateRoute path="/:applicationId/OrbitMonitoring" component={OrbitMonitoring} />
                              <PrivateRoute path="/:applicationId/jobMonitoring" component={JobMonitoring} />
                              <PrivateRoute
                                path="/:applicationId/directoryMonitoring"
                                component={DirectoryMonitoring}
                              />
                              <PrivateRoute path="/:applicationId/dashboard/notifications" component={Notifications} />
                              <PrivateRoute path="/:applicationId/dashboard/clusterUsage" component={ClusterUsage} />
                              <PrivateRoute path="/:applicationId/dashboard/Orbit" component={Orbit} />
                              <PrivateRoute path="/:applicationId/assets/add-jobs" component={AddJobsForm} />
                              <PrivateRoute path="/:applicationId/assets/job/:assetId?" component={JobDetailsForm} />
                              <PrivateRoute
                                path="/:applicationId/assets/index/:assetId?"
                                component={IndexDetailsForm}
                              />
                              <PrivateRoute
                                path="/:applicationId/assets/query/:assetId?"
                                component={QueryDetailsForm}
                              />
                              <PrivateRoute path="/:applicationId/assets" component={Assets} />
                              <PrivateRoute
                                path="/:applicationId/dataflow/details/:dataflowId?"
                                component={DataflowDetails}
                              />
                              <PrivateRoute path="/:applicationId/dataflow" component={dataFlowComp} />
                              <PrivateRoute path="/admin/applications" component={AdminApplications} />
                              <PrivateRoute path="/admin/userManagement" component={UserManagement} />
                              <PrivateRoute path="/admin/bree" component={ScheduledJobsPage} />
                              <PrivateRoute path="/admin/clusters" component={Clusters} />
                              <PrivateRoute path="/admin/notification-settings/msTeams" component={TeamsNotification} />
                              <PrivateRoute path="/admin/github" component={GitHubSettings} />
                              <PrivateRoute path="/admin/compliance/:tabName?" component={Compliance} />
                              <PrivateRoute path="/admin/users" component={Users} />
                              <PrivateRoute path="/admin/consumers" component={AdminConsumers} />
                              <PrivateRoute path="/admin/controlsAndRegulations" component={Regulations} />
                              <PrivateRoute
                                path="/admin/integrations/:integrationName"
                                component={IntegrationSettings}
                              />
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
                            </Switch>
                          </Suspense>
                        </ErrorBoundary>
                      </Content>
                    </Layout>
                  </>
                )}
              </>
            )}
          </Layout>
        </Router>
      </Suspense>
    </ConfigProvider>
  );
};

export default connect((state) => state)(App);
