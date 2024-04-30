// Packages
import React from 'react';
import { useSelector } from 'react-redux';
import { Button, Dropdown, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownOutlined, FilterOutlined } from '@ant-design/icons';

//Local imports
import { deleteMultipleNotifications } from './notificationUtil';

const NotificationActions = ({
  selectedNotificationsIds,
  setNotifications,
  setSelectedNotificationsIds,
  setDisplayCreateNotificationModal,
  setDisplayUpdateModal,
  setFiltersVisible,
  filtersVisible,
}) => {
  //Redux
  const {
    applicationReducer: { integrations, application },
  } = useSelector((state) => state);

  // Delete selected notifications
  const deleteSelectedNotifications = async () => {
    try {
      await deleteMultipleNotifications(selectedNotificationsIds);
      message.success('Selected notifications deleted successfully');
      setSelectedNotificationsIds([]);
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => !selectedNotificationsIds.includes(notification.id))
      );
    } catch (err) {
      message.error('Failed to delete selected notifications');
    }
  };

  // Open create notification modal
  const openCreateNotificationModal = () => {
    setDisplayCreateNotificationModal(true);
  };

  //Change filter visibility
  const changeFilterVisibility = () => {
    localStorage.setItem('filtersVisible', !filtersVisible);
    setFiltersVisible((prev) => !prev);
  };

  // Menu for action button
  const items = [
    {
      key: '3',
      icon: <DeleteOutlined />,
      label: (
        <Popconfirm
          title={`Are you sure you want to delete selected ${selectedNotificationsIds.length} notification${
            selectedNotificationsIds.length > 1 ? 's' : ''
          }?`}
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

  // If ASR is enabled, add ASR only options to action button  menu
  const isAsrIntegrationEnabled = integrations.some(
    (integration) => integration.name === 'ASR' && application.applicationId === integration.application_id
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
        onClick: setDisplayUpdateModal,
      }
    );
  }

  // Returning JSX
  return (
    <Dropdown
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
