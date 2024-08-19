import {
  DeleteOutlined,
  ExportOutlined,
  EyeOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  ShareAltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Divider, notification, Popconfirm, Table, Tooltip, Tour } from 'antd';
import download from 'downloadjs';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { applicationActions } from '../../../redux/actions/Application';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { hasAdminRole } from '../../common/AuthUtil.js';
import BreadCrumbs from '../../common/BreadCrumbs';
import { Constants } from '../../common/Constants';
import AddApplication from './AddApplication';
import ShareApp from './ShareApp';
import Text from '../../common/Text';

class Applications extends Component {
  // REFERENCE TO THE FORM INSIDE MODAL
  formRef = React.createRef();

  state = {
    applications: [],
    selectedApplication: null,
    removeDisabled: true,
    showAddApplicationModal: false,
    isCreatingNewApp: false,
    openShareAppDialog: false,
    showTour: false,
    submitted: false,
    appAddButtonRef: React.createRef(),
  };

  componentDidMount() {
    this.getApplications();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.user !== this.props.user || this.state.showAddApplicationModal !== prevState.showAddApplicationModal)
      this.getApplications();
  }

  setApplications(data) {
    this.setState({
      applications: data,
    });
  }

  // GET ALL APPLICATIONS
  getApplications() {
    var url = `/api/app/read/appListByUsername?user_name=${this.props.user.username}`;
    if (hasAdminRole(this.props.user)) url = '/api/app/read/app_list';

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
        this.setApplications(data);

        // SHOW TOUR IF NO APPLICATIONS
        if (!this.props.noApplication.addButtonTourShown && data.length === 0) {
          this.setState({ showTour: true });
          this.props.dispatch(applicationActions.updateApplicationAddButtonTourShown(true));
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // HANDLE SHARE APPLICATION
  handleShareApplication(record) {
    this.setState({ selectedApplication: record, openShareAppDialog: true });
  }

  // REMOVE OR DELETE APPLICATION
  handleRemove = (app_id) => {
    var data = JSON.stringify({ appIdToDelete: app_id, user: this.props.user.username });
    fetch('/api/app/read/deleteApplication', {
      method: 'post',
      headers: authHeader(),
      body: data,
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((_suggestions) => {
        notification.open({
          message: 'Application Removed',
          description: 'The application has been removed.',
          onClick: () => {},
        });
        this.getApplications();

        this.props.dispatch(applicationActions.applicationDeleted(app_id));
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // ADD OR CREATE NEW APPLICATION
  handleAddApplication = () => {
    this.setState({
      showAddApplicationModal: true,
      selectedApplication: null,
      isCreatingNewApp: true,
      showTour: false,
    });
  };

  // CLOSE ADD APPLICATION MODAL
  closeAddApplicationModal = () => this.setState({ showAddApplicationModal: false });

  // EDIT OR VIEW APPLICATION
  handleApplicationEdit = (record) => {
    this.setState({ isCreatingNewApp: false, selectedApplication: record, showAddApplicationModal: true });
  };

  // EXPORT APPLICATION
  handleExportApplication = (id, title) => {
    fetch('/api/app/read/export', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({ id: id }),
    })
      .then((response) => {
        if (response.ok) {
          return response.blob();
        }
        handleError(response);
      })
      .then((blob) => {
        download(blob, title + '-schema.json');
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // WHEN CLOSE ON APP SHARE MODAL IS CLICKED
  handleClose = () => {
    this.setState({
      openShareAppDialog: false,
    });
  };

  // DISPLAY ICON THAT EXPLAINS - IF THE APP WAS SHARED , PUBLIC OR PRIVATE
  renderAppVisibilityIcon = (record) => {
    if (record.visibility === 'Public') {
      return (
        <Tooltip title="Public">
          <GlobalOutlined />
        </Tooltip>
      );
    } else if (record.visibility === 'Private' && record.creator === this.props.user.username) {
      return (
        <Tooltip title="Your Application">
          <UserOutlined />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Shared to you">
          <ShareAltOutlined />
        </Tooltip>
      );
    }
  };

  allowShare = (record) => {
    if (record.visibility !== 'Public' && record.creator === this.props.user.username) return true;
  };

  handleTourClose = () => {
    this.setState({ showTour: false });
  };

  //JSX
  render() {
    const steps = [
      {
        title: 'Add Application',
        description: 'Click here to add an application. After adding an application, we can move on to the next step. ',
        placement: 'bottom',
        arrow: true,
        target: () => this.state.appAddButtonRef?.current,
        nextButtonProps: { style: { display: 'none' }, disabled: true },
      },
    ];
    const applicationColumns = [
      {
        width: '2%',
        title: '',
        render: (record) => this.renderAppVisibilityIcon(record),
      },
      {
        width: '10%',
        title: <Text text="Title" />,
        dataIndex: 'title',
      },
      {
        width: '30%',
        title: <Text text="Description" />,
        dataIndex: 'description',
        className: 'overflow-hidden',
        ellipsis: true,
      },
      {
        width: '8%',
        title: <Text text="Created By" />,
        dataIndex: 'creator',
      },
      {
        width: '10%',
        title: <Text text="Created" />,
        dataIndex: 'createdAt',
        render: (text, _record) => {
          let createdAt = new Date(text);
          return (
            createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
            ' @ ' +
            createdAt.toLocaleTimeString('en-US')
          );
        },
      },
      {
        width: '15%',
        title: 'Action',
        dataIndex: '',
        render: (text, record) => (
          <span>
            <React.Fragment>
              {record.visibility !== 'Public' && record.creator === this.props.user.username ? (
                <>
                  <span onClick={() => this.handleShareApplication(record)}>
                    <Tooltip placement="left" title={<Text text="Share" />}>
                      <ShareAltOutlined />
                    </Tooltip>
                  </span>
                  <Divider type="vertical" />
                </>
              ) : null}

              <span onClick={() => this.handleApplicationEdit(record)}>
                <Tooltip placement="right" title={<Text text="Edit" />}>
                  <EyeOutlined />
                </Tooltip>
              </span>
              <Divider type="vertical" />

              <span onClick={() => this.handleExportApplication(record.id, record.title)}>
                <Tooltip placement="right" title={<Text text="Export" />}>
                  <ExportOutlined />
                </Tooltip>
              </span>
              <Divider type="vertical" />

              {record.creator === this.props.user.username ||
              (record.creator !== this.props.username && record.visibility !== 'Public') ? (
                <>
                  <Popconfirm
                    title={<Text text="Are you sure you want to delete?" />}
                    onConfirm={() => this.handleRemove(record.id)}
                    icon={<QuestionCircleOutlined />}>
                    <span>
                      <Tooltip placement="right" title={<Text text="Delete" />}>
                        <DeleteOutlined />
                      </Tooltip>
                    </span>
                  </Popconfirm>
                </>
              ) : null}
            </React.Fragment>
          </span>
        ),
      },
    ];

    return (
      <React.Fragment>
        <BreadCrumbs
          extraContent={
            <Tooltip placement="bottom" title={'Click to add a new Application'}>
              <Button type="primary" ref={this.state.appAddButtonRef} onClick={() => this.handleAddApplication()}>
                {<Text text="Add Application" />}
              </Button>
            </Tooltip>
          }
        />
        <Tour steps={steps} open={this.state.showTour} onClose={this.handleTourClose}></Tour>

        <div style={{ padding: '15px' }}>
          <Table
            columns={applicationColumns}
            rowKey={(record) => record.id}
            dataSource={this.state.applications}
            pagination={this.state.applications?.length > 10 ? { pageSize: 10 } : false}
          />
        </div>

        {this.state.showAddApplicationModal ? (
          <AddApplication
            closeAddApplicationModal={this.closeAddApplicationModal}
            showAddApplicationModal={this.state.showAddApplicationModal}
            isCreatingNewApp={this.state.isCreatingNewApp}
            selectedApplication={this.state.selectedApplication}
            user={this.props.user}
            applications={this.state.applications}
            setApplications={this.setApplications}
          />
        ) : null}

        <div>
          {this.state.openShareAppDialog ? (
            <ShareApp
              appId={this.state.selectedApplication.id}
              appTitle={this.state.selectedApplication.title}
              user={this.props.user}
              onClose={this.handleClose}
            />
          ) : null}
        </div>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { noApplication } = state.applicationReducer;
  return { user, noApplication };
}
let connectedApp = connect(mapStateToProps)(Applications);
export default connectedApp;
