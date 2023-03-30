import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import { Button, message, Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../common/AuthHeader.js';

import DashboardModal from './DashboardModal';

function Dashboard() {
  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  const [modalVisible, setModalVisible] = useState(false);

  const [notifications, setNotifications] = useState();

  const menu = (
    <Menu onClick={(e) => handleMenuClick(e)}>
      <Menu.Item key="CSV">
        <i className="fa fa-lg fa-file"></i> {<Text text="CSV" />}
      </Menu.Item>
      <Menu.Item key="JSON">
        <i className="fa  fa-lg fa-file-text-o"></i> {<Text text="JSON" />}
      </Menu.Item>
      <Menu.Item key="API">
        <i className="fa fa-lg fa-link"></i> {<Text text="API" />}
      </Menu.Item>
    </Menu>
  );

  const handleMenuClick = async (e) => {
    if (e.key === 'API') {
      setModalVisible(true);
    }

    if (e.key === 'CSV' || e.key === 'JSON') {
      await getFile(e.key);
    }
  };

  const getFile = async (type) => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/notifications/read/${applicationId}/file/${type}`, payload);
      console.log(response);
      if (!response.ok) handleError(response);

      const blob = await response.blob();
      const newBlob = new Blob([blob]);

      const blobUrl = window.URL.createObjectURL(newBlob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Tombolo-Notifications.${type}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.log(error);
      message.error('Failed to fetch notifications');
    }
  };

  //Get list of all file monitoring
  const getNotifications = async () => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/notifications/read/${applicationId}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();

      setNotifications(data);
      return data;
    } catch (error) {
      message.error('Failed to fetch notifications');
    }
  };

  return (
    <>
      <BreadCrumbs
        extraContent={
          <Dropdown overlay={menu}>
            <Button type="primary" icon={<DownOutlined />}>
              {<Text text="Export Data" />}
            </Button>
          </Dropdown>
        }
      />
      <DashboardModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        getNotifications={getNotifications}
        notifications={notifications}
        applicationId={applicationId}></DashboardModal>
    </>
  );
}

export default Dashboard;
