//libraries and hooks
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { connect, useSelector } from 'react-redux';
import { Layout, ConfigProvider } from 'antd';
import { Router } from 'react-router-dom';
import history from './components/common/History';
import { useDispatch } from 'react-redux';

// Shared layout, etc.
import LeftNav from './components/layout/LeftNav.js';
import AppHeader from './components/layout/Header/Header.js';
import ErrorBoundary from './components/common/ErrorBoundary';
import Fallback from './components/common/Fallback';
import { checkBackendStatus, checkOwnerExists } from './redux/actions/Backend';
import { getRoleNameArray } from './components/common/AuthUtil.js';
import { getUser } from './components/common/userStorage.js';

// Loading screen
import LoadingScreen from './components/layout/LoadingScreen.js';

// Auth pages
import AuthRoutes from './components/login/AuthRoutes.js';

// App Pages
import AppRoutes from './components/application/AppRoutes.js';
import NoAccessRoutes from './components/application/NoAccessRoutes.js';

// Admin Pages
import AdminRoutes from './components/admin/AdminRoutes.js';

//initial Experience
import Tours from './components/InitialExperience/Tours.js';
import Wizard from './components/InitialExperience/Wizard.js';

const { Content } = Layout;

const App = () => {
  //left nav collapsed state
  const [collapsed, setCollapsed] = useState(localStorage.getItem('collapsed') === 'true');

  //login page states
  const [user, setUser] = useState(getUser());

  //loading message states
  const [message, setMessage] = useState('');

  //tour refs
  const appLinkRef = useRef(null);
  const clusterLinkRef = useRef(null);

  //get redux states
  const { applicationReducer, authenticationReducer, backendReducer } = useSelector((state) => state);

  //get child objects from redux states for ease of use
  const { application } = applicationReducer;
  const { isConnected, statusRetrieved, ownerExists, ownerRetrieved } = backendReducer;

  //redux dispatch
  const dispatch = useDispatch();

  //retrieve backend status on load to display message to user or application
  useEffect(() => {
    if (!statusRetrieved) {
      setMessage('Connecting to Server...');
      dispatch(checkBackendStatus());
      dispatch(checkOwnerExists());
    }
  }, [backendReducer]);

  //Check if user matches what is currently in storage after authentiationReducer runs
  useEffect(() => {
    const newUser = getUser();
    if (user !== newUser) {
      setUser(newUser);
    }
  }, [authenticationReducer]);

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
                {!user?.token && ownerExists ? <AuthRoutes /> : null}
                {/*User is authenticated, show application*/}
                {user?.token && ownerExists ? (
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
                        {isOwnerOrAdmin && (
                          <Tours
                            appLinkRef={appLinkRef}
                            clusterLinkRef={clusterLinkRef}
                            applicationReducer={applicationReducer}
                          />
                        )}
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
