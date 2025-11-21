import { useEffect, useState } from 'react';
import { Link, withRouter, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Layout, Menu, Typography, Tooltip } from 'antd';
import {
  DashboardOutlined,
  FileSearchOutlined,
  ClusterOutlined,
  NotificationOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  CloudServerOutlined,
  ApiOutlined,
  SettingOutlined,
  FolderOutlined,
  WarningFilled,
  DollarOutlined,
} from '@ant-design/icons';

import { getRoleNameArray } from '../common/AuthUtil';

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
  const [disabled, setDisabled] = useState(true);
  const [clusterDisabled, setClusterDisabled] = useState(true);
  const history = useHistory();

  //get states from redux
  const application = useSelector(state => state.application.application);
  // const integrations = useSelector((state) => state.application.integrations);
  const clusters = useSelector(state => state.application.clusters);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  const applicationId = application?.applicationId;
  const clusterConnectionIssue = clusters?.some(c => c.reachabilityInfo?.reachable === false);

  const roleArray = getRoleNameArray();

  //control the disabled state of the menu items based on the application and cluster states
  useEffect(() => {
    if (application && applicationId) {
      setDisabled(false);
    } else {
      setDisabled(true);
    }
  }, [application]);

  useEffect(() => {
    if (clusters.length > 0 && applicationId) {
      setClusterDisabled(false);
    } else {
      setClusterDisabled(true);
    }
  }, [clusters, application]);

  //adjust the current highlighted menu item based on the current path
  useEffect(() => {
    const options = {
      fileMonitoring: '4a',
      landingZone: '4b',
      clustermonitoring: '4c',
      jobmonitoring: '4d',
      notifications: '5a',
      clusterUsage: '5b',
      clusters: '6',
      consumers: '9',
      applications: '10',
      userManagement: '11',
      integrations: '12',
      settings: '13',
      msTeams: '13a',
    };

    // on init we check pathname if it contains options key in name, if it does => highlight that menu item
    for (const key in options) {
      let path = history.location.pathname;
      if (path.includes(key)) {
        setCurrent(options[key]);
      }
    }
  }, [history.location.pathname]);

  // Only render if authenticated
  if (!isAuthenticated) return null;

  // const asrActive = integrations.some((i) => i.name === 'ASR' && i.application_id === applicationId);

  //TODO - check if user has edit permission
  const ownerOrAdmin = roleArray?.includes('administrator') || roleArray?.includes('owner');
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
          <Link to={'/' + applicationId + '/landingZoneMonitoring'}>
            <span>
              <FolderOutlined /> Landing Zone
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
          <Link to={'/' + applicationId + '/orbit-profile-monitoring'}>
            <span>
              <CloudServerOutlined /> Orbit Profile
            </span>
          </Link>,
          '4f-new',
          null,
          null,
          null,
          clusterDisabled
        ),
        getItem(
          <Link to={'/' + applicationId + '/costMonitoring'}>
            <span>
              <DollarOutlined /> Cost
            </span>
          </Link>,
          '4g',
          null,
          null,
          null,
          clusterDisabled
        ),
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
            <Tooltip
              placement="right"
              arrow={false}
              styles={{ body: { left: 35 } }}
              open={collapsed && clusterConnectionIssue ? true : false}
              title={<WarningFilled style={{ color: 'yellow', marginLeft: '1rem' }} />}>
              <ClusterOutlined style={{ color: 'rgba(255, 255, 255, .65)' }} />
            </Tooltip>
            <span style={{ marginLeft: '1rem', color: 'rgb(255, 255, 255, .65)' }}>Clusters</span>
            {clusterConnectionIssue && <WarningFilled style={{ color: 'yellow', marginLeft: '1rem' }} />}
          </Link>
        )}
      </>,
      '6',
      null,
      null,
      null,
      disabled
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
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/userManagement'}>
          <i className="fa fa-fw fa-users" />
          <span style={{ marginLeft: '1rem' }}>Users</span>
        </Link>
      </>,
      '11',
      null,
      null,
      null
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
      <Link to={'/admin/settings'}>
        <span>
          <SettingOutlined />
          <span style={{ marginLeft: '1rem', color: 'rgb(255, 255, 255, .65)' }}>Settings</span>
        </span>
      </Link>,
      '13',
      null,
      null,
      null,
      clusterDisabled
    ),
  ];

  const onClick = e => {
    setCurrent(e.key);
  };

  const title = title => {
    return (
      <Typography.Title ellipsis={true} className="left-nav-title">
        {title}
      </Typography.Title>
    );
  };

  const menu = items => {
    return (
      <Menu
        theme="dark"
        mode="inline"
        items={items}
        selectedKeys={[current]}
        onClick={onClick}
        defaultOpenKeys={['4']}
      />
    );
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
      {collapsed ? null : title('Monitoring')}
      {menu(monitoringItems)}
      {ownerOrAdmin && (
        <>
          {collapsed ? null : title('Connections')}
          {menu(connectionItems)}
          {collapsed ? null : title('Admin')}
          {menu(adminItems)}
        </>
      )}
    </Sider>
  );
};

export default withRouter(LeftNav);
