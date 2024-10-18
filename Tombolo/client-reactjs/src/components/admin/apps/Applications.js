import { Button, Divider, notification, Popconfirm, Table, Tooltip, Tour } from 'antd';
import download from 'downloadjs';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { applicationActions } from '../../../redux/actions/Application';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import BreadCrumbs from '../../common/BreadCrumbs';
import { Constants } from '../../common/Constants';
import AddApplication from './AddApplication';
import ShareApp from './ShareApp';
import Text from '../../common/Text';

import {
  DeleteOutlined,
  ExportOutlined,
  EyeOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';

const Applications = () => {
  //Redux tools
  const user = JSON.parse(localStorage.getItem('user'));
  const applicationReducer = useSelector((state) => state.applicationReducer);
  const { application, applications, noApplication } = useSelector((state) => state.applicationReducer);
  const dispatch = useDispatch();

  //states and refs
  const appAddButtonRef = useRef();

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [isCreatingNewApp, setIsCreatingNewApp] = useState(false);
  const [openShareAppDialog, setOpenShareAppDialog] = useState(false);
  const [showTour, setShowTour] = useState(false);

  //get apps on load
  useEffect(() => {
    getApplications();
  }, []);

  //refresh screen after application actions
  useEffect(() => {
    console.log(applicationReducer);
  }, [applicationReducer, user, applications, application]);

  const getApplications = () => {
    dispatch(applicationActions.getApplications());
  };

  useEffect(() => {
    if (noApplication.noApplication && !noApplication.addButtonTourShown) {
      dispatch(applicationActions.updateApplicationAddButtonTourShown(true));
      setShowTour(true);
    }
  }, [application, noApplication]);

  const handleShareApplication = (record) => {
    setSelectedApplication(record);
    setOpenShareAppDialog(true);
  };

  const handleRemove = (app_id) => {
    const data = JSON.stringify({ appIdToDelete: app_id, user: user.id });
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
        //remove it from users applications
        const user = JSON.parse(localStorage.getItem('user'));
        user.applications = user.applications.filter((app) => app.application.id !== app_id);
        localStorage.setItem('user', JSON.stringify(user));

        //if it is the active application, remove it from local storage
        if (localStorage.getItem('activeProjectId') === app_id) {
          localStorage.removeItem('activeProjectId');
          dispatch(applicationActions.applicationSelected(null, null));
        }

        getApplications();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleAddApplication = () => {
    setShowAddApplicationModal(true);
    setSelectedApplication(null);
    setIsCreatingNewApp(true);
    setShowTour(false);
  };

  const closeAddApplicationModal = () => setShowAddApplicationModal(false);

  const handleApplicationEdit = (record) => {
    setIsCreatingNewApp(false);
    setSelectedApplication(record);
    setShowAddApplicationModal(true);
  };

  const handleExportApplication = (id, title) => {
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

  const handleClose = () => {
    setOpenShareAppDialog(false);
  };

  const renderAppVisibilityIcon = (record) => {
    if (record.visibility === 'Public') {
      return (
        <Tooltip title="Public">
          <GlobalOutlined />
        </Tooltip>
      );
      //TODO -- add this back in later
      // } else if (record.visibility === 'Private' && record.creator === user.username) {
      //   return (
      //     <Tooltip title="Your Application">
      //       <UserOutlined />
      //     </Tooltip>
      //   );
    } else {
      return (
        <Tooltip title="Shared to you">
          <ShareAltOutlined />
        </Tooltip>
      );
    }
  };

  const handleTourClose = () => {
    setShowTour(false);
  };

  const steps = [
    {
      title: 'Add Application',
      description: 'Click here to add an application. After adding an application, we can move on to the next step. ',
      placement: 'bottom',
      arrow: true,
      target: () => appAddButtonRef?.current,
      nextButtonProps: { style: { display: 'none' }, disabled: true },
    },
  ];

  const applicationColumns = [
    {
      width: '2%',
      title: '',
      render: (record) => renderAppVisibilityIcon(record),
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
        const createdAt = new Date(text);
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
            {record.visibility !== 'Public' && record.creator === user.username ? (
              <>
                <span onClick={() => handleShareApplication(record)}>
                  <Tooltip placement="left" title={<Text text="Share" />}>
                    <ShareAltOutlined />
                  </Tooltip>
                </span>
                <Divider type="vertical" />
              </>
            ) : null}

            <span onClick={() => handleApplicationEdit(record)}>
              <Tooltip placement="right" title={<Text text="Edit" />}>
                <EyeOutlined />
              </Tooltip>
            </span>
            <Divider type="vertical" />

            <span onClick={() => handleExportApplication(record.id, record.title)}>
              <Tooltip placement="right" title={<Text text="Export" />}>
                <ExportOutlined />
              </Tooltip>
            </span>
            <Divider type="vertical" />

            {record.creator === user.username ||
            (record.creator !== user.username && record.visibility !== 'Public') ? (
              <>
                <Popconfirm
                  title={<Text text="Are you sure you want to delete?" />}
                  onConfirm={() => handleRemove(record.id)}
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
            <Button type="primary" ref={appAddButtonRef} onClick={handleAddApplication}>
              {<Text text="Add Application" />}
            </Button>
          </Tooltip>
        }
      />
      <Tour steps={steps} open={showTour} onClose={handleTourClose}></Tour>

      <div style={{ padding: '15px' }}>
        <Table
          columns={applicationColumns}
          rowKey={(record) => record.id}
          dataSource={applications}
          pagination={applications?.length > 10 ? { pageSize: 10 } : false}
        />
      </div>

      {showAddApplicationModal ? (
        <AddApplication
          closeAddApplicationModal={closeAddApplicationModal}
          showAddApplicationModal={showAddApplicationModal}
          isCreatingNewApp={isCreatingNewApp}
          selectedApplication={selectedApplication}
          user={user}
          applications={applications}
          getApplications={dispatch(applicationActions.getApplications)}
        />
      ) : null}

      <div>
        {openShareAppDialog ? (
          <ShareApp
            appId={selectedApplication.id}
            appTitle={selectedApplication.title}
            user={user}
            onClose={handleClose}
          />
        ) : null}
      </div>
    </React.Fragment>
  );
};

export default Applications;
