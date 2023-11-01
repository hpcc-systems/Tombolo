import React, { useState, useEffect } from 'react';
import BreadCrumbs from '../../common/BreadCrumbs';
import { Tooltip, Button, message } from 'antd';
import Text from '../../common/Text';
import OrbitMonitoringTable from './OrbitMonitoringTable';
import OrbitMonitoringModal from './OrbitMonitoringModal';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { useSelector } from 'react-redux';

const OrbitMonitoring = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [orbitBuildList, setOrbitBuildList] = useState(null);
  const [selectedOrbitBuild, setSelectedOrbitBuild] = useState(null);
  const [editing, setEditing] = useState(null);

  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  const addOrbitMonitoring = async () => {
    await setSelectedOrbitBuild(null);
    await setEditing(null);
    await setConfirmLoading(true);
    await setModalVisible(true);
    await setConfirmLoading(false);
  };

  useEffect(() => {
    async function fetchBuilds() {
      if (applicationId) {
        await getOrbitMonitoring(applicationId);
      }
    }
    fetchBuilds();
  }, [applicationId]);

  //Get list of all orbit monitoring
  const getOrbitMonitoring = async (applicationId) => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/orbit/allMonitorings/${applicationId}`, payload);
      if (!response.ok) handleError(response);

      const data = await response.json();

      setOrbitBuildList(data);
    } catch (err) {
      console.log(err);
    }
  };

  const saveOrbitBuildDetails = async (monitoringDetails) => {
    try {
      const payload = {
        method: editing ? 'PUT' : 'POST',
        header: authHeader(),
        body: JSON.stringify({
          ...monitoringDetails,
          id: editing ? editing : selectedOrbitBuild,
          build: selectedOrbitBuild,
        }),
      };

      const response = await fetch('/api/orbit/', payload);

      if (!response.ok) handleError(response);
      message.success('Successfully saved orbit build monitoring data');
      getOrbitMonitoring();
    } catch (error) {
      console.log(error);
      message.error('Failed to save orbit build monitoring');
    }
  };

  return (
    <>
      <BreadCrumbs
        extraContent={
          <Tooltip placement="bottom" title={'Click to add a new Orbit Monitoring'}>
            <Button type="primary" onClick={() => addOrbitMonitoring()}>
              {<Text text="Add Orbit Monitoring" />}
            </Button>
          </Tooltip>
        }
      />
      <OrbitMonitoringTable
        setSelectedOrbitBuild={setSelectedOrbitBuild}
        orbitBuildList={orbitBuildList}
        setOrbitBuildList={setOrbitBuildList}
        setModalVisible={setModalVisible}
        setEditing={setEditing}
      />
      <OrbitMonitoringModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        confirmLoading={confirmLoading}
        orbitBuildList={orbitBuildList}
        setOrbitBuildList={setOrbitBuildList}
        saveOrbitBuildDetails={saveOrbitBuildDetails}
        selectedOrbitBuild={selectedOrbitBuild}
        setSelectedOrbitBuild={setSelectedOrbitBuild}
        editing={editing}
        setEditing={setEditing}
        getOrbitMonitoring={getOrbitMonitoring}
      />
    </>
  );
};

export default OrbitMonitoring;
