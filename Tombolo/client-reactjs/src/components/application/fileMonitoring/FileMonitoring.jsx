import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import { Tooltip, Button, message } from 'antd';
import FileMonitoringTable from './FileMonitoringTable';
import FileMonitoringModal from './FileMonitoringModal';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { getRoleNameArray } from '../../common/AuthUtil.js';

function FileMonitoring() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fileMonitoringList, setFileMonitoringList] = useState([]);
  const [successAddingMonitoring, setSuccessAddingMonitoring] = useState(0);
  const [selectedFileMonitoring, setSelectedFileMonitoring] = useState(null);
  const {
    clusters,
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  useEffect(() => {
    if (applicationId && clusters) {
      getFileMonitoring(applicationId);
    }
  }, [applicationId, clusters, successAddingMonitoring]);

  //Get list of all file monitoring
  const getFileMonitoring = async (applicationId) => {
    try {
      const payload = {
        method: 'GET',
        headers: authHeader(),
      };

      const response = await fetch(`/api/filemonitoring/read/all/${applicationId}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();

      const finalMonitoringData = [];
      for (let i = 0; i < data.length; i++) {
        const {
          name,
          cluster_id,
          monitoringActive,
          monitoringAssetType,
          cron,
          metaData: {
            fileInfo: { dirToMonitor, fileName, landingZone, Name },
          },
        } = data[i];
        const cluster = clusters.find((cluster) => cluster.id === cluster_id);
        let fileFullPath =
          monitoringAssetType === 'logicalFiles' ? Name : [landingZone, ...dirToMonitor, fileName].join('/');

        const monitoringData = {
          id: data[i].id,
          monitoringActive,
          cron,
          displayName: name,
          fileName: fileFullPath,
          cluster: cluster ? cluster.name : '',
          monitoringStarted: data[i].updatedAt,
          lastMonitored: data[i].updatedAt,
          monitoringAssetType,
        };
        finalMonitoringData.push(monitoringData);
      }

      setFileMonitoringList(finalMonitoringData);
    } catch (error) {
      console.log(error);
      message.error('Failed to fetch file monitoring');
    }
  };

  return (
    <>
      <BreadCrumbs
        extraContent={
          <Tooltip placement="bottom" title={'Click to add a new Application'}>
            <Button type="primary" onClick={() => setIsModalVisible(true)}>
              {<Text text="Add File Monitoring" />}
            </Button>
          </Tooltip>
        }
      />
      <FileMonitoringTable
        fileMonitoringList={fileMonitoringList}
        setFileMonitoringList={setFileMonitoringList}
        setIsModalVisible={setIsModalVisible}
        setSelectedFileMonitoring={setSelectedFileMonitoring}
        applicationId={applicationId}
        isReader={isReader}
      />

      {isModalVisible ? (
        <FileMonitoringModal
          visible={isModalVisible}
          setModalVisibility={setIsModalVisible}
          setSuccessAddingMonitoring={setSuccessAddingMonitoring}
          fileMonitoringList={fileMonitoringList}
          selectedFileMonitoring={selectedFileMonitoring}
          setSelectedFileMonitoring={setSelectedFileMonitoring}
          isReader={isReader}
        />
      ) : null}
    </>
  );
}

export default FileMonitoring;
