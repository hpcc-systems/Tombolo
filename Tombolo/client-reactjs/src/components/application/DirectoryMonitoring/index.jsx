import React, { useState, useEffect } from 'react';
import BreadCrumbs from '../../common/BreadCrumbs';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import Form from 'antd/es/form/Form';

import AddEditModal from './AddEditModal/Modal';
import ActionButton from './ActionButton';
import DirectoryMonitoringTable from './Table';

const DirectoryMonitoring = () => {
  const {
    applicationReducer: {
      application: { applicationId },
    },
    authenticationReducer: { user },
    applicationReducer: { clusters },
  } = useSelector((state) => state);

  //form
  const [form] = Form.useForm();

  //Local States
  const [displayAddEditModal, setDisplayAddEditModal] = useState(false);
  const [intermittentScheduling, setIntermittentScheduling] = useState({
    frequency: 'daily',
    id: uuidv4(),
    runWindow: 'daily',
  });
  const [completeSchedule, setCompleteSchedule] = useState([]);
  const [cron, setCron] = useState('');
  const [cronMessage, setCronMessage] = useState(null); // Cron message to display when cron is invalid or has errors
  const [erroneousScheduling, setErroneousScheduling] = useState(false);
  const [directoryMonitorings, setDirectoryMonitorings] = useState([]);
  const [displayMonitoringDetailsModal, setDisplayMonitoringDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [teamsHooks, setTeamsHook] = useState([]);
  const [editingData, setEditingData] = useState({ isEditing: false }); // Data to be edited
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);
  const [savingDirectoryMonitoring, setSavingDirectoryMonitoring] = useState(false); // Flag to indicate if directory monitoring is being saved
  const [erroneousTabs, setErroneousTabs] = useState([]); // Tabs with erroneous fields
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [monitoringTypeId, setMonitoringTypeId] = useState(null);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);

  const handleAddDirectoryMonitoringButtonClick = () => {
    setDisplayAddEditModal(true);
  };

  const handleSaveDirectoryMonitoring = async () => {};
  const handleUpdateDirectoryMonitoring = async () => {};
  const resetStates = () => {};

  useEffect(() => {
    //console log all unused variables
    console.log(directoryMonitorings);
    console.log(displayAddEditModal);
    console.log(displayMonitoringDetailsModal);
    console.log(selectedMonitoring);
    console.log(setTeamsHook);
    console.log(setDirectoryMonitorings);
    console.log(displayAddRejectModal);
    console.log(setSavingDirectoryMonitoring);
    console.log(setMonitoringTypeId);
    console.log(monitoringTypeId);
    console.log(bulkEditModalVisibility);
    console.log(user);
  });

  //JSX
  return (
    <>
      <BreadCrumbs
        extraContent={
          <ActionButton
            handleAddDirectoryMonitoringButtonClick={handleAddDirectoryMonitoringButtonClick}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            setDirectoryMonitorings={setDirectoryMonitorings}
            setBulkEditModalVisibility={setBulkEditModalVisibility}
          />
        }
      />
      <AddEditModal
        displayAddEditModal={displayAddEditModal}
        setDisplayAddEditModal={setDisplayAddEditModal}
        handleSaveDirectoryMonitoring={handleSaveDirectoryMonitoring}
        handleUpdateDirectoryMonitoring={handleUpdateDirectoryMonitoring}
        form={form}
        intermittentScheduling={intermittentScheduling}
        setIntermittentScheduling={setIntermittentScheduling}
        setCompleteSchedule={setCompleteSchedule}
        completeSchedule={completeSchedule}
        cron={cron}
        setCron={setCron}
        cronMessage={cronMessage}
        setCronMessage={setCronMessage}
        erroneousScheduling={erroneousScheduling}
        clusters={clusters}
        teamsHooks={teamsHooks}
        setSelectedMonitoring={setSelectedMonitoring}
        savingDirectoryMonitoring={savingDirectoryMonitoring}
        directoryMonitorings={directoryMonitorings}
        setEditingData={setEditingData}
        isEditing={editingData?.isEditing}
        erroneousTabs={erroneousTabs}
        setErroneousTabs={setErroneousTabs}
        setErroneousScheduling={setErroneousScheduling}
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
        resetStates={resetStates}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <DirectoryMonitoringTable
        directoryMonitorings={directoryMonitorings}
        setDirectoryMonitorings={setDirectoryMonitorings}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddEditModal={setDisplayAddEditModal}
        setEditingData={setEditingData}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        applicationId={applicationId}
        setSelectedRows={setSelectedRows}
      />
      {/*
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={displayMonitoringDetailsModal}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={clusters}
        teamsHooks={teamsHooks}
        domains={domains}
        productCategories={productCategories}
      />
      <ApproveRejectModal
        id={selectedMonitoring?.id}
        displayAddRejectModal={displayAddRejectModal}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        user={user}
        setDirectoryMonitorings={setDirectoryMonitorings}
      />
      {bulkEditModalVisibility && (
        <BulkUpdateModal
          bulkEditModalVisibility={bulkEditModalVisibility}
          setBulkEditModalVisibility={setBulkEditModalVisibility}
          DirectoryMonitorings={DirectoryMonitorings}
          setDirectoryMonitorings={setDirectoryMonitorings}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      )} */}
      ,
    </>
  );
};

export default DirectoryMonitoring;
