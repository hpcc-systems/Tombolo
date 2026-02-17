import React, { useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
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
  HistoryOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

import { useAppSelector } from '@/redux/store/hooks';
import { getRoleNameArray } from '../common/AuthUtil';
import type { ApplicationUI, ClusterUI, IntegrationUI } from '@tombolo/shared';

type MenuItem = any;

function getItem(
  label: React.ReactNode,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: any,
  disabled?: boolean
): MenuItem {
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

interface Props {
  collapsed: boolean;
  onCollapse?: (collapsed: boolean) => void;
  clusterLinkRef?: React.RefObject<HTMLElement>;
  appLinkRef?: React.RefObject<HTMLElement>;
}

const LeftNav: React.FC<Props> = ({ collapsed, onCollapse, clusterLinkRef, appLinkRef }) => {
  const [current, setCurrent] = useState<string>('0');
  const [disabled, setDisabled] = useState(true);
  const [clusterDisabled, setClusterDisabled] = useState(true);
  const history = useHistory();

  const application = useAppSelector(state => state.application.application) as ApplicationUI | null | undefined;
  const clusters = useAppSelector(state => state.application.clusters || []) as ClusterUI[];
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const integrations = useAppSelector(state => state.application.integrations || []) as IntegrationUI[];

  const applicationId = (application as any)?.applicationId;
  const clusterConnectionIssue = clusters?.some((c: ClusterUI) => c.reachabilityInfo?.reachable === false);

  const roleArray = getRoleNameArray();

  const asrIntegration = integrations.some(
    (integration: IntegrationUI) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  useEffect(() => {
    setDisabled(!(application && applicationId));
  }, [application, applicationId]);

  useEffect(() => {
    setClusterDisabled(!(Array.isArray(clusters) && clusters.length > 0 && applicationId));
  }, [clusters, applicationId]);

  useEffect(() => {
    const options: Record<string, string> = {
      fileMonitoring: '4a',
      landingZone: '4b',
      clustermonitoring: '4c',
      jobmonitoring: '4d',
      notifications: '5a',
      clusterUsage: '5b',
      clusters: '6',
      workunits: '7a',
      sql: '7b',
      consumers: '9',
      applications: '10',
      userManagement: '11',
      integrations: '12',
      settings: '13',
      msTeams: '13a',
    };

    for (const key in options) {
      const path = history.location.pathname;
      if (path.includes(key)) {
        setCurrent(options[key]);
      }
    }
  }, [history.location.pathname]);

  if (!isAuthenticated) return null;

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
        asrIntegration &&
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

  const workunitItems = [
    getItem(
      <Link to={'/workunits/history'}>
        <span>
          <HistoryOutlined />
          <span style={{ marginLeft: '1rem' }}>History</span>
        </span>
      </Link>,
      '7a',
      null,
      null,
      null,
      disabled
    ),
    ...(roleArray.includes('owner') || roleArray.includes('administrator')
      ? [
          getItem(
            <Link to={'/workunits/sql'}>
              <span>
                <ThunderboltOutlined />
                <span style={{ marginLeft: '1rem' }}>SQL</span>
              </span>
            </Link>,
            '7b',
            null,
            null,
            null,
            disabled
          ),
        ]
      : []),
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

  const onClick = (e: any) => setCurrent(e.key);

  const title = (titleText: React.ReactNode) => (
    <Typography.Title ellipsis className="left-nav-title">
      {titleText}
    </Typography.Title>
  );

  const menu = (items: MenuItem[]) => (
    <Menu theme="dark" mode="inline" items={items} selectedKeys={[current]} onClick={onClick} defaultOpenKeys={['4']} />
  );

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      collapsedWidth={55}
      className="custom-scroll"
      style={{
        color: 'rgba(255, 255, 255, 0.65)',
        overflow: 'auto',
        position: 'fixed',
        left: 0,
        top: '46px',
        bottom: 0,
        zIndex: 100,
      }}>
      {collapsed ? null : title('Monitoring')}
      {menu(monitoringItems)}
      {ownerOrAdmin && (
        <>
          {collapsed ? null : title('Connections')}
          {menu(connectionItems)}
          {collapsed ? null : title('Workunits')}
          {menu(workunitItems)}
          {collapsed ? null : title('Admin')}
          {menu(adminItems)}
        </>
      )}
    </Sider>
  );
};

export default LeftNav;
