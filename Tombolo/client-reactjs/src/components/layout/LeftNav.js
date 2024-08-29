import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
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

import { hasEditPermission } from '../common/AuthUtil.js';

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

class LeftNav extends Component {
  state = {
    current: '0',
  };

  componentDidMount() {
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
      let path = this.props.history.location.pathname;
      if (path.includes(key)) {
        this.setState({ current: options[key] });
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
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
        let path = this.props.history.location.pathname;
        if (path.includes(key)) {
          this.setState({ current: options[key] });
        }
      }
    }
  }

  render() {
    const applicationId = this.props?.applicationId || '';
    const integrations = this.props?.integrations || [];
    const disabled = applicationId === '' ? true : false;
    const clusterDisabled = this.props?.clusters?.length === 0 ? true : false;

    const asrActive = integrations.some((i) => i.name === 'ASR' && i.application_id === applicationId);

    if (!this.props.loggedIn || !this.props.user || Object.getOwnPropertyNames(this.props.user).length == 0) {
      return null;
    }

    const canEdit = hasEditPermission(this.props.user);

    if (window.location.pathname === '/login') return null;

    //get item structure
    //label, key, icon, children, type;

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
            <span ref={this.props.clusterLinkRef}>
              <ClusterOutlined />
              <span style={{ marginLeft: '1rem' }}>Clusters</span>
            </span>
          ) : (
            <Link ref={this.props.clusterLinkRef} style={{ color: 'rgba(255, 255, 255, .65)' }} to={'/admin/clusters'}>
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
          )}{' '}
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
        <Link ref={this.props.appLinkRef} style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/applications'}>
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
        '11',
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
        '12',
        null,
        [
          getItem(
            <Link to={'/admin/notification-settings/msTeams'}>
              <span>
                <i className="fa fa-windows" /> MS Teams
              </span>
            </Link>,
            '12a',
            null,
            null
          ),
        ],
        null,
        clusterDisabled
      ),
      //TODO: Uncomment when compliance is ready
      // getItem(
      //   <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/compliance'}>
      //     {this.props.isReportLoading ? <LoadingOutlined /> : <i className="fa fa-fw fa-balance-scale" />}
      //     <span style={{ marginLeft: '1rem' }}>Compliance</span>
      //   </Link>,
      //   '12',
      //   null
      // ),
    ];

    const onClick = (e) => {
      this.setState({ current: e.key });
    };

    const title = (title) => {
      return (
        <Typography.Title ellipsis={true} className="left-nav-title">
          {title}
        </Typography.Title>
      );
    };

    const menu = (items) => {
      return <Menu theme="dark" mode="inline" items={items} selectedKeys={[this.state.current]} onClick={onClick} />;
    };

    return (
      <Sider
        collapsible
        collapsed={this.props.collapsed}
        onCollapse={this.props.onCollapse}
        collapsedWidth={55}
        className="custom-scroll"
        style={{
          backgroundColor: this.props.BG_COLOR,
          color: 'rgba(255, 255, 255, 0.65)',
          marginTop: '46px',
          overflow: 'auto',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}>
        {this.props.collapsed ? null : title('Workflows')}
        {menu(workflowItems)}
        {this.props.collapsed ? null : title('Monitoring')}
        {menu(monitoringItems)}
        {canEdit && this.props.collapsed ? null : title('Connections')}
        {menu(connectionItems)}
        {canEdit && this.props.collapsed ? null : title('Admin')}
        {canEdit && menu(adminItems)}
      </Sider>
    );
  }
}

function mapStateToProps(state) {
  const integrations = state.applicationReducer.integrations;
  const applicationId = state.applicationReducer.application?.applicationId;
  const { loggedIn, user } = state.authenticationReducer;
  const isReportLoading = state.propagation.changes.loading || state.propagation.current.loading;
  return { applicationId, integrations, loggedIn, user, isReportLoading };
}

let connectedLeftNav = connect(mapStateToProps, null, null, { forwardRef: true })(withRouter(LeftNav));
export { connectedLeftNav as LeftNav };
