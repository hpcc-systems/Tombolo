import React, { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { Button, Dropdown, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownOutlined, FilterOutlined } from '@ant-design/icons';

import { handleSuccess, handleError } from '@/components/common/handleResponse';
import notificationsService from '@/services/notifications.service';

interface Props {
  selectedNotificationsIds: any[];
  setNotifications: Dispatch<SetStateAction<any[]>>;
  setSelectedNotificationsIds: (ids: any[]) => void;
  setDisplayCreateNotificationModal: (v: boolean) => void;
  setDisplayUpdateModal: (v: boolean) => void;
  setFiltersVisible: Dispatch<SetStateAction<boolean>>;
  filtersVisible: boolean;
  isReader: boolean;
}

const NotificationActions: React.FC<Props> = ({
  selectedNotificationsIds,
  setNotifications,
  setSelectedNotificationsIds,
  setDisplayCreateNotificationModal,
  setDisplayUpdateModal,
  setFiltersVisible,
  filtersVisible,
  isReader,
}) => {
  const application = useSelector((state: any) => state.application.application);
  const integrations = useSelector((state: any) => state.application.integrations);

  const deleteSelectedNotifications = async () => {
    try {
      await notificationsService.deleteMultipleNotifications(selectedNotificationsIds);
      handleSuccess('Selected notifications deleted successfully');
      setSelectedNotificationsIds([]);
      setNotifications((prevNotifications: any[]) =>
        prevNotifications.filter(notification => !selectedNotificationsIds.includes(notification.id))
      );
    } catch (_err) {
      handleError('Failed to delete selected notifications');
    }
  };

  const openCreateNotificationModal = () => setDisplayCreateNotificationModal(true);

  const changeFilterVisibility = () => {
    localStorage.setItem('filtersVisible', String(!filtersVisible));
    setFiltersVisible((prev: boolean) => !prev);
  };

  const items: any[] = [
    {
      key: '3',
      icon: <DeleteOutlined />,
      label: (
        <Popconfirm
          title={`Are you sure you want to delete selected ${selectedNotificationsIds.length} notification${selectedNotificationsIds.length > 1 ? 's' : ''}?`}
          okText="Yes"
          okButtonProps={{ type: 'primary', danger: true }}
          onConfirm={deleteSelectedNotifications}
          cancelText="No">
          Delete notifications
        </Popconfirm>
      ),
      disabled: selectedNotificationsIds.length < 2,
    },
    {
      key: '4',
      icon: <FilterOutlined />,
      label: filtersVisible ? 'Hide filters' : 'Show filters',
      onClick: changeFilterVisibility,
    },
  ];

  const isAsrIntegrationEnabled = integrations.some(
    (integration: any) => integration.name === 'ASR' && application.applicationId === integration.application_id
  );

  if (isAsrIntegrationEnabled) {
    items.unshift(
      {
        key: '1',
        icon: <PlusOutlined />,
        label: 'Add new notification',
        onClick: openCreateNotificationModal,
      },
      {
        key: '2',
        icon: <EditOutlined />,
        label: 'Edit notifications',
        disabled: selectedNotificationsIds.length < 2,
        onClick: setDisplayUpdateModal as any,
      }
    );
  }

  return (
    <Dropdown
      disabled={isReader}
      menu={{
        items,
      }}>
      <Button type="primary">
        Actions
        <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default NotificationActions;
