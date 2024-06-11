import React, { useState, useEffect } from 'react';
import BreadCrumbs from '../../common/BreadCrumbs';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { Form, message } from 'antd';
import {
  checkScheduleValidity,
  identifyErroneousTabs,
  createDirectoryMonitoring,
  getAllDirectoryMonitorings,
  getAllTeamsHook,
} from './Utils.js';

import AddEditModal from './AddEditModal/Modal';
import ActionButton from './ActionButton';
import DirectoryMonitoringTable from './Table';
import ApproveRejectModal from './ApproveRejectModal';
import dayjs from 'dayjs';
import BulkUpdateModal from './BulkUpdateModal.jsx';
import BulkApprovalModal from './BulkApprovalModal.jsx';
import ViewDetailsModal from './ViewDetailsModal';

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
  const [displayViewDetailsModal, setDisplayViewDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [teamsHooks, setTeamsHook] = useState([]);
  const [editingData, setEditingData] = useState({ isEditing: false }); // Data to be edited
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);
  const [savingDirectoryMonitoring, setSavingDirectoryMonitoring] = useState(false); // Flag to indicate if directory monitoring is being saved
  const [erroneousTabs, setErroneousTabs] = useState([]); // Tabs with erroneous fields
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [bulkApprovalModalVisibility, setBulkApprovalModalVisibility] = useState(false);
  const [directory, setDirectory] = useState(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (editingData?.isEditing || copying) {
      form.setFieldsValue(selectedMonitoring);
      setSelectedCluster(clusters.find((c) => c.id === selectedMonitoring.clusterId));

      form.setFieldsValue({
        ...selectedMonitoring?.metaData?.notificationMetaData,

        expectedMoveByTime: selectedMonitoring?.metaData?.expectedMoveByTime
          ? dayjs(selectedMonitoring?.metaData?.expectedMoveByTime, 'HH:mm')
          : null,
        minimumFileCount: selectedMonitoring?.metaData?.minimumFileCount,
        maximumFileCount: selectedMonitoring?.metaData?.maximumFileCount,
      });
      if (selectedMonitoring.metaData.schedule) {
        const { schedule } = selectedMonitoring.metaData;
        if (schedule.length > 0) {
          const { frequency } = schedule[0];
          if (frequency === 'cron') {
            setCron(schedule[0].cron);
            setIntermittentScheduling({ frequency: schedule[0].frequency });
          } else if (frequency === 'daily' || frequency === 'weekly') {
            setIntermittentScheduling(schedule[0]);
          } else {
            setCompleteSchedule(schedule);
            setIntermittentScheduling({ frequency: schedule[0].frequency });
          }
        }
      }
    }
  }, [editingData, copying]);

  // Get all teams hook,
  useEffect(() => {
    (async () => {
      try {
        const allTeamsHook = await getAllTeamsHook();
        setTeamsHook(allTeamsHook);
      } catch (error) {
        message.error('Error fetching teams hook');
      }
    })();

    (async () => {
      try {
        const allDirectoryMonitorings = await getAllDirectoryMonitorings({ applicationId });

        setDirectoryMonitorings(allDirectoryMonitorings);
      } catch (error) {
        message.error('Error fetching directory monitorings');
      }
    })();
  }, []);

  const handleAddDirectoryMonitoringButtonClick = () => {
    setDisplayAddEditModal(true);
  };

  const handleSaveDirectoryMonitoring = async () => {
    setSavingDirectoryMonitoring(true);
    let validForm = true;

    // Validate from and set validForm to false if any field is invalid
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    //Check if schedule is valid
    const directorySchedule = checkScheduleValidity({ intermittentScheduling, completeSchedule, cron, cronMessage });

    // Error message need to be set for schedule because it is not part of from instance
    if (!directorySchedule.valid) {
      setErroneousScheduling(true);
      validForm = false;
    } else {
      setErroneousScheduling(false);
    }

    // Identify erroneous tabs
    const erroneousFields = form
      .getFieldsError()
      .filter((f) => f.errors.length > 0)
      .map((f) => f.name[0]);
    const badTabs = identifyErroneousTabs({ erroneousFields });
    if (!badTabs.includes('1') && !directorySchedule.valid) {
      badTabs.push('1');
    }
    if (badTabs.length > 0) {
      setErroneousTabs(badTabs);
    }

    // If form is invalid or schedule is invalid return
    if (!validForm) {
      setSavingDirectoryMonitoring(false);
      return;
    }

    try {
      //All inputs
      let userFieldInputs = form.getFieldsValue();

      // Group Notification specific metaData and delete from userFieldInputs
      const notificationMetaData = {};
      const { notificationCondition, teamsHooks, primaryContacts, secondaryContacts, notifyContacts } = userFieldInputs;
      const notificationSpecificFields = {
        notificationCondition,
        teamsHooks,
        primaryContacts,
        secondaryContacts,
        notifyContacts,
      };
      for (let key in notificationSpecificFields) {
        if (notificationSpecificFields[key] !== undefined) {
          notificationMetaData[key] = notificationSpecificFields[key];
        }
        delete userFieldInputs[key];
      }

      // Add expectedCompletionTime to metaData if entered, delete from userFieldInputs
      const metaData = {};

      let { expectedMoveByTime, maximumFileCount, minimumFileCount } = userFieldInputs;

      if (maximumFileCount) {
        metaData.maximumFileCount = maximumFileCount;
      }
      delete userFieldInputs.maximumFileCount;
      if (minimumFileCount) {
        metaData.minimumFileCount = minimumFileCount;
      }
      delete userFieldInputs.minimumFileCount;

      if (expectedMoveByTime) {
        // Format expectedCompletionTime and expectcfedStartTime
        metaData.expectedMoveByTime = expectedMoveByTime.format('HH:mm');
      }
      delete userFieldInputs.expectedMoveByTime;

      const userDetails = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      metaData.notificationMetaData = notificationMetaData;

      if (directorySchedule.schedule.length > 0) {
        metaData.schedule = directorySchedule.schedule;

        if (directorySchedule.schedule[0]?.cron) {
          userFieldInputs.cron = directorySchedule.schedule[0].cron;
        }
      }

      //Add metaData to userFieldInputs
      userFieldInputs = { ...userFieldInputs, metaData };

      console.log(userFieldInputs);

      //data transformations necessary for submitting
      userFieldInputs.directory = userFieldInputs.dirToMonitor.join('/');
      userFieldInputs['application_id'] = applicationId;
      userFieldInputs.type = 'directory';
      userFieldInputs.active = false;
      userFieldInputs.approved = false;
      userFieldInputs.createdBy = userDetails;
      userFieldInputs.updatedBy = userDetails;

      const responseData = await createDirectoryMonitoring({ inputData: userFieldInputs });
      setDirectoryMonitorings([responseData, ...directoryMonitorings]);
      console.log(responseData);
      message.success('Directory monitoring saved successfully');

      // Rest states and Close model if saved successfully
      resetStates();
      setDisplayAddEditModal(false);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingDirectoryMonitoring(false);
    }
  };

  const handleUpdateDirectoryMonitoring = async () => {};

  const resetStates = () => {
    setIntermittentScheduling({
      frequency: 'daily',
      id: uuidv4(),
      runWindow: 'daily',
    });
    setCompleteSchedule([]);
    setDisplayAddEditModal(false);
    setSelectedMonitoring(null);
    setEditingData({ isEditing: false });
    setErroneousTabs([]);
    setErroneousScheduling(false);
    setSelectedCluster(null);
    setActiveTab('0');
    setCron('');
    form.resetFields();
  };

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
            setBulkApprovalModalVisibility={setBulkApprovalModalVisibility}
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
        directory={directory}
        setDirectory={setDirectory}
        copying={copying}
        setCopying={setCopying}
        selectedMonitoring={selectedMonitoring}
      />
      <DirectoryMonitoringTable
        directoryMonitorings={directoryMonitorings}
        setDirectoryMonitorings={setDirectoryMonitorings}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddEditModal={setDisplayAddEditModal}
        setEditingData={setEditingData}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        applicationId={applicationId}
        setSelectedRows={setSelectedRows}
        setCopying={setCopying}
      />
      <ViewDetailsModal
        displayViewDetailsModal={displayViewDetailsModal}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={clusters}
        teamsHooks={teamsHooks}
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
          directoryMonitorings={directoryMonitorings}
          setDirectoryMonitorings={setDirectoryMonitorings}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
        />
      )}
      {bulkApprovalModalVisibility && (
        <BulkApprovalModal
          bulkApprovalModalVisibility={bulkApprovalModalVisibility}
          setBulkApprovalModalVisibility={setBulkApprovalModalVisibility}
          directoryMonitorings={directoryMonitorings}
          setDirectoryMonitorings={setDirectoryMonitorings}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          applicationId={applicationId}
          user={user}
        />
      )}
    </>
  );
};

export default DirectoryMonitoring;
