// Packages
import React from 'react';
import { useSelector } from 'react-redux';
import { Button, Menu, Dropdown, Popconfirm, message } from 'antd';
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
    applicationReducer: { integrations },
  } = useSelector((state) => state);
  // Delete selected notifications
  const deleteSelectedNotifications = async () => {
    try {
      await deleteMultipleNotifications(selectedNotificationsIds);
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
  const menu = (
    <Menu>
      <Menu.ItemGroup>
        {integrations.some((i) => i.name === 'ASR') && (
          <>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={openCreateNotificationModal}>
              Add New Notification
            </Menu.Item>
            <Menu.Item
              key="2"
              disabled={selectedNotificationsIds.length < 2}
              icon={<EditOutlined />}
              onClick={setDisplayUpdateModal}>
              Update Notifications
            </Menu.Item>
          </>
        )}

        <Menu.Item key="3" disabled={selectedNotificationsIds.length < 2} icon={<DeleteOutlined />}>
          <Popconfirm
            title={`Are you sure you want to delete selected ${selectedNotificationsIds.length} notification${
              selectedNotificationsIds.length > 1 ? 's' : ''
            }?`}
            okText="Yes"
            okButtonProps={{ type: 'danger' }}
            onConfirm={deleteSelectedNotifications}
            cancelText="No">
            Delete Notifications
          </Popconfirm>
        </Menu.Item>
      </Menu.ItemGroup>

      <Menu.Divider />

      <Menu.ItemGroup>
        <Menu.Item key="4" icon={<FilterOutlined />} onClick={changeFilterVisibility}>
          {filtersVisible ? 'Hide Filters' : 'Show Filters'}
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );

  // Returning JSX
  return (
    <Dropdown overlay={menu}>
      <Button type="primary">
        Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default NotificationActions;
