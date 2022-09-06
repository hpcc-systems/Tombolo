import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { Layout, Menu, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import { hasEditPermission } from '../common/AuthUtil.js';

const { Sider } = Layout;

class LeftNav extends Component {
  state = {
    current: '1',
  };

  componentDidUpdate(prevProps) {
    const applicationId = this.props?.applicationId;
    const prevApplicationId = prevProps?.applicationId;
    if (applicationId && prevApplicationId) {
      if (applicationId !== prevApplicationId) {
        // if current app and prev app is not same we are redirected to /appid/asset page, so we will reset menu highlight
        this.setState({ current: '1' });
      }
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
    const { t } = this.props; // translate func
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
            <Link to={'/' + applicationId + '/assets'}>{t('Assets', { ns: 'common' })}</Link>
          </Menu.Item>

          <Menu.Item key="2" icon={<i className="fa fa-fw fa-random" />}>
            <Link to={'/' + applicationId + '/dataflow'}>{t('Definitions', { ns: 'common' })}</Link>
          </Menu.Item>

          <Menu.Item key="3" icon={<i className="fa fa-fw fa-microchip" />}>
            <Link to={'/' + applicationId + '/dataflowinstances'}>{t('Job Execution', { ns: 'common' })}</Link>
          </Menu.Item>

          {canEdit ? (
            <>
              {this.props.collapsed ? null : (
                <Typography.Title ellipsis={true} className="left-nav-title">
                  {t('Settings', { ns: 'common' })}
                </Typography.Title>
              )}
              <Menu.Item key="4" icon={<i className="fa fa-fw fa-telegram" />}>
                <Link to={'/' + applicationId + '/actions'}>{t('Actions', { ns: 'common' })}</Link>
              </Menu.Item>
              <Menu.Item key="5" icon={<i className="fa fa-fw fa-server" />}>
                <Link to={'/admin/clusters'}>{t('Clusters', { ns: 'common' })}</Link>
              </Menu.Item>

              <Menu.Item key="6" icon={<i className="fa fa-fw fa-github" />}>
                <Link to={'/admin/github'}>{t('Github Projects', { ns: 'common' })}</Link>
              </Menu.Item>

              <Menu.Item key="7" icon={<i className="fa fa-fw fa-user-circle" />}>
                <Link to={'/admin/consumers'}>{t('Collaborator', { ns: 'common' })}</Link>
              </Menu.Item>
              {this.props.collapsed ? null : (
                <Typography.Title ellipsis={true} className="left-nav-title">
                  {t('Admin', { ns: 'common' })}
                </Typography.Title>
              )}
              <Menu.Item key="8" icon={<i className="fa fa-fw fa-desktop" />}>
                <Link to={'/admin/applications'}>{t('Applications', { ns: 'common' })}</Link>
              </Menu.Item>
              <Menu.Item
                key="9"
                icon={
                  this.props.propagation.loading ? <LoadingOutlined /> : <i className="fa fa-fw fa-balance-scale" />
                }>
                <Link to={'/admin/constraints'}>Compliance</Link>
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
  return { applicationId, loggedIn, user, propagation: state.propagation };
}

let connectedLeftNav = connect(mapStateToProps, null, null, { forwardRef: true })(withRouter(LeftNav));
connectedLeftNav = withTranslation(['common'])(connectedLeftNav); // uses nav namespace for translation
export { connectedLeftNav as LeftNav };
