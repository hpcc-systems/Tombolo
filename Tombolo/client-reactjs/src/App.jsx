//libraries and hooks
import { useState, useEffect, useRef, Suspense } from 'react';
import { connect, useSelector } from 'react-redux';
import { Layout, ConfigProvider } from 'antd';
import { Router } from 'react-router-dom';
import history from './components/common/History';
import { useDispatch } from 'react-redux';

// Shared layout, etc.
import LeftNav from './components/layout/LeftNav.jsx';
import AppHeader from './components/layout/Header/Header.jsx';
import ErrorBoundary from './components/common/ErrorBoundary';
import Fallback from './components/common/Fallback';
import { checkBackendStatus, checkOwnerExists } from '@/redux/slices/BackendSlice';
import { getRoleNameArray } from './components/common/AuthUtil.js';
import { getUser } from './components/common/userStorage.js';
import { loadUserFromStorage } from '@/redux/slices/AuthSlice';

// Loading screen
import LoadingScreen from './components/layout/LoadingScreen.jsx';

// Auth pages
import AuthRoutes from './components/login/AuthRoutes.jsx';

// App Pages
import AppRoutes from './components/application/AppRoutes.jsx';
import NoAccessRoutes from './components/application/NoAccessRoutes.jsx';

// Admin Pages
import AdminRoutes from './components/admin/AdminRoutes.jsx';

//initial Experience
import Tours from './components/InitialExperience/Tours.jsx';
import Wizard from './components/InitialExperience/Wizard.jsx';

const { Content } = Layout;

const App = () => {
  //left nav collapsed state
  const [collapsed, setCollapsed] = useState(localStorage.getItem('collapsed') === 'true');

  //redux dispatch
  const dispatch = useDispatch();

  // Sync Redux auth state with local storage on app mount
  useEffect(() => {
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  //login page states
  const [user, setUser] = useState(getUser());

  //loading message states
  const [message, setMessage] = useState('');

  //tour refs
  const appLinkRef = useRef(null);
  const clusterLinkRef = useRef(null);

  // get redux states
  const application = useSelector((state) => state.application.application);
  const authenticationReducer = useSelector((state) => state.auth);
  const backendReducer = useSelector((state) => state.backend);
  const { isConnected, statusRetrieved, ownerExists, ownerRetrieved } = backendReducer;

  //retrieve backend status on load to display message to user or application
  useEffect(() => {
    if (!statusRetrieved) {
      setMessage('Connecting to Server...');
      dispatch(checkBackendStatus());
      dispatch(checkOwnerExists());
    }
  }, [statusRetrieved, ownerRetrieved, dispatch]);

  //Check if user matches what is currently in storage after authenticationReducer runs
  useEffect(() => {
    const newUser = getUser();
    if (user?.id !== newUser?.id || user?.isAuthenticated !== newUser?.isAuthenticated) {
      setUser(newUser);
    }
  }, [authenticationReducer?.isAuthenticated, user]);

  //left nav collapse method
  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
    localStorage.setItem('collapsed', collapsed);
  };

  let roleArray = [];
  let isOwnerOrAdmin = false;
  let isReader = false;

  roleArray = getRoleNameArray();
  if (roleArray?.includes('administrator') || roleArray?.includes('owner')) {
    isOwnerOrAdmin = true;
  }
  if (roleArray?.includes('reader') && roleArray.length === 1) {
    isReader = true;
  }

  const userHasRoleandApplication = user?.roles?.length > 0 && user?.applications?.length > 0;

  return (
    <ConfigProvider>
      <Suspense fallback={<Fallback />}>
        <Router history={history}>
          <Layout className="custom-scroll" style={{ height: '100vh', overflow: 'auto' }}>
            {/*Backend Loading sequence going until everthing is retrieved*/}
            {!isConnected || !ownerRetrieved ? (
              <LoadingScreen isConnected={isConnected} statusRetrieved={statusRetrieved} message={message} />
            ) : (
              <>
                {/*No owner, force user to register one*/}
                {!ownerExists ? <Wizard /> : null}
                {/*User is not authenticated, show auth pages*/}
                {!user?.isAuthenticated && ownerExists ? <AuthRoutes /> : null}
                {/*User is authenticated, show application*/}
                {user?.isAuthenticated && ownerExists ? (
                  <>
                    <AppHeader />
                    <ConfigProvider componentDisabled={isReader}>
                      <Layout style={{ marginTop: '69px' }}>
                        <LeftNav
                          onCollapse={onCollapse}
                          collapsed={collapsed}
                          appLinkRef={appLinkRef}
                          clusterLinkRef={clusterLinkRef}
                        />
                        {isOwnerOrAdmin && <Tours appLinkRef={appLinkRef} clusterLinkRef={clusterLinkRef} />}
                        <Content
                          style={{
                            transition: '.1s linear',
                            // margin: '55px 0px',
                            marginLeft: collapsed ? '55px' : '200px',
                          }}>
                          <ErrorBoundary>
                            <Suspense fallback={<Fallback />}>
                              {!userHasRoleandApplication && !isOwnerOrAdmin ? (
                                <NoAccessRoutes />
                              ) : (
                                <AppRoutes application={application} authenticationReducer={authenticationReducer} />
                              )}

                              {isOwnerOrAdmin && <AdminRoutes />}
                            </Suspense>
                          </ErrorBoundary>
                        </Content>
                      </Layout>
                    </ConfigProvider>
                  </>
                ) : null}
              </>
            )}
          </Layout>
        </Router>
      </Suspense>
    </ConfigProvider>
  );
};

export default connect((state) => state)(App);

<>{/* Main Application, Only enters if user is authenticated and backend is connected */}</>;
