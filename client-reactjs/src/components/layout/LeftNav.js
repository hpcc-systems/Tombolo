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
  AreaChartOutlined,
} from '@ant-design/icons';

import { hasEditPermission } from '../common/AuthUtil.js';
import Text from '../common/Text';

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

    if (!this.props.loggedIn || !this.props.user || Object.getOwnPropertyNames(this.props.user).length == 0) {
      return null;
    }

    const canEdit = hasEditPermission(this.props.user);

    if (window.location.pathname === '/login') return null;

    return (
      <Sider
        collapsible
        collapsed={this.props.collapsed}
        onCollapse={this.props.onCollapse}
        collapsedWidth={55}
        className="custom-scroll"
        style={{
          backgroundColor: this.props.BG_COLOR,
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
          onClick={this.handleClick}
          defaultSelectedKeys={['1']}
          selectedKeys={[this.state.current]}
          style={{ backgroundColor: this.props.BG_COLOR, maxWidth: '100%', height: '100%' }}>
          <Menu.Item key="1" icon={<i className="fa fa-fw fa-cubes"></i>}>
            <Link to={'/' + applicationId + '/assets'}>{<Text text="Assets" />}</Link>
          </Menu.Item>

          <Menu.Item key="2" icon={<i className="fa fa-fw fa-random" />}>
            <Link to={'/' + applicationId + '/dataflow'}>{<Text text="Definitions" />}</Link>
          </Menu.Item>

          <Menu.Item key="3" icon={<i className="fa fa-fw fa-microchip" />}>
            <Link to={'/' + applicationId + '/dataflowinstances'}>{<Text text="Job Execution" />}</Link>
          </Menu.Item>

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
            <Menu.Item key="4e" icon={<NotificationOutlined />}>
              <Link to={'/' + applicationId + '/notifications'}>{<Text text="Notifications" />}</Link>
            </Menu.Item>
            <Menu.Item key="4d" icon={<ContainerOutlined />}>
              <Link to={'/' + applicationId + '/superfileMonitoring'}>{<Text text="Superfiles" />}</Link>
            </Menu.Item>
          </Menu.SubMenu>

          <Menu.Item key="5" icon={<AreaChartOutlined />}>
            <Link to={'/' + applicationId + '/dashboard'}>{<Text text="Dashboard" />}</Link>
          </Menu.Item>

          {canEdit ? (
            <>
              {this.props.collapsed ? null : (
                <Typography.Title ellipsis={true} className="left-nav-title">
                  {<Text text="Settings" />}
                </Typography.Title>
              )}
              <Menu.Item key="6" icon={<i className="fa fa-fw fa-telegram" />}>
                <Link to={'/' + applicationId + '/actions'}>{<Text text="Actions" />}</Link>
              </Menu.Item>
              <Menu.Item key="7" icon={<ClusterOutlined />}>
                <Link to={'/admin/clusters'}>{<Text text="Clusters" />}</Link>
              </Menu.Item>

              <Menu.Item key="8" icon={<i className="fa fa-fw fa-github" />}>
                <Link to={'/admin/github'}>{<Text text="Github Projects" />}</Link>
              </Menu.Item>

              <Menu.Item key="9" icon={<i className="fa fa-fw fa-user-circle" />}>
                <Link to={'/admin/consumers'}>{<Text text="Collaborator" />}</Link>
              </Menu.Item>
              {this.props.collapsed ? null : (
                <Typography.Title ellipsis={true} className="left-nav-title">
                  {<Text text="Admin" />}
                </Typography.Title>
              )}
              <Menu.Item key="10" icon={<i className="fa fa-fw fa-desktop" />}>
                <Link to={'/admin/applications'}>{<Text text="Applications" />}</Link>
              </Menu.Item>
              <Menu.Item
                key="11"
                icon={this.props.isReportLoading ? <LoadingOutlined /> : <i className="fa fa-fw fa-balance-scale" />}>
                <Link to={'/admin/compliance'}>
                  <Text>Compliance</Text>
                </Link>
              </Menu.Item>
            </>
          ) : null}
        </Menu>
      </Sider>
    );
  }
}

function mapStateToProps(state) {
  const applicationId = state.applicationReducer.application?.applicationId;
  const { loggedIn, user } = state.authenticationReducer;
  const isReportLoading = state.propagation.changes.loading || state.propagation.current.loading;
  return { applicationId, loggedIn, user, isReportLoading };
}

let connectedLeftNav = connect(mapStateToProps, null, null, { forwardRef: true })(withRouter(LeftNav));
export { connectedLeftNav as LeftNav };
