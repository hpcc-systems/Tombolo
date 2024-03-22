import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { Layout, Menu, Typography } from 'antd';
import {
  LoadingOutlined,
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
} from '@ant-design/icons';

import { hasEditPermission } from '../common/AuthUtil.js';
import Text from '../common/Text';
function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

const { Sider } = Layout;

class LeftNav extends Component {
  state = {
    current: '1',
  };

  componentDidUpdate(prevProps) {
    const applicationId = this.props?.applicationId;
    const prevApplicationId = prevProps?.applicationId;
    if (applicationId !== prevApplicationId) {
      // if current app and prev app is not same we are redirected to /appid/asset page, so we will reset menu highlight
      this.setState({ current: '1' });
    }
  }

  componentDidMount() {
    const options = {
      dataflow: '2',
      dataflowinstances: '3',
      actions: '4',
      clusters: '5',
      github: '6',
      consumers: '7',
      applications: '8',
    };

    // on init we check pathname if it contains options key in name, if it does => highlight that menu item
    for (const key in options) {
      let path = this.props.history.location.pathname;
      if (path.includes(key)) {
        this.setState({ current: options[key] });
      }
    }
  }

  render() {
    const applicationId = this.props?.applicationId || '';
    const integrations = this.props?.integrations || [];

    const asrActive = integrations.some((i) => i.name === 'ASR' && i.application_id === applicationId);

    if (!this.props.loggedIn || !this.props.user || Object.getOwnPropertyNames(this.props.user).length == 0) {
      return null;
    }

    const canEdit = hasEditPermission(this.props.user);

    if (window.location.pathname === '/login') return null;

    //get item structure
    //label, key, icon, children, type;

    const items = [
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/' + applicationId + '/assets'}>
          <i className="fa fa-fw fa-cubes" />
          <span style={{ marginLeft: '1rem', color: 'rgba(255, 255, 255, 0.65)' }}>Assets</span>
        </Link>,

        '1',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/' + applicationId + '/dataflow'}>
          <i className="fa fa-fw fa-random" />
          <span style={{ marginLeft: '1rem' }}>Definitions</span>
        </Link>,

        '2',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/' + applicationId + '/dataflowinstances'}>
          <i className="fa fa-fw fa-microchip" />
          <span style={{ marginLeft: '1rem' }}>Job Execution</span>
        </Link>,

        '3',
        null
      ),
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
            null
          ),
          getItem(
            <Link to={'/' + applicationId + '/clustermonitoring'}>
              <span>
                <ClusterOutlined /> Cluster
              </span>
            </Link>,
            '4b',
            null,
            null
          ),
          getItem(
            <Link to={'/' + applicationId + '/jobmonitoring'}>
              <span>
                <ClockCircleOutlined /> Job
              </span>
            </Link>,
            '4c',
            null,
            null
          ),
          getItem(
            <Link to={'/' + applicationId + '/superfileMonitoring'}>
              <span>
                <ContainerOutlined /> Superfiles
              </span>
            </Link>,
            '4d',
            null,
            null
          ),
          asrActive
            ? getItem(
                <Link to={'/' + applicationId + '/orbitMonitoring'}>
                  <span>
                    <CloudServerOutlined /> Orbit
                  </span>
                </Link>,
                '4e',
                null,
                null
              )
            : null,
        ]
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
        ]
      ),
    ];

    const settingItems = [
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/clusters'}>
          <ClusterOutlined />
          <span style={{ marginLeft: '1rem' }}>Clusters</span>
        </Link>,
        '6',
        null
      ),
      getItem(
        <>
          <BellOutlined />
          <span style={{ marginLeft: '1rem' }}>Notifications</span>
        </>,
        '7',
        null,
        [
          getItem(
            <Link to={'/admin/notification-settings/msTeams'}>
              <span>
                <i className="fa fa-windows" /> MS Teams
              </span>
            </Link>,
            '7a',
            null,
            null
          ),
        ]
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/github'}>
          <i className="fa fa-fw fa-github" />
          <span style={{ marginLeft: '1rem' }}>Github</span>
        </Link>,
        '8',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/consumers'}>
          <i className="fa fa-fw fa-user-circle" />
          <span style={{ marginLeft: '1rem' }}>Collaborator</span>
        </Link>,
        '9',
        null
      ),
    ];

    const adminItems = [
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/applications'}>
          <i className="fa fa-fw fa-desktop" />
          <span style={{ marginLeft: '1rem' }}>Applications</span>
        </Link>,
        '10',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/integrations'}>
          <ApiOutlined />
          <span style={{ marginLeft: '1rem' }}>Integrations</span>
        </Link>,
        '11',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/compliance'}>
          {this.props.isReportLoading ? <LoadingOutlined /> : <i className="fa fa-fw fa-balance-scale" />}
          <span style={{ marginLeft: '1rem' }}>Compliance</span>
        </Link>,
        '12',
        null
      ),
    ];

    const onClick = (e) => {
      this.setState({ current: e.key });
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
        <Menu theme="dark" mode="inline" items={items} selectedKeys={[this.state.current]} onClick={onClick} />

        {canEdit && this.props.collapsed ? null : (
          <Typography.Title ellipsis={true} className="left-nav-title">
            {<Text text="Settings" />}
          </Typography.Title>
        )}

        {canEdit ? (
          <Menu theme="dark" mode="inline" items={settingItems} selectedKeys={[this.state.current]} onClick={onClick} />
        ) : null}

        {canEdit && this.props.collapsed ? null : (
          <Typography.Title ellipsis={true} className="left-nav-title">
            {<Text text="Admin" />}
          </Typography.Title>
        )}

        {canEdit ? (
          <Menu theme="dark" mode="inline" items={adminItems} selectedKeys={[this.state.current]} onClick={onClick} />
        ) : null}
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
