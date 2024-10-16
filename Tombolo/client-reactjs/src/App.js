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

import LoadingScreen from './components/layout/LoadingScreen.js';

// // Auth pages
import AuthRoutes from './components/login/AuthRoutes.js';

// App Pages
import AppRoutes from './components/application/AppRoutes.js';

// Admin Pages
import AdminRoutes from './components/admin/AdminRoutes.js';

//initial Experience
// import Wizard from './components/InitialExperience/Wizard.js';
import Tours from './components/InitialExperience/Tours.js';
import Wizard from './components/InitialExperience/Wizard.js';

const { Content } = Layout;

const App = () => {
  //left nav collapsed state
  const [collapsed, setCollapsed] = useState(localStorage.getItem('collapsed') === 'true');

  //login page states
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

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
    if (user !== JSON.parse(localStorage.getItem('user'))) {
      setUser(JSON.parse(localStorage.getItem('user')));
    }
  }, [user, authenticationReducer]);

  //left nav collapse method
  const onCollapse = (collapsed) => {
    setCollapsed(collapsed);
    localStorage.setItem('collapsed', collapsed);
  };

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
                {!ownerExists ? <Wizard /> : null}
                {!user?.token && ownerExists ? <AuthRoutes /> : null}
                {user?.token && ownerExists ? (
                  <>
                    <AppHeader />
                    <Layout style={{ marginTop: '69px' }}>
                      <LeftNav
                        onCollapse={onCollapse}
                        collapsed={collapsed}
                        appLinkRef={appLinkRef}
                        clusterLinkRef={clusterLinkRef}
                      />
                      <Tours
                        appLinkRef={appLinkRef}
                        clusterLinkRef={clusterLinkRef}
                        applicationReducer={applicationReducer}
                      />
                      <Content
                        style={{
                          transition: '.1s linear',
                          // margin: '55px 0px',
                          marginLeft: collapsed ? '55px' : '200px',
                        }}>
                        <ErrorBoundary>
                          <Suspense fallback={<Fallback />}>
                            <AppRoutes application={application} authenticationReducer={authenticationReducer} />
                            <AdminRoutes />
                          </Suspense>
                        </ErrorBoundary>
                      </Content>
                    </Layout>
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
