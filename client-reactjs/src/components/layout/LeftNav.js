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

  handleClick = ({ key, _item, _keyPath, _domEvent }) => {
    this.setState({ current: key });
  };

  render() {
    const applicationId = this.props?.applicationId || '';
    const integrations = this.props?.integrations || [];

    const asrActive = integrations.find((i) => i.name === 'ASR')?.active;

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
          <span style={{ marginLeft: '.5rem', color: 'rgba(255, 255, 255, 0.65)' }}>Assets</span>
        </Link>,

        '1',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/' + applicationId + '/dataflow'}>
          <i className="fa fa-fw fa-random" />
          <span style={{ marginLeft: '.5rem' }}>Definitions</span>
        </Link>,

        '2',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/' + applicationId + '/dataflowinstances'}>
          <i className="fa fa-fw fa-microchip" />
          <span style={{ marginLeft: '.5rem' }}>Job Execution</span>
        </Link>,

        '3',
        null
      ),
      getItem(
        <>
          <DashboardOutlined />
          <span style={{ marginLeft: '.5rem' }}>Monitoring</span>
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
          <span style={{ marginLeft: '.5rem' }}>Dashboard</span>
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
          <span style={{ marginLeft: '.5rem' }}>Clusters</span>
        </Link>,
        '6',
        null
      ),
      getItem(
        <>
          <BellOutlined />
          <span style={{ marginLeft: '.5rem' }}>Notifications</span>
        </>,
        '7',
        null,
        [
          getItem(
            <Link to={'/' + applicationId + '/admin/notification-settings/msTeams'}>
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
          <span style={{ marginLeft: '.5rem' }}>Github</span>
        </Link>,
        '8',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/consumers'}>
          <i className="fa fa-fw fa-user-circle" />
          <span style={{ marginLeft: '.5rem' }}>Collaborator</span>
        </Link>,
        '9',
        null
      ),
    ];

    const adminItems = [
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/applications'}>
          <i className="fa fa-fw fa-desktop" />
          <span style={{ marginLeft: '.5rem' }}>Applications</span>
        </Link>,
        '10',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/integrations'}>
          <ApiOutlined />
          <span style={{ marginLeft: '.5rem' }}>Integrations</span>
        </Link>,
        '11',
        null
      ),
      getItem(
        <Link style={{ color: 'rgba(255, 255, 255, 0.65)' }} to={'/admin/compliance'}>
          {this.props.isReportLoading ? <LoadingOutlined /> : <i className="fa fa-fw fa-balance-scale" />}
          <span style={{ marginLeft: '.5rem' }}>Compliance</span>
        </Link>,
        '12',
        null
      ),
    ];

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
        <Menu
          theme="dark"
          mode="inline"
          items={items}
          selectedKeys={[this.state.current]}
          defaultSelectedKeys={['1']}
        />

        {canEdit && this.props.collapsed ? null : (
          <Typography.Title ellipsis={true} className="left-nav-title">
            {<Text text="Settings" />}
          </Typography.Title>
        )}

        {canEdit ? <Menu theme="dark" mode="inline" items={settingItems} selectedKeys={[this.state.current]} /> : null}

        {canEdit && this.props.collapsed ? null : (
          <Typography.Title ellipsis={true} className="left-nav-title">
            {<Text text="Admin" />}
          </Typography.Title>
        )}

        {canEdit ? <Menu theme="dark" mode="inline" items={adminItems} selectedKeys={[this.state.current]} /> : null}

        <Menu
          theme="dark"
          mode="inline"
          onClick={this.handleClick}
          defaultSelectedKeys={['1']}
          selectedKeys={[this.state.current]}
          style={{ backgroundColor: this.props.BG_COLOR, maxWidth: '100%', height: '100%' }}>
          {/* <Menu.Item key="1" icon={<i className="fa fa-fw fa-cubes"></i>}>
            <Link to={'/' + applicationId + '/assets'}>{<Text text="Assets" />}</Link>
          </Menu.Item>

          <Menu.Item key="2" icon={<i className="fa fa-fw fa-random" />}>
            <Link to={'/' + applicationId + '/dataflow'}>{<Text text="Definitions" />}</Link>
          </Menu.Item>

          <Menu.Item key="3" icon={<i className="fa fa-fw fa-microchip" />}>
            <Link to={'/' + applicationId + '/dataflowinstances'}>{<Text text="Job Execution" />}</Link>
          </Menu.Item> */}
          {/* 
          <Menu.SubMenu title="Monitoring" icon={<DashboardOutlined />} key="4">
            <Menu.Item key="4a" icon={<FileSearchOutlined />}>
              <Link to={'/' + applicationId + '/fileMonitoring'}>{<Text text="File" />}</Link>
            </Menu.Item>
            <Menu.Item key="4b" icon={<ClusterOutlined />}>
              <Link to={'/' + applicationId + '/clustermonitoring'}>{<Text text="Cluster" />}</Link>
            </Menu.Item>
            <Menu.Item key="4c" icon={<ClockCircleOutlined />}>
              <Link to={'/' + applicationId + '/jobmonitoring'}>{<Text text="Job" />}</Link>
            </Menu.Item>

            <Menu.Item key="4d" icon={<ContainerOutlined />}>
              <Link to={'/' + applicationId + '/superfileMonitoring'}>{<Text text="Superfiles" />}</Link>
            </Menu.Item>

            {asrActive ? (
              <Menu.Item key="4e" icon={<CloudServerOutlined />}>
                <Link to={'/' + applicationId + '/orbitMonitoring'}>{<Text text="Orbit" />}</Link>
              </Menu.Item>
            ) : null}
          </Menu.SubMenu> */}

          {/* <Menu.SubMenu title="Dashboard" icon={<BarChartOutlined />} key="5">
            <Menu.Item key="5a" icon={<NotificationOutlined />}>
              <Link to={'/' + applicationId + '/dashboard/notifications'}>{<Text text="Notifications" />}</Link>
            </Menu.Item>
            <Menu.Item key="5b" icon={<ClusterOutlined />}>
              <Link to={'/' + applicationId + '/dashboard/clusterUsage'}>{<Text text="Cluster" />}</Link>
            </Menu.Item>

            {asrActive ? (
              <Menu.Item key="5c" icon={<CloudServerOutlined />}>
                <Link to={'/' + applicationId + '/dashboard/Orbit'}>{<Text text="Orbit" />}</Link>
              </Menu.Item>
            ) : null}
          </Menu.SubMenu> */}

          {canEdit ? (
            <>
              {/* {this.props.collapsed ? null : (
                <Typography.Title ellipsis={true} className="left-nav-title">
                  {<Text text="Settings" />}
                </Typography.Title>
              )} */}
              {/* <Menu.Item key="6" icon={<i className="fa fa-fw fa-telegram" />}>
                <Link to={'/' + applicationId + '/actions'}>{<Text text="Actions" />}</Link>
              </Menu.Item> */}
              {/* <Menu.Item key="6" icon={<ClusterOutlined />}>
                <Link to={'/admin/clusters'}>{<Text text="Clusters" />}</Link>
              </Menu.Item> */}
              {/* <Menu.SubMenu key="7" icon={<BellOutlined />} title={<Text text="Notifications" />}>
                <Menu.Item key="7a" icon={<i className="fa fa-windows" />}>
                  <Link to={'/admin/notification-settings/msTeams'}>{<Text text="MsTeams" />}</Link>
                </Menu.Item>
              </Menu.SubMenu> */}
              {/* 
              <Menu.Item key="8" icon={<i className="fa fa-fw fa-github" />}>
                <Link to={'/admin/github'}>{<Text text="Github Projects" />}</Link>
              </Menu.Item> */}
              {/* 
              <Menu.Item key="9" icon={<i className="fa fa-fw fa-user-circle" />}>
                <Link to={'/admin/consumers'}>{<Text text="Collaborator" />}</Link>
              </Menu.Item> */}
              {/* {this.props.collapsed ? null : (
                <Typography.Title ellipsis={true} className="left-nav-title">
                  {<Text text="Admin" />}
                </Typography.Title>
              )} */}
              {/* <Menu.Item key="10" icon={<i className="fa fa-fw fa-desktop" />}>
                <Link to={'/admin/applications'}>{<Text text="Applications" />}</Link>
              </Menu.Item>
              <Menu.Item key="11" icon={<ApiOutlined />}>
                <Link to={'/admin/integrations'}>{<Text text="Integrations" />}</Link>
              </Menu.Item>
              <Menu.Item
                key="12"
                icon={this.props.isReportLoading ? <LoadingOutlined /> : <i className="fa fa-fw fa-balance-scale" />}>
                <Link to={'/admin/compliance'}>
                  <Text>Compliance</Text>
                </Link>
              </Menu.Item> */}
            </>
          ) : null}
        </Menu>
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
