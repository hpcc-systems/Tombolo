import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../../images/logo.png';
import UserMenu from './UserMenu';
import ApplicationMenu from './ApplicationMenu';
import { Layout } from 'antd';
import { useAppDispatch, useAppSelector } from '@/redux/store/hooks';
import type { ApplicationUI } from '@tombolo/shared';
import type { ClusterUI, IntegrationUI } from '@tombolo/shared';

import {
  applicationSelected,
  getClusters,
  getApplications,
  getAllActiveIntegrations,
} from '@/redux/slices/ApplicationSlice';

import styles from '../layout.module.css';
import { logout } from '@/redux/slices/AuthSlice';
import { clusterSelected } from '@/redux/slices/AssetSlice';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const [selected, setSelected] = useState('Select an Application');

  type ApplicationUIExtended = ApplicationUI & { applicationId?: string; applicationTitle?: string };

  type ApplicationStateShape = {
    application?: ApplicationUIExtended | null;
    applications?: ApplicationUI[];
    applicationsRetrieved?: boolean;
    clusters?: ClusterUI[];
    noClusters?: { noClusters?: boolean };
    integrations?: IntegrationUI[];
  };

  const {
    application,
    applications = [],
    applicationsRetrieved = false,
    clusters = [],
    noClusters = {},
  } = useAppSelector(state => state.application) as ApplicationStateShape;
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  const dispatch = useAppDispatch();

  useEffect(() => {
    const activeApplicationId = localStorage.getItem('activeProjectId');

    if (activeApplicationId && applications.length > 0 && activeApplicationId !== application?.applicationId) {
      const app = applications.find((appItem: any) => appItem.id === activeApplicationId);
      if (app && selected !== app?.title) {
        setSelected(app.title);
        dispatch(applicationSelected({ applicationId: app.id, applicationTitle: app.title }));
      }
    }

    if (selected !== application?.applicationTitle) {
      setSelected(application.applicationTitle);
    }

    if (!application?.applicationId && applications.length === 0) {
      setSelected('No Applications Available');
    }

    if (
      activeApplicationId &&
      applications.length > 0 &&
      !applications.find((appItem: any) => appItem.id === activeApplicationId)
    ) {
      const app = applications[0];
      setSelected(app.title);
      dispatch(applicationSelected({ applicationId: app.id, applicationTitle: app.title }));
      localStorage.setItem('activeProjectId', app.id);
    }

    if (!activeApplicationId && applications.length > 0) {
      const app = applications[0];
      setSelected(app.title);
      dispatch(applicationSelected({ applicationId: app.id, applicationTitle: app.title }));
      localStorage.setItem('activeProjectId', app.id);
    }
  }, [application, applications, dispatch]);

  useEffect(() => {
    if (!applicationsRetrieved) {
      dispatch(getApplications());
    }
  }, [applications, dispatch, applicationsRetrieved]);

  useEffect(() => {
    const noClustersFlag = (noClusters as any)?.noClusters;
    if (application?.applicationId && !clusters.length && !noClustersFlag) {
      dispatch(getClusters());
      dispatch(getAllActiveIntegrations());
    }
  }, [application, clusters.length, dispatch, noClusters]);

  if (!isAuthenticated) return null;

  const handleLogOut = () => {
    setSelected('Select an Application');
    dispatch(applicationSelected({ applicationId: '', applicationTitle: '' }));
    dispatch(clusterSelected(''));
    dispatch(logout());
  };

  const handleApplicationChange = (value: string) => {
    const applicationId = value;
    const applicationTitle = (
      applications.find((appItem: ApplicationUI) => appItem.id === value) as ApplicationUI | undefined
    )?.title;

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
