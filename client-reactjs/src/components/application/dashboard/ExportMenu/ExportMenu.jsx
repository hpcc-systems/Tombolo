import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Text from '../../../common/Text';
import { Button, message, Dropdown, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../../common/AuthHeader.js';
import { useLocation } from 'react-router-dom';
import DashboardModal from './DashboardModal';

const ExportMenu = (selectedCluster) => {
  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  const [modalVisible, setModalVisible] = useState(false);
  const [dataType, setDataType] = useState('');

  const location = useLocation();

  //get path and set data type for exporting later
  useEffect(() => {
    const splitName = location.pathname.split('/');
    setDataType(splitName[splitName.length - 1]);
  });

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
      //TO DO --- write checks using dataType State to reach out to correct API's
      //example   if (dataType === 'notifications') {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      let response;
      if (dataType === 'notifications') {
        response = await fetch(`/api/notifications/read/${applicationId}/file/${type}`, payload);
      }

      if (dataType === 'clusterUsage') {
        response = await fetch(
          `/api/cluster/clusterStorageHistory/file/${type}/${selectedCluster.selectedCluster}`,
          payload
        );
      }

      if (!response.ok) handleError(response);
      const blob = await response.blob();
      const newBlob = new Blob([blob]);

      const blobUrl = window.URL.createObjectURL(newBlob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `Tombolo-${dataType}.${type}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      //send delete request after file is downloaded
      const payload2 = {
        method: 'DELETE',
        header: authHeader(),
      };
      if (dataType === 'notifications') {
        const response2 = await fetch(`/api/notifications/read/${applicationId}/file/${type}`, payload2);

        if (!response2.ok) handleError(response2);
      }

      if (dataType === 'clusterUsage') {
        const response2 = await fetch(`/api/cluster/clusterStorageHistory/file/${type}`, payload2);

        if (!response2.ok) handleError(response2);
      }
    } catch (error) {
      message.error('Failed to fetch notifications');
    }
  };

  return (
    <>
      <Dropdown menu={menu}>
        <Button type="primary" icon={<DownOutlined style={{ marginRight: '5px' }} />}>
          {<Text text="Export Data" />}
        </Button>
      </Dropdown>
      <DashboardModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        applicationId={applicationId}
        dataType={dataType}></DashboardModal>
    </>
  );
};

export default ExportMenu;
