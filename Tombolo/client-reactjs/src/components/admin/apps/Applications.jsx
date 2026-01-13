// Imports from libraries
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Divider, Popconfirm, Table, Tooltip, Tour } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, GlobalOutlined, QuestionCircleOutlined } from '@ant-design/icons';

// Local imports
import { handleError, handleSuccess } from '../../common/handleResponse';
import applicationsService from '@/services/applications.service';
import BreadCrumbs from '../../common/BreadCrumbs';
import { Constants } from '../../common/Constants';
import AddApplication from './AddApplication';
import { getUser } from '../../common/userStorage';
import Text from '../../common/Text';
import { getApplications, applicationSelected, applicationAddButtonTourShown } from '@/redux/slices/ApplicationSlice';

// Table column configuration
const getApplicationColumns = (user, handleApplicationView, handleApplicationEdit, handleRemove) => [
  {
    width: '2%',
    title: '',
    render: record =>
      record.visibility === 'Public' ? (
        <Tooltip title="Public">
          <GlobalOutlined className="link-text" />
        </Tooltip>
      ) : null,
  },
  {
    width: '20%',
    title: <Text text="Title" />,
    dataIndex: 'title',
  },
  {
    width: '45%',
    title: <Text text="Description" />,
    dataIndex: 'description',
    className: 'overflow-hidden',
    ellipsis: true,
  },
  {
    width: '8%',
    title: <Text text="Created By" />,
    dataIndex: 'creator',
    render: (_text, record) => (
      <Tooltip title={record?.application_creator?.email}>
        <div className="link-text">
          {record?.application_creator?.firstName + ' ' + record?.application_creator?.lastName}
        </div>
      </Tooltip>
    ),
  },
  {
    width: '15%',
    title: <Text text="Created" />,
    dataIndex: 'createdAt',
    render: text => {
      const createdAt = new Date(text);
      return (
        createdAt.toLocaleDateString('en-US', Constants.COMPACT_DATE_FORMAT_OPTION) +
        ' @ ' +
        createdAt.toLocaleTimeString('en-US', Constants.TIME_FORMAT_OPTIONS)
      );
    },
  },
  {
    width: '10%',
    title: 'Action',
    dataIndex: '',
    render: (_text, record) => (
      <span>
        <Tooltip placement="right" title={<Text text="View" />}>
          <EyeOutlined className="link-text" onClick={() => handleApplicationView(record)} />
        </Tooltip>
        {record.application_creator?.id === user.id && (
          <>
            <Divider type="vertical" />
            <Tooltip placement="right" title={<Text text="Edit" />}>
              <EditOutlined className="link-text" onClick={() => handleApplicationEdit(record)} />
            </Tooltip>
          </>
        )}
        {(record.creator === user.id || (record.creator !== user.id && record.visibility !== 'Public')) && (
          <>
            <Divider type="vertical" />
            <Popconfirm
              title={<Text text="Are you sure you want to delete?" />}
              onConfirm={() => handleRemove(record.id)}
              icon={<QuestionCircleOutlined className="link-text" />}>
              <Tooltip placement="right" title={<Text text="Delete" />}>
                <DeleteOutlined className="link-text" />
              </Tooltip>
            </Popconfirm>
          </>
        )}
      </span>
    ),
  },
];

// Tour steps configuration
const getTourSteps = appAddButtonRef => [
  {
    title: 'Add Application',
    description: 'Click here to add an application. After adding an application, we can move on to the next step.',
    placement: 'bottom',
    arrow: true,
    target: () => appAddButtonRef?.current,
    nextButtonProps: { style: { display: 'none' }, disabled: true },
  },
];

const Applications = () => {
  // State and Redux hooks
  const user = getUser();
  const dispatch = useDispatch();
  const applications = useSelector(state => state.application.applications);
  const noApplication = useSelector(state => state.application.noApplication);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [mode, setMode] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const [localApplications, setLocalApplications] = useState(applications);
  const appAddButtonRef = useRef();

  // Sync localApplications with Redux applications
  useEffect(() => {
    setLocalApplications(applications);
  }, [applications]);

  // Fetch applications on mount
  useEffect(() => {
    dispatch(getApplications());
  }, [dispatch]);

  // Trigger tour if no applications exist
  useEffect(() => {
    if (noApplication.noApplication && !noApplication.addButtonTourShown) {
      dispatch(applicationAddButtonTourShown(true));
      setShowTour(true);
    }
  }, [noApplication, dispatch]);

  // Handle Remove
  const handleRemove = async app_id => {
    const originalApplications = [...localApplications];

    try {
      // Store original applications for revert
      // Optimistically update local applications
      setLocalApplications(localApplications.filter(app => app.id !== app_id));

      // Delete application using service
      await applicationsService.delete({
        appIdToDelete: app_id,
        userId: user.id,
      });

      // Clear active project ID if deleted
      if (localStorage.getItem('activeProjectId') === app_id) {
        localStorage.removeItem('activeProjectId');
        dispatch(applicationSelected({ applicationId: null, applicationTitle: null }));
      }

      // Fetch updated applications
      dispatch(getApplications());
      handleSuccess('Application has been removed successfully.');
    } catch (error) {
      // Revert optimistic update
      setLocalApplications(originalApplications);
      handleError('Failed to delete the application. Please try again.');
    }
  };

  const handleAddApplication = () => {
    setShowAddApplicationModal(true);
    setSelectedApplication(null);
    setMode('create');
    setShowTour(false);
  };

  const handleApplicationView = record => {
    setShowAddApplicationModal(true);
    setSelectedApplication(record);
    setMode('view');
  };

  const handleApplicationEdit = record => {
    setShowAddApplicationModal(true);
    setSelectedApplication(record);
    setMode('edit');
  };

  const closeAddApplicationModal = () => {
    setShowAddApplicationModal(false);
    setMode(null);
  };

  const handleTourClose = () => {
    setShowTour(false);
  };

  // Render
  return (
    <>
      <BreadCrumbs
        extraContent={
          <Tooltip placement="bottom" title="Click to add a new Application">
            <Button type="primary" ref={appAddButtonRef} onClick={handleAddApplication}>
              <Text text="Add Application" />
            </Button>
          </Tooltip>
        }
      />
      <Tour steps={getTourSteps(appAddButtonRef)} open={showTour} onClose={handleTourClose} />
      <div style={{ padding: '15px' }}>
        <Table
          size="small"
          columns={getApplicationColumns(user, handleApplicationView, handleApplicationEdit, handleRemove)}
          rowKey={record => record.id}
          dataSource={localApplications}
          pagination={localApplications?.length > 10 ? { pageSize: 10 } : false}
        />
      </div>
      {showAddApplicationModal && (
        <AddApplication
          closeAddApplicationModal={closeAddApplicationModal}
          showAddApplicationModal={showAddApplicationModal}
          mode={mode}
          selectedApplication={selectedApplication}
          user={user}
          applications={localApplications}
          getApplications={() => dispatch(getApplications())}
        />
      )}
    </>
  );
};

export default Applications;
