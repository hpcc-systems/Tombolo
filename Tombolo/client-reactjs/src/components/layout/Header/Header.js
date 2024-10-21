import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import logo from '../../../images/logo.png';
import { applicationActions } from '../../../redux/actions/Application.js';
import { assetsActions } from '../../../redux/actions/Assets.js';
import { expandGroups, selectGroup } from '../../../redux/actions/Groups.js';
import { authActions } from '../../../redux/actions/Auth.js';
import UserMenu from './UserMenu.js';
import ApplicationMenu from './ApplicationMenu.js';
import { Layout } from 'antd';

const { Header } = Layout;

const AppHeader = () => {
  //states needed
  const [selected, setSelected] = useState('Select an Application');

  //states needed from redux
  const applicationReducer = useSelector((state) => state.applicationReducer);
  const { application, applications, applicationsRetrieved, clusters, noClusters } = applicationReducer;

  //redux tools
  const dispatch = useDispatch();

  //if there is an application from local storage, set it as selected and dispatch application selected
  useEffect(() => {
    const activeApplicationId = localStorage.getItem('activeProjectId');

    if (activeApplicationId && applications.length > 0 && activeApplicationId !== application?.applicationId) {
      const app = applications.find((app) => app.id === activeApplicationId);
      if (app && selected !== app?.title) {
        setSelected(app.title);
        dispatch(applicationActions.applicationSelected(app.id, app.title));
      }
    }

    if (selected !== application?.applicationTitle) {
      setSelected(application.applicationTitle);
    }

    if (!application?.applicationId && !applications.length > 0) {
      setSelected('No Applications Available');
    }

    //if there is no active project id in local storage, and there is an applicaiton list, set the first application as active
    if (!activeApplicationId && applications.length > 0) {
      const app = applications[0];
      setSelected(app.title);
      dispatch(applicationActions.applicationSelected(app.id, app.title));
      localStorage.setItem('activeProjectId', app.id);
    }
  }, [application, applications, applicationReducer, dispatch]);

  //if there are no applications, get list from the server for selection
  useEffect(() => {
    //if applications is null, fetch list from server
    if (!applicationsRetrieved) {
      dispatch(applicationActions.getApplications());
    }
  }, [applications, dispatch]);

  //if application is selected in redux, get other relevant data into redux for use
  useEffect(() => {
    if (application?.applicationId && !clusters.length && !noClusters.noClusters) {
      dispatch(applicationActions.getClusters());
      dispatch(applicationActions.getAllActiveIntegrations());
    }
  }, [application, clusters.length, dispatch]);

  //log out user, clear relevant data in redux related to current application and log user out
  const handleLogOut = () => {
    //clear data
    setSelected('Select an Application');
    dispatch(applicationActions.applicationSelected('', ''));
    dispatch(expandGroups(['0-0']));
    dispatch(selectGroup({ id: '', key: '0-0' }));
    dispatch(assetsActions.clusterSelected(''));
    localStorage.removeItem('activeProjectId');

    //log user out
    dispatch(authActions.logout());
  };

  //handle application change
  const handleApplicationChange = (value) => {
    const applicationId = value;
    const applicationTitle = applications.find((app) => app.id === value)?.title;

    if (application?.applicationId !== applicationId) {
      dispatch(applicationActions.applicationSelected(applicationId, applicationTitle));
      localStorage.setItem('activeProjectId', applicationId);
      setSelected(applicationTitle);
    }
  };

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: '10px',
        position: 'fixed',
        zIndex: 1,
        width: '100%',
      }}>
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
