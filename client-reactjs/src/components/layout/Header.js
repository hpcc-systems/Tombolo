import { AppstoreOutlined, DownOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Dropdown, Form, Input, Menu, message, Modal, notification, Space, Tooltip } from 'antd';
import { debounce } from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import logo from '../../images/logo.png';
import { msalInstance } from '../../index';
import { applicationActions } from '../../redux/actions/Application';
import { assetsActions } from '../../redux/actions/Assets';
import { expandGroups, selectGroup, getGroupsTree } from '../../redux/actions/Groups';
import { userActions } from '../../redux/actions/User';
import { authHeader, handleError } from '../common/AuthHeader.js';
import { hasAdminRole } from '../common/AuthUtil.js';

class AppHeader extends Component {
  pwdformRef = React.createRef();

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.search = this.search.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
  }

  state = {
    applications: [],
    selected: 'Select an Application',
    pathName: '',
    searchText: '',
    visible: false,
    loading: false,
    oldpassword: '',
    newpassword: '',
    confirmnewpassword: '',
    isAboutModalVisible: false,
  };

  handleRef() {
    const projectId = localStorage.getItem('activeProjectId');
    const application = this.state.applications?.find((app) => app.value === projectId);
    //if no activeProjectId select the first application by default.
    if (!application && this.state.applications.length > 0) {
      this.setState({ selected: this.state.applications[0].display });
      this.props.dispatch(
        applicationActions.applicationSelected(this.state.applications[0].value, this.state.applications[0].display)
      );
      localStorage.setItem('activeProjectId', this.state.applications[0].value);
    } else {
      if (application) {
        this.handleChange({ ...application });
      }
    }
  }

  debouncedHandleRef = debounce(() => {
    this.handleRef();
  }, 100);

  // eslint-disable-next-line react/no-deprecated
  componentWillReceiveProps(props) {
    if (props.application && props.application.applicationTitle !== '') {
      this.setState((prev) => {
        const currentAppId = props.application.applicationId;
        if (currentAppId) {
          let appList = prev.applications;
          // when user adds new app he will change state in redux by selecting that app, we will check if that app exists in our list, is now we will add it.
          const app = appList.find((app) => app.value === currentAppId);
          if (!app)
            appList = [
              ...appList,
              { value: props.application.applicationId, display: props.application.applicationTitle },
            ];
          return { selected: props.application.applicationTitle, applications: appList };
        }
        return { selected: props.application.applicationTitle };
      });
    }
  }
  componentDidMount() {
    if (this.props.location.pathname.includes('manualJobDetails')) {
      return;
    }
    if (this.props.location.pathname.includes('report/')) {
      const pathSnippets = this.props.location.pathname.split('/');
      this.setState({
        searchText: pathSnippets[2],
      });
    }

    if (this.state.applications.length === 0) {
      var url = `/api/app/read/appListByUsername?user_name=${this.props.user.username}`;
      if (hasAdminRole(this.props.user)) {
        url = '/api/app/read/app_list';
      }
      fetch(url, {
        headers: authHeader(),
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then((data) => {
          let applications = data.map((application) => {
            return { value: application.id, display: application.title };
          });
          if (applications && applications.length > 0) {
            this.setState({ applications });
            //this.handleRef();
            this.debouncedHandleRef();
          } else {
            this.openHelpNotification();
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  componentDidUpdate(prevProps, _prevState) {
    if (
      this.props.application?.applicationId &&
      !prevProps.application?.applicationId &&
      this.props.clusters.length === 0
    ) {
      this.props.dispatch(applicationActions.getClusters());
      this.props.dispatch(applicationActions.getConsumers());
    }

    if (this.props.newApplication) {
      let applications = this.state.applications;
      let isNewApplicationInList =
        applications.filter((application) => application.value == this.props.newApplication.applicationId).length > 0;
      if (!isNewApplicationInList) {
        applications.push({
          value: this.props.newApplication.applicationId,
          display: this.props.newApplication.applicationTitle,
        });
        this.setState({ applications });
      }
    }
    if (this.props.updatedApplication) {
      let applications = this.state.applications;
      let application = applications.filter(
        (application) =>
          application.value == this.props.updatedApplication.applicationId &&
          application.display != this.props.updatedApplication.applicationTitle
      );
      if (application.length > 0) {
        applications = applications.map((application) => {
          if (application.value == this.props.updatedApplication.applicationId) {
            application.display = this.props.updatedApplication.applicationTitle;
          }
          return application;
        });
        this.setState({ applications });
      }
    }

    if (this.props.deletedApplicationId) {
      let applications = this.state.applications;
      let application = applications.filter((application) => application.value == this.props.deletedApplicationId);
      if (application.length > 0) {
        applications = applications.filter((application) => application.value != this.props.deletedApplicationId);
        this.setState({ applications });
      }
    }
  }

  handleLogOut = (_e) => {
    localStorage.removeItem('user');
    this.setState({
      applicationId: '',
      selected: 'Select an Application',
    });
    this.props.dispatch(applicationActions.applicationSelected('', ''));
    //reset the group heiracrhy selection
    this.props.dispatch(expandGroups(['0-0']));
    this.props.dispatch(selectGroup({ id: '', key: '0-0' }));
    //reset cluster selectiong
    this.props.dispatch(assetsActions.clusterSelected(''));
    this.props.dispatch(userActions.logout());

    if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') {
      msalInstance.logoutRedirect();
    } else {
      this.props.history.push('/login');
      message.success('You have been successfully logged out. ');
    }
  };

  handleChange({ value, display, goToAssetPage = false }) {
    const applicationId = value;
    const applicationTitle = display;
    // trigger change when app is not same as current app, ignore if user selects same app
    if (this.props.application?.applicationId !== applicationId) {
      this.props.dispatch(applicationActions.applicationSelected(applicationId, applicationTitle));
      localStorage.setItem('activeProjectId', applicationId);
      this.setState({ selected: applicationTitle });
      // this flag is passed when user selects from dropdown, by default we will not redirect and refetch.
      if (goToAssetPage) {
        this.props.dispatch(getGroupsTree(applicationId));
        this.props.history.replace(`/${applicationId}/assets`);
      }
    }
  }

  openHelpNotification = () => {
    const key = `open${Date.now()}`;
    notification.open({
      message: 'Hello',
      description:
        'Welcome ' +
        this.props.user.firstName +
        ' ' +
        this.props.user.lastName +
        '. Please make sure you check out the User Guide under Help option.',
      key,
      onClose: this.close(),
      icon: <QuestionCircleOutlined />,
      top: 70,
    });
  };

  close = () => {
    console.log('Notification was closed. Either the close button was clicked or duration time elapsed.');
  };

  search(value) {
    this.props.history.push('/report/' + value);
  }

  onChangeSearch = (e) => {
    this.setState({ searchText: e.target.value });
  };

  handleChangePassword = () => {
    this.setState({ visible: true });
  };

  handleOk = async () => {
    let _self = this;
    await this.pwdformRef.current.validateFields();

    this.setState({ loading: true });
    fetch('/api/user/changePassword', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({
        username: this.props.user.username,
        oldpassword: this.state.oldpassword,
        newpassword: this.state.newpassword,
        confirmnewpassword: this.state.confirmnewpassword,
      }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .then((_response) => {
        _self.clearChangePasswordDlg();
        message.config({ top: 130 });
        message.success('Password changed successfully.');
        _self.setState({ loading: false, visible: false });
      })
      .catch(function (_err) {
        _self.clearChangePasswordDlg();
        _self.setState({ loading: false, visible: false });
        message.config({ top: 130 });
        message.error('There was an error while changing the password.');
      });
  };

  handleCancel = () => {
    this.setState({ visible: false });
  };

  handleUserActionMenuClick = (e) => {
    if (e.key == 1) {
      this.handleChangePassword();
    } else if (e.key == 2) {
      this.handleLogOut();
    }
  };

  handleChangePasswordFieldChange = (e) => {
    this.setState({ ...this.state, [e.target.name]: e.target.value });
  };

  clearChangePasswordDlg = () => {
    this.setState({
      oldpassword: '',
      newpassword: '',
      confirmnewpassword: '',
    });
    this.pwdformRef.current.setFieldsValue({
      oldpassword: '',
      newpassword: '',
      confirmnewpassword: '',
    });
  };

  handleAboutClose = () => {
    this.setState({
      isAboutModalVisible: false,
    });
  };

  openAboutModal = () => {
    this.setState({
      isAboutModalVisible: true,
    });
  };

  render() {
    const userActionMenu = (
      <Menu onClick={this.handleUserActionMenuClick}>
        <Menu.Item key="1">Change Password</Menu.Item>
        <Menu.Item key="2">Logout</Menu.Item>
      </Menu>
    );
    const helpMenu = (
      <Menu>
        <Menu.Item key="1">
          <a target="_blank" rel="noopener noreferrer" href={process.env.PUBLIC_URL + '/Tombolo-User-Guide.pdf'}>
            User Guide
          </a>
        </Menu.Item>
        <Menu.Item key="2">
          <a onClick={this.openAboutModal}>About</a>
        </Menu.Item>
      </Menu>
    );

    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 9 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 12 },
      },
    };

    if (!this.props.user || !this.props.user.token) {
      return null;
    }

    const menu = (
      <Menu>
        {this.state.applications.map((app, index) => {
          return (
            <Menu.Item key={index} onClick={() => this.handleChange({ ...app, goToAssetPage: true })}>
              {app.display}
            </Menu.Item>
          );
        })}
      </Menu>
    );

    return (
      <div style={{ display: 'flex', alignItems: 'center', maxHeight: '100%', justifyContent: 'space-between' }}>
        <div>
          <Link to={'/'} style={{ marginRight: '70px' }}>
            <img src={logo} alt="Tombolo logo" />
          </Link>

          <Dropdown overlay={menu} placement="bottom" trigger={['click']}>
            <Tooltip title="Select an Application" placement="right">
              <Space
                style={{
                  color: 'white',
                  border: '1px solid white',
                  cursor: 'pointer',
                  padding: '0 4px',
                  borderRadius: '3px',
                  maxHeight: '32px',
                  minWidth: '200px',
                }}>
                <AppstoreOutlined />
                <span> {this.state.selected}</span>
              </Space>
            </Tooltip>
          </Dropdown>
        </div>

        <div>
          <Dropdown overlay={helpMenu} trigger={['click']}>
            <Button shape="round" style={{ marginRight: '10px' }}>
              <i className="fa fa-lg fa-question-circle"></i>
              <span style={{ paddingLeft: '5px' }}>
                Help <DownOutlined />
              </span>
            </Button>
          </Dropdown>

          <Dropdown overlay={userActionMenu} trigger={['click']}>
            <Button shape="round">
              <i className="fa fa-lg fa-user-circle"></i>
              <span style={{ paddingLeft: '5px' }}>
                {this.props.user.firstName + ' ' + this.props.user.lastName} <DownOutlined />
              </span>
            </Button>
          </Dropdown>
        </div>

        <Modal
          title="Change Password"
          visible={this.state.visible}
          width="520px"
          footer={[
            <Button key="cancel" onClick={this.handleCancel}>
              Cancel
            </Button>,
            <Button key="submit" onClick={this.handleOk} type="primary" loading={this.state.loading}>
              Change Password
            </Button>,
          ]}>
          <Form ref={this.pwdformRef}>
            <Form.Item
              {...formItemLayout}
              name="oldpassword"
              label="Password"
              rules={[{ required: true, message: 'Please enter the current password!' }]}>
              <Input
                type="password"
                name="oldpassword"
                placeholder="Password"
                onChange={this.handleChangePasswordFieldChange}
              />
            </Form.Item>

            <Form.Item
              {...formItemLayout}
              name="newpassword"
              label="New Password"
              rules={[{ required: true, message: 'Please enter the new password!' }]}>
              <Input
                type="password"
                name="newpassword"
                placeholder="New Password"
                onChange={this.handleChangePasswordFieldChange}
              />
            </Form.Item>

            <Form.Item
              {...formItemLayout}
              name="confirmnewpassword"
              label="Confirm Password"
              rules={[{ required: true, message: 'Please confirm the new password!' }]}>
              <Input
                type="password"
                name="confirmnewpassword"
                placeholder="Confirm Password"
                onChange={this.handleChangePasswordFieldChange}
              />
            </Form.Item>
          </Form>
        </Modal>
        <Modal
          title="Tombolo"
          visible={this.state.isAboutModalVisible}
          footer={[
            <Button key="close" onClick={this.handleAboutClose}>
              Close
            </Button>,
          ]}>
          <p className="float-left font-weight-bold">Tombolo v{process.env.REACT_APP_VERSION}</p>
        </Modal>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const { loggingIn, user } = state.authenticationReducer;
  const { application, clusters, newApplication, updatedApplication, deletedApplicationId } = state.applicationReducer;
  return { loggingIn, user, clusters, application, newApplication, updatedApplication, deletedApplicationId };
}

//export default withRouter(AppHeader);
const connectedAppHeader = connect(mapStateToProps)(withRouter(AppHeader));
export { connectedAppHeader as AppHeader };
