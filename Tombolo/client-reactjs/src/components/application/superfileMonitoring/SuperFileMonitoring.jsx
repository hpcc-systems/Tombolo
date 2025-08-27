import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import SuperFileMonitoringTable from './SuperFileMonitoringTable';
import SuperFileMonitoringModal from './SuperFileMonitoringModal';
import { Tooltip, Button, message } from 'antd';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { getRoleNameArray } from '../../common/AuthUtil.js';

function SuperFileMonitoring() {
  const [superfileList, setSuperfileList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [successAddingMonitoring, setSuccessAddingMonitoring] = useState(0);
  const [selectedFileMonitoring, setSelectedFileMonitoring] = useState(null);

  const applicationId = useSelector((state) => state.application.application.applicationId);
  const clusters = useSelector((state) => state.application.clusters);

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  useEffect(() => {
    if (applicationId && clusters) {
      getSuperFileMonitoring(applicationId);
    }
  }, [applicationId, clusters, successAddingMonitoring]);

  const saveFileMonitoringDetails = async (monitoringDetails) => {
    try {
      const payload = {
        method: selectedFileMonitoring ? 'PUT' : 'POST',
        headers: authHeader(),
        body: JSON.stringify({ ...monitoringDetails, id: selectedFileMonitoring }),
      };

      const response = await fetch('/api/superfilemonitoring/read/', payload);

      if (!response.ok) handleError(response);
      message.success('Successfully saved file monitoring data');
    } catch (error) {
      console.log(error);
      message.error('Failed to save file monitoring');
    }
  };

  //opens modal
  async function addSuperfileMonitoring() {
    setModalVisible(true);
    setSelectedFileMonitoring(null);
  }

  //Get list of all file monitoring
  const getSuperFileMonitoring = async (applicationId) => {
    try {
      const payload = {
        method: 'GET',
        headers: authHeader(),
      };

      const response = await fetch(`/api/superfilemonitoring/read/all/${applicationId}`, payload);
      if (!response.ok) handleError(response);

      const data = await response.json();
      const final = [];
      //trim response and grab cluster name based on id returned
      for (let i = 0; i < data.length; i++) {
        const { name, metaData, clusterid, monitoringActive, cron } = data[i];
        //grab cluster name based on id
        const cluster = clusters.find((cluster) => cluster.id === clusterid);

        const monitoringData = {
          id: data[i].id,
          monitoringActive: monitoringActive,
          cron: cron,
          name: name,
          superfile_name: metaData.fileInfo.Name,
          size: metaData.fileInfo.size,
          cluster: cluster ? cluster.name : '',
          mostRecentSubFile: metaData.fileInfo.mostRecentSubFile,
          mostRecentSubFileDate: metaData.fileInfo.mostRecentSubFileDate,
          lastMonitored: metaData.lastMonitored,
          subfiles: metaData.fileInfo.subfileCount,
        };
        final.push(monitoringData);
      }

      setSuperfileList(final);
    } catch (err) {
      console.log(err);
    }
  };

  //for formatting size for display
  const sizeFormatter = (size) => {
    //format size for more readable output
    let tempSize = size;
    let count = 0;

    //get to largest unit of measurement
    while (tempSize > 1024) {
      tempSize = tempSize / 1024;
      count++;
    }

    let measurement;

    switch (count) {
      case 1:
        measurement = 'KB';
        break;
      case 2:
        measurement = 'MB';
        break;
      case 3:
        measurement = 'GB';
        break;
      case 4:
        measurement = 'TB';
        break;
      case 5:
        measurement = 'PB';
        break;
      default:
        measurement = 'B';
        break;
    }

    //convert to 2 decimal places and add on which measurement is necessary
    tempSize = parseFloat(tempSize).toFixed(2);

    let formattedSize = tempSize + ' ' + measurement;

    return formattedSize;
  };

  return (
    <>
      <BreadCrumbs
        extraContent={
          <Tooltip placement="bottom" title={'Click to add a new Application'}>
            <Button type="primary" onClick={() => addSuperfileMonitoring()}>
              {<Text text="Add SuperFile Monitoring" />}
            </Button>
          </Tooltip>
        }
      />
      <SuperFileMonitoringTable
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        superfileMonitoringList={superfileList}
        setSuperFileMonitoringList={setSuperfileList}
        sizeFormatter={sizeFormatter}
        applicationId={applicationId}
        setSelectedFileMonitoring={setSelectedFileMonitoring}
        isReader={isReader}></SuperFileMonitoringTable>

      {modalVisible ? (
        <SuperFileMonitoringModal
          modalVisible={modalVisible}
          setModalVisible={setModalVisible}
          saveFileMonitoringDetails={saveFileMonitoringDetails}
          setSuccessAddingMonitoring={setSuccessAddingMonitoring}
          selectedFileMonitoring={selectedFileMonitoring}
          superfileMonitoringList={superfileList}
          isReader={isReader}
        />
      ) : null}
    </>
  );
}

export default SuperFileMonitoring;
