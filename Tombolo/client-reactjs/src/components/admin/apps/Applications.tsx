// Imports from libraries
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/redux/store/hooks';
import { Button, Divider, Popconfirm, Table, Tooltip, Tour, TourProps } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, GlobalOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';

// Local imports
import { handleError, handleSuccess } from '../../common/handleResponse';
import applicationsService from '@/services/applications.service';
import BreadCrumbs from '../../common/BreadCrumbs';
import { Constants } from '../../common/Constants';
import AddApplication from './AddApplication';
import { getUser } from '../../common/userStorage';
import Text from '../../common/Text';
import { getApplications, applicationSelected, applicationAddButtonTourShown } from '@/redux/slices/ApplicationSlice';

import type { FC, RefObject } from 'react';
import type { ApplicationUI } from '@tombolo/shared';

interface User {
  id: string;
  applications: Array<{
    id: string;
    application: {
      id: string;
      title: string;
      description: string;
    };
  }>;
}

interface RootState {
  application: {
    applications: ApplicationUI[];
    noApplication: {
      noApplication: boolean;
      addButtonTourShown: boolean;
    };
  };
}

type Mode = 'create' | 'edit' | 'view' | null;

// Table column configuration
const getApplicationColumns = (
  user: User,
  handleApplicationView: (record: ApplicationUI) => void,
  handleApplicationEdit: (record: ApplicationUI) => void,
  handleRemove: (id: string) => void
): ColumnsType<ApplicationUI> => [
  {
    width: '2%',
    title: '',
    render: (record: ApplicationUI) =>
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
    render: (_text: any, record: ApplicationUI) => (
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
    render: (text: string) => {
      const createdAt = new Date(text);
      return (
        createdAt.toLocaleDateString('en-US', Constants.COMPACT_DATE_FORMAT_OPTIONS) +
        ' @ ' +
        createdAt.toLocaleTimeString('en-US', Constants.TIME_FORMAT_OPTIONS)
      );
    },
  },
  {
    width: '10%',
    title: 'Action',
    dataIndex: '',
    render: (_text: any, record: ApplicationUI) => (
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
const getTourSteps = (appAddButtonRef: RefObject<HTMLButtonElement>): TourProps['steps'] => [
  {
    title: 'Add Application',
    description: 'Click here to add an application. After adding an application, we can move on to the next step.',
    placement: 'bottom',
    arrow: true,
    target: () => appAddButtonRef?.current,
    nextButtonProps: { style: { display: 'none' } },
  },
];

const Applications: FC = () => {
  // State and Redux hooks
  const user = getUser();
  const dispatch = useAppDispatch();
  const applications = useSelector((state: RootState) => state.application.applications);
  const noApplication = useSelector((state: RootState) => state.application.noApplication);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationUI | null>(null);
  const [showAddApplicationModal, setShowAddApplicationModal] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>(null);
  const [showTour, setShowTour] = useState<boolean>(false);
  const [localApplications, setLocalApplications] = useState<ApplicationUI[]>(applications);
  const appAddButtonRef = useRef<HTMLButtonElement>(null);

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
  const handleRemove = async (app_id: string): Promise<void> => {
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
      console.error(error);
    }
  };

  const handleAddApplication = (): void => {
    setShowAddApplicationModal(true);
    setSelectedApplication(null);
    setMode('create');
    setShowTour(false);
  };

  const handleApplicationView = (record: ApplicationUI): void => {
    setShowAddApplicationModal(true);
    setSelectedApplication(record);
    setMode('view');
  };

  const handleApplicationEdit = (record: ApplicationUI): void => {
    setShowAddApplicationModal(true);
    setSelectedApplication(record);
    setMode('edit');
  };

  const closeAddApplicationModal = (): void => {
    setShowAddApplicationModal(false);
    setMode(null);
  };

  const handleTourClose = (): void => {
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
          mode={mode as 'create' | 'edit' | 'view'}
          setMode={setMode as (mode: 'create' | 'edit' | 'view') => void}
          selectedApplication={selectedApplication}
          user={user}
          applications={localApplications}
        />
      )}
    </>
  );
};

export default Applications;
