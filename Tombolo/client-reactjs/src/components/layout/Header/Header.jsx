import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import logo from '../../../images/logo.png';
import UserMenu from './UserMenu.jsx';
import ApplicationMenu from './ApplicationMenu.jsx';
import { Layout } from 'antd';

import {
  applicationSelected,
  getClusters,
  getApplications,
  getAllActiveIntegrations,
} from '@/redux/slices/ApplicationSlice';

import styles from '../layout.module.css';
import { logout } from '@/redux/slices/AuthSlice';
import { clusterSelected } from '@/redux/slices/AssetSlice';
import { groupsExpanded, selectGroup } from '@/redux/slices/GroupSlice';

const { Header } = Layout;

const AppHeader = () => {
  const [selected, setSelected] = useState('Select an Application');

  // Redux
  const { application, applications, applicationsRetrieved, clusters, noClusters } = useSelector(
    (state) => state.application
  );
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  //redux tools
  const dispatch = useDispatch();

  //if there is an application from local storage, set it as selected and dispatch application selected
  useEffect(() => {
    const activeApplicationId = localStorage.getItem('activeProjectId');

    if (activeApplicationId && applications.length > 0 && activeApplicationId !== application?.applicationId) {
      const app = applications.find((app) => app.id === activeApplicationId);
      if (app && selected !== app?.title) {
        setSelected(app.title);
        dispatch(applicationSelected({ applicationId: app.id, applicationTitle: app.title }));
      }
    }

    if (selected !== application?.applicationTitle) {
      setSelected(application.applicationTitle);
    }

    if (!application?.applicationId && !applications.length > 0) {
      setSelected('No Applications Available');
    }

    //if there is an active project id, but id doesn't exist in their app list, reset it to the first application user has access too
    if (activeApplicationId && applications.length > 0 && !applications.find((app) => app.id === activeApplicationId)) {
      const app = applications[0];
      setSelected(app.title);
      dispatch(applicationSelected({ applicationId: app.id, applicationTitle: app.title }));
      localStorage.setItem('activeProjectId', app.id);
    }

    //if there is no active project id in local storage, and there is an applicaiton list, set the first application as active
    if (!activeApplicationId && applications.length > 0) {
      const app = applications[0];
      setSelected(app.title);
      dispatch(applicationSelected({ applicationId: app.id, applicationTitle: app.title }));
      localStorage.setItem('activeProjectId', app.id);
    }
  }, [application, applications, dispatch]);

  // if there are no applications, get list from the server for selection
  useEffect(() => {
    //if applications is null, fetch list from server
    if (!applicationsRetrieved) {
      dispatch(getApplications());
    }
  }, [applications, dispatch]);

  // if the application is selected in redux, get other relevant data into redux for use
  useEffect(() => {
    if (application?.applicationId && !clusters.length && !noClusters.noClusters) {
      dispatch(getClusters());
      dispatch(getAllActiveIntegrations());
    }
  }, [application, clusters.length, dispatch]);

  // Only render if authenticated
  if (!isAuthenticated) return null;

  // log out user, clear relevant data in redux related to current application and log user out
  const handleLogOut = () => {
    //clear data
    setSelected('Select an Application');
    dispatch(applicationSelected({ applicationId: '', applicationTitle: '' }));
    dispatch(groupsExpanded(['0-0']));
    dispatch(selectGroup({ id: '', key: '0-0' }));
    dispatch(clusterSelected(''));

    //log user out
    dispatch(logout());
  };

  //handle application change
  const handleApplicationChange = (value) => {
    const applicationId = value;
    const applicationTitle = applications.find((app) => app.id === value)?.title;

    if (application?.applicationId !== applicationId) {
      dispatch(applicationSelected({ applicationId: applicationId, applicationTitle: applicationTitle }));
      localStorage.setItem('activeProjectId', applicationId);
      setSelected(applicationTitle);
    }
  };

  return (
    <Header className={styles.header}>
      <div>
        <Link to={'/'} style={{ marginRight: '70px' }}>
          <img src={logo} alt="Tombolo logo" width="80px" height="19px" />
        </Link>
        <ApplicationMenu
          applications={applications}
          handleApplicationChange={handleApplicationChange}
          selected={selected}
        />
      </div>
      <div>
        <UserMenu handleLogOut={handleLogOut} />
      </div>
    </Header>
  );
};

export default AppHeader;
