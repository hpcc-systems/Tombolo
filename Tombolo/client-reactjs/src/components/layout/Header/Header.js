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
  const { application, applications, applicationsRetrieved, clusters, noClusters } = applicationReducer;
  const authenticationReducer = useSelector((state) => state.authenticationReducer);

  //redux tools
  const dispatch = useDispatch();

  //if there is an application from local storage, set it as selected and dispatch application selected
  useEffect(() => {
    const activeApplicationId = localStorage.getItem('activeApplicationId');

    if (activeApplicationId && applications.length > 0 && activeApplicationId !== application?.applicationId) {
      const app = applications.find((app) => app.id === activeApplicationId);
      if (app) {
        setSelected(app.title);
        dispatch(applicationActions.applicationSelected(app.id, app.title));
      }
    }
  }, [application, applications, dispatch]);

  //if there are no applications, get list from the server for selection
  useEffect(() => {
    //if applications is null, fetch list from server
    if (!applicationsRetrieved) {
      dispatch(applicationActions.getApplications());
    }

    // //if there are applications, select the first one and save it to local storage
    // if (applications && applications.length > 0) {
    //   console.log('applications founs!!!!', applications);
    //   dispatch(applicationActions.updateNoApplicationFound({ noApplication: false }));
    //   dispatch(applicationActions.applicationSelected(applications[0].id, applications[0].title));
    //   localStorage.setItem('activeApplicationId', applications[0].title);
    // } else {
    //   dispatch(applicationActions.updateNoApplicationFound({ noApplication: true }));
    // }
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

    //log user out
    dispatch(authActions.logout());
  };

  //handle application change
  const handleApplicationChange = (value) => {
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
          <ApplicationMenu
            applications={applications}
            handleApplicationChange={handleApplicationChange}
            selected={selected}
          />
        </div>
        <div>
          <UserMenu handleLogOut={handleLogOut} authenticationReducer={authenticationReducer} />
        </div>
      </div>
    </>
  );
};

export default AppHeader;
