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

const AppHeader = () => {
  //states needed
  const [selected, setSelected] = useState('Select an Application');

  //states needed from redux
  const applicationReducer = useSelector((state) => state.applicationReducer);
  const { application, applications, clusters } = applicationReducer;
  const authenticationReducer = useSelector((state) => state.authenticationReducer);

  //redux tools
  const dispatch = useDispatch();

  //if there is an application from redux, set it as selected and save it to local storage
  useEffect(() => {
    if (application && application.applicationTitle !== '') {
      setSelected(application.applicationTitle);
      const currentAppId = application.applicationId;
      if (currentAppId) {
        let appList = applications;
        const app = appList.find((app) => app.value === currentAppId);
        if (!app) appList = [...appList, { value: application.applicationId, display: application.applicationTitle }];
        dispatch(applicationActions.applicationSelected(application.applicationId, application.applicationTitle));
        localStorage.setItem('activeApplicationId', application.applicationId);
      }
    }
  }, [application, applications, dispatch]);

  //if there are no applications, get list from the server for selection
  useEffect(() => {
    //if applications is null, fetch list from server
    if (!applications) {
      dispatch(applicationActions.getApplications());
    }

    //if there are applications, select the first one and save it to local storage
    if (applications && applications.length > 0) {
      dispatch(applicationActions.updateNoApplicationFound({ noApplication: false }));
      dispatch(applicationActions.applicationSelected(applications[0].value, applications[0].display));
      localStorage.setItem('activeApplicationId', applications[0].value);
    } else {
      dispatch(applicationActions.updateNoApplicationFound({ noApplication: true }));
    }
  }, [applications, dispatch]);

  //if application is selected in redux, get other relevant data into redux for use
  useEffect(() => {
    if (application?.applicationId && !clusters.length) {
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

    //log user out
    dispatch(authActions.logout());
  };

  //handle application change
  const handleChange = (value) => {
    if (typeof value === 'object') {
      value = value?.value;
    }

    const applicationId = value;
    const applicationTitle = applications.find((app) => app.value === applicationId)?.display || value;

    if (application?.applicationId !== applicationId) {
      dispatch(applicationActions.applicationSelected(applicationId, applicationTitle));
      localStorage.setItem('activeApplicationId', applicationId);
      setSelected(applicationTitle);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', maxHeight: '100%', justifyContent: 'space-between' }}>
        <div>
          <Link to={'/'} style={{ marginRight: '70px' }}>
            <img src={logo} alt="Tombolo logo" width="80px" height="19px" />
          </Link>
          <ApplicationMenu applications={applications} handleChange={handleChange} selected={selected} />
        </div>
        <div>
          <UserMenu handleLogOut={handleLogOut} authenticationReducer={authenticationReducer} />
        </div>
      </div>
    </>
  );
};

export default AppHeader;
