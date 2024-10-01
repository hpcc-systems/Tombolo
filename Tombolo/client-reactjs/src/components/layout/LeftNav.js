import React, { useEffect, useState } from 'react';
import { Link, withRouter, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  FileSearchOutlined,
  ClusterOutlined,
  NotificationOutlined,
  ClockCircleOutlined,
  ContainerOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  ApiOutlined,
  BellOutlined,
  FolderOutlined,
} from '@ant-design/icons';

function getItem(label, key, icon, children, type, disabled) {
  return {
    key,
    icon,
    children,
    label,
    type,
    disabled,
  };
}

const { Sider } = Layout;

const LeftNav = ({ collapsed, onCollapse, clusterLinkRef, appLinkRef }) => {
  //states and hooks needed
  const [current, setCurrent] = useState('0');
  const history = useHistory();

  //get states from redux
  const { applicationReducer } = useSelector((state) => state);
  const { applicationId, integrations, clusters } = applicationReducer;

  const clusterDisabled = clusters.length === 0;
  const disabled = !applicationId;

  //adjust the current highlighted menu item based on the current path
  useEffect(() => {
    const options = {
      assets: '1',
      dataflow: '2',
      dataflowinstances: '3',
      fileMonitoring: '4a',
      directoryMonitoring: '4b',
      clustermonitoring: '4c',
      jobmonitoring: '4d',
      superfileMonitoring: '4e',
      orbitMonitoring: '4f',
      notifications: '5a',
      clusterUsage: '5b',
      Orbit: '5c',
      clusters: '6',
      github: '8',
      consumers: '9',
      applications: '10',
      integrations: '11',
      msTeams: '12a',
    };

    // on init we check pathname if it contains options key in name, if it does => highlight that menu item
    for (const key in options) {
      let path = history.location.pathname;
      if (path.includes(key)) {
        setCurrent(options[key]);
      }
    }
  }, [history.location.pathname]);

  useEffect(() => {
    const options = {
      '/': '0',
      assets: '1',
      dataflow: '2',
      dataflowinstances: '3',
      fileMonitoring: '4a',
      directoryMonitoring: '4b',
      clustermonitoring: '4c',
      jobmonitoring: '4d',
      superfileMonitoring: '4e',
      orbitMonitoring: '4f',
      notifications: '5a',
      clusterUsage: '5b',
      Orbit: '5c',
      clusters: '6',
      github: '8',
      consumers: '9',
      applications: '10',
      integrations: '11',
      msTeams: '12a',
    };

    // on init we check pathname if it contains options key in name, if it does => highlight that menu item
    for (const key in options) {
      let path = history.location.pathname;
      if (path.includes(key)) {
        setCurrent(options[key]);
      }
    }
  }, [history.location.pathname]);

  const asrActive = integrations.some((i) => i.name === 'ASR' && i.application_id === applicationId);

  //TODO - check if user has edit permission
  const canEdit = true;

  const urlPrefix = () => {
    if (applicationId) return '/' + applicationId;
    else return '';
  };

  const workflowItems = [
    getItem(
      <>
        {disabled || clusterDisabled ? (
          <>
            <i className="fa fa-fw fa-cubes" />
            <span style={{ marginLeft: '1rem' }}>Assets</span>{' '}
          </>
        ) : (
          <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/' + applicationId + '/assets'}>
            <i className="fa fa-fw fa-cubes" />
            <span style={{ marginLeft: '1rem' }}>Assets</span>
          </Link>
        )}
      </>,
      '1',
      null,
      null,
      null,
      clusterDisabled
    ),
    getItem(
      <>
        {disabled || clusterDisabled ? (
          <>
            <i className="fa fa-fw fa-random" />
            <span style={{ marginLeft: '1rem' }}>Workflows</span>
          </>
        ) : (
          <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/' + applicationId + '/dataflow'}>
            <i className="fa fa-fw fa-random" />
            <span style={{ marginLeft: '1rem' }}>Workflows</span>
          </Link>
        )}
      </>,
      '2',
      null,
      null,
      null,
      clusterDisabled
    ),
    getItem(
      <>
        {disabled || clusterDisabled ? (
          <>
            <i className="fa fa-fw fa-microchip" />
            <span style={{ marginLeft: '1rem' }}>Workflow History</span>
          </>
        ) : (
          <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={urlPrefix() + '/dataflowinstances'}>
            <i className="fa fa-fw fa-microchip" />
            <span style={{ marginLeft: '1rem' }}>Workflow History</span>
          </Link>
        )}
      </>,
      '3',
      null,
      null,
      null,
      clusterDisabled
    ),
  ];

  const monitoringItems = [
    getItem(
      <>
        <DashboardOutlined />
        <span style={{ marginLeft: '1rem' }}>Monitoring</span>
      </>,
      '4',
      null,
      [
        getItem(
          <Link to={'/' + applicationId + '/fileMonitoring'}>
            <span>
              <FileSearchOutlined /> File
            </span>
          </Link>,
          '4a',
          null,
          null,
          null,
          clusterDisabled
        ),
        getItem(
          <Link to={'/' + applicationId + '/directoryMonitoring'}>
            <span>
              <FolderOutlined /> Directory
            </span>
          </Link>,
          '4b',
          null,
          null,
          null,
          clusterDisabled
        ),
        getItem(
          <Link to={'/' + applicationId + '/clustermonitoring'}>
            <span>
              <ClusterOutlined /> Cluster
            </span>
          </Link>,
          '4c',
          null,
          null,
          null,
          clusterDisabled
        ),
        getItem(
          <Link to={'/' + applicationId + '/jobmonitoring'}>
            <span>
              <ClockCircleOutlined /> Job
            </span>
          </Link>,
          '4d',
          null,
          null,
          null,
          clusterDisabled
        ),
        getItem(
          <Link to={'/' + applicationId + '/superfileMonitoring'}>
            <span>
              <ContainerOutlined /> Superfiles
            </span>
          </Link>,
          '4e',
          null,
          null,
          null,
          clusterDisabled
        ),
        asrActive
          ? getItem(
              <Link to={'/' + applicationId + '/orbitMonitoring'}>
                <span>
                  <CloudServerOutlined /> Orbit
                </span>
              </Link>,
              '4f',
              null,
              null,
              null,
              clusterDisabled
            )
          : null,
      ],
      null,
      clusterDisabled
    ),
    getItem(
      <>
        <BarChartOutlined />
        <span style={{ marginLeft: '1rem' }}>Dashboard</span>
      </>,
      '5',
      null,
      [
        getItem(
          <Link to={'/' + applicationId + '/dashboard/notifications'}>
            <span>
              <NotificationOutlined /> Notifications
            </span>
          </Link>,
          '5a',
          null,
          null
        ),
        getItem(
          <Link to={'/' + applicationId + '/dashboard/clusterUsage'}>
            <span>
              <ClusterOutlined /> Cluster
            </span>
          </Link>,
          '5b',
          null,
          null
        ),
        asrActive
          ? getItem(
              <Link to={'/' + applicationId + '/dashboard/Orbit'}>
                <span>
                  <CloudServerOutlined /> Orbit
                </span>
              </Link>,
              '5c',
              null,
              null
            )
          : null,
      ],
      null,
      clusterDisabled
    ),
  ];

  const connectionItems = [
    getItem(
      <>
        {disabled ? (
          <span ref={clusterLinkRef}>
            <ClusterOutlined />
            <span style={{ marginLeft: '1rem' }}>Clusters</span>
          </span>
        ) : (
          <Link ref={clusterLinkRef} style={{ color: 'rgba(255, 255, 255, .65)' }} to={'/admin/clusters'}>
            <ClusterOutlined style={{ color: 'rgba(255, 255, 255, .65)' }} />
            <span style={{ marginLeft: '1rem', color: 'rgb(255, 255, 255, .65)' }}>Clusters</span>
          </Link>
        )}
      </>,
      '6',
      null,
      null,
      null,
      clusterDisabled
    ),
    getItem(
      <>
        {disabled || clusterDisabled ? (
          <>
            <i className="fa fa-fw fa-github" />
            <span style={{ marginLeft: '1rem' }}>Github</span>
          </>
        ) : (
          <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/github'}>
            <i className="fa fa-fw fa-github" />
            <span style={{ marginLeft: '1rem' }}>Github</span>
          </Link>
        )}
      </>,
      '8',
      null,
      null,
      null,
      clusterDisabled
    ),
  ];

  const adminItems = [
    getItem(
      <Link ref={appLinkRef} style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/applications'}>
        <i className="fa fa-fw fa-desktop" />
        <span style={{ marginLeft: '1rem' }}>Applications</span>
      </Link>,
      '10',
      null
    ),
    getItem(
      <>
        {disabled || clusterDisabled ? (
          <>
            <i className="fa fa-fw fa-users" />
            <span style={{ marginLeft: '1rem' }}>Users</span>
          </>
        ) : (
          <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/userManagement'}>
            <i className="fa fa-fw fa-users" />
            <span style={{ marginLeft: '1rem' }}>Users</span>
          </Link>
        )}
      </>,
      '11',
      null,
      null,
      null,
      clusterDisabled
    ),
    getItem(
      <>
        {disabled || clusterDisabled ? (
          <>
            <ApiOutlined />
            <span style={{ marginLeft: '1rem' }}>Integrations</span>
          </>
        ) : (
          <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/integrations'}>
            <ApiOutlined />
            <span style={{ marginLeft: '1rem' }}>Integrations</span>
          </Link>
        )}
      </>,
      '12',
      null,
      null,
      null,
      clusterDisabled
    ),
    getItem(
      <>
        <BellOutlined />
        <span style={{ marginLeft: '1rem' }}>Notifications</span>
      </>,
      '13',
      null,
      [
        getItem(
          <Link to={'/admin/notification-settings/msTeams'}>
            <span>
              <i className="fa fa-windows" /> MS Teams
            </span>
          </Link>,
          '13a',
          null,
          null
        ),
      ],
      null,
      clusterDisabled
    ),
  ];

  const onClick = (e) => {
    setCurrent(e.key);
  };

  const title = (title) => {
    return (
      <Typography.Title ellipsis={true} className="left-nav-title">
        {title}
      </Typography.Title>
    );
  };

  const menu = (items) => {
    return <Menu theme="dark" mode="inline" items={items} selectedKeys={[current]} onClick={onClick} />;
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      collapsedWidth={55}
      className="custom-scroll"
      style={{
        color: 'rgba(255, 255, 255, 0.65)',
        marginTop: '46px',
        overflow: 'auto',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
      }}>
      {collapsed ? null : title('Workflows')}
      {menu(workflowItems)}
      {collapsed ? null : title('Monitoring')}
      {menu(monitoringItems)}
      {canEdit && collapsed ? null : title('Connections')}
      {menu(connectionItems)}
      {canEdit && collapsed ? null : title('Admin')}
      {canEdit && menu(adminItems)}
    </Sider>
  );
};

export default withRouter(LeftNav);
