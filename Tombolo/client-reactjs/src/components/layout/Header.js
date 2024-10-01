import { AppstoreOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space, Tooltip } from 'antd';
import { debounce } from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';

import logo from '../../images/logo.png';

import { applicationActions } from '../../redux/actions/Application';
import { assetsActions } from '../../redux/actions/Assets';
import { expandGroups, selectGroup, getGroupsTree } from '../../redux/actions/Groups';
import { authHeader, handleError } from '../common/AuthHeader.js';

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
    isClusterModalVisible: false,
    language: 'EN',
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
      // var url = `/api/app/read/appListByUsername?user_name=${this.props.user.username}`;
      // if (hasAdminRole(this.props.user)) {
      //   url = '/api/app/read/app_list';
      // }
      const url = '/api/app/read/app_list';
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
          }

          if (applications.length === 0) {
            this.props.dispatch(applicationActions.updateNoApplicationFound({ noApplication: true }));
          }
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {});
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
      this.props.dispatch(applicationActions.getLicenses());
      this.props.dispatch(applicationActions.getConstraints());
      this.props.dispatch(applicationActions.getAllActiveIntegrations());
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
    // localStorage.removeItem('user');
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
    // this.props.dispatch(userActions.logout());

    // if (process.env.REACT_APP_APP_AUTH_METHOD === 'azure_ad') {
    //   msalInstance.logoutRedirect();
    // } else {
    //   this.props.history.push('/login');
    //   message.success('You have been successfully logged out. ');
    // }
  };

  handleChange(value) {
    const goToAssetPage = false;

    //value needs to be an object
    if (typeof value === 'object') {
      value = value?.value;
    }

    const applicationId = value;

    //get the display from the applications list
    const applicationTitle = this.state.applications.find((app) => app.value === applicationId)?.display || value;

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

  close = () => {};

  search(value) {
    this.props.history.push('/report/' + value);
  }

  onChangeSearch = (e) => {
    this.setState({ searchText: e.target.value });
  };

  handleCancel = () => {
    this.setState({ visible: false });
  };

  handleUserActionMenuClick = (e) => {
    if (e.key == 1) {
      // go to myaccount page
      window.location.href = '/myaccount';
    } else if (e.key == 2) {
      this.handleLogOut();
    }
  };

  setClusterModalVisible = (visible) => {
    this.setState({
      isClusterModalVisible: visible,
    });
  };

  // Options for languages dropdown

  render() {
    const actionMenuItems = [
      {
        key: '1',
        icon: null,
        label: 'My Account',
        children: null,
        type: null,
      },
      {
        key: '2',
        icon: null,
        label: 'Logout',
        children: null,
        type: null,
      },
    ];

    // if (!this.props.user || !this.props.user.token) {
    //   return null;
    // }
    const menuItems = this.state.applications.map((app) => {
      return { key: app.value, label: app.display };
    });

    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', maxHeight: '100%', justifyContent: 'space-between' }}>
          <div>
            <Link to={'/'} style={{ marginRight: '70px' }}>
              <img src={logo} alt="Tombolo logo" width="80px" height="19px" />
            </Link>

            <Dropdown
              menu={{
                items: menuItems,
                onClick: (e) => {
                  this.handleChange(e.key);
                },
              }}
              placement="bottom"
              trigger={['click']}>
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
            <Dropdown
              menu={{ items: actionMenuItems, onClick: (e) => this.handleUserActionMenuClick(e) }}
              trigger={['click']}>
              <Button shape="round">
                <i className="fa fa-lg fa-user-circle"></i>
                <span style={{ paddingLeft: '5px' }}>
                  {this.props.user.firstName + ' ' + this.props.user.lastName} <DownOutlined />
                </span>
              </Button>
            </Dropdown>
          </div>
        </div>
      </>
    );
  }
}

function mapStateToProps(state) {
  // const { loggingIn, user } = state.authenticationReducer;
  const user = { firstName: 'John', lastName: 'Doe' };
  const { application, clusters, newApplication, updatedApplication, deletedApplicationId, noClusters } =
    state.applicationReducer;

  return {
    clusters,
    noClusters,
    application,
    newApplication,
    updatedApplication,
    user,
    deletedApplicationId,
  };
}

//export default withRouter(AppHeader);
let connectedAppHeader = connect(mapStateToProps)(withRouter(AppHeader));
export { connectedAppHeader as AppHeader };
