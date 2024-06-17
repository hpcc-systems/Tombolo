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
  updateMonitoring,
  isScheduleUpdated,
  getMonitoringTypeId,
  getDomains,
  getProductCategories,
} from './Utils.js';

import AddEditModal from './AddEditModal/Modal';
import ActionButton from './ActionButton';
import DirectoryMonitoringTable from './Table';
import ApproveRejectModal from './ApproveRejectModal';
import dayjs from 'dayjs';
import BulkUpdateModal from './BulkUpdateModal.jsx';
import BulkApprovalModal from './BulkApprovalModal.jsx';
import ViewDetailsModal from './ViewDetailsModal';

const monitoringTypeName = 'Directory Monitoring';

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

  //asr specific
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [productCategories, setProductCategories] = useState([]);
  const [monitoringTypeId, setMonitoringTypeId] = useState(null);

  useEffect(() => {
    if (editingData?.isEditing || copying) {
      form.setFieldsValue(selectedMonitoring);

      setSelectedCluster(clusters.find((c) => c.id === selectedMonitoring.cluster_id));

      form.setFieldsValue({
        ...selectedMonitoring?.metaData?.notificationMetaData,
        ...selectedMonitoring?.metaData?.asrSpecificMetaData,
        expectedMoveByTime: selectedMonitoring?.metaData?.expectedMoveByTime
          ? dayjs(selectedMonitoring?.metaData?.expectedMoveByTime, 'HH:mm')
          : null,
        minimumFileCount: selectedMonitoring?.metaData?.minimumFileCount,
        maximumFileCount: selectedMonitoring?.metaData?.maximumFileCount,
        dirToMonitor: selectedMonitoring.directory.split('/'),
        pattern: selectedMonitoring?.metaData?.pattern,
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
      fetchAllDirectoryMonitorings();
    })();

    // Get monitoringType id for job monitoring
    (async () => {
      try {
        const monitoringTypeId = await getMonitoringTypeId({ monitoringTypeName });
        setMonitoringTypeId(monitoringTypeId);
      } catch (error) {
        message.error('Error fetching monitoring type ID');
      }
    })();
  }, []);

  // Get domains and product categories
  useEffect(() => {
    // Get domains
    if (!monitoringTypeId) return;
    (async () => {
      try {
        let domainData = await getDomains({ monitoringTypeId });
        domainData = domainData.map((d) => ({
          label: d.name,
          value: d.id,
        }));
        setDomains(domainData);
      } catch (error) {
        message.error('Error fetching domains');
      }
    })();

    // If monitoring selected - set selected domain so corresponding product categories can be fetched
    if (selectedMonitoring?.metaData?.asrSpecificMetaData?.domain) {
      setSelectedDomain(selectedMonitoring.metaData.asrSpecificMetaData.domain);
    }

    // Get product categories
    if (!selectedDomain) return;
    (async () => {
      try {
        const productCategories = await getProductCategories({ domainId: selectedDomain });
        const formattedProductCategories = productCategories.map((c) => ({
          label: `${c.name} (${c.shortCode})`,
          value: c.id,
        }));
        setProductCategories(formattedProductCategories);
      } catch (error) {
        message.error('Error fetching product category');
      }
    })();
  }, [monitoringTypeId, selectedDomain, selectedMonitoring]);

  const handleAddDirectoryMonitoringButtonClick = () => {
    setDisplayAddEditModal(true);
  };

  const fetchAllDirectoryMonitorings = async () => {
    try {
      const allDirectoryMonitorings = await getAllDirectoryMonitorings({ applicationId });
      setDirectoryMonitorings(allDirectoryMonitorings);
    } catch (error) {
      message.error('Error fetching directory monitorings');
    }
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

      // Group ASR specific metaData and delete from allInputs
      const asrSpecificMetaData = {};
      const { domain, productCategory, severity } = userFieldInputs;
      const asrSpecificFields = { domain, productCategory, severity };
      for (let key in asrSpecificFields) {
        if (asrSpecificFields[key] !== undefined) {
          asrSpecificMetaData[key] = asrSpecificFields[key];
        }
        delete userFieldInputs[key];
      }

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
      metaData.asrSpecificMetaData = asrSpecificMetaData;

      if (directorySchedule.schedule.length > 0) {
        metaData.schedule = directorySchedule.schedule;

        if (directorySchedule.schedule[0]?.cron) {
          userFieldInputs.cron = directorySchedule.schedule[0].cron;
        }
      }

      if (userFieldInputs.pattern) {
        metaData.pattern = userFieldInputs.pattern;
        delete userFieldInputs.pattern;
      }

      //Add metaData to userFieldInputs
      userFieldInputs = { ...userFieldInputs, metaData };

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

  const handleUpdateDirectoryMonitoring = async () => {
    setSavingDirectoryMonitoring(true);
    try {
      // Validate from and set validForm to false if any field is invalid
      let validForm = true;
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

      // Form fields
      const formFields = form.getFieldsValue();
      const fields = Object.keys(formFields);

      const metaDataFields = ['pattern', 'expectedMoveByTime', 'minimumFileCount', 'maximumFileCount'];
      const notificationMetaDataFields = [
        'teamsHooks',
        'primaryContacts',
        'secondaryContacts',
        'notifyContacts',
        'notificationCondition',
      ];
      const asrSpecificFields = ['domain', 'productCategory', 'severity'];

      // Identify the fields that were touched
      const touchedFields = [];
      fields.forEach((field) => {
        if (form.isFieldTouched(field)) {
          touchedFields.push(field);
        }
      });

      // Check if schedule is changed - it is not part of form instance
      const existingSchedule = selectedMonitoring?.metaData?.schedule || [];
      const scheduleChanged = isScheduleUpdated({ existingSchedule, newSchedule: directorySchedule.schedule });
      if (scheduleChanged) {
        touchedFields.push('schedule');
      }

      // If no touched fields
      if (touchedFields.length === 0) {
        return message.error('No changes detected');
      }

      // updated monitoring
      let updatedData = { ...selectedMonitoring };

      // Add schedule to metaData if altered
      if (touchedFields.includes('schedule')) {
        updatedData.metaData.schedule = directorySchedule.schedule;
      }

      //Touched ASR fields
      const touchedAsrFields = touchedFields.filter((field) => asrSpecificFields.includes(field));

      const touchedMetaDataFields = touchedFields.filter((field) => metaDataFields.includes(field));
      const touchedNotificationMetaDataFields = touchedFields.filter((field) =>
        notificationMetaDataFields.includes(field)
      );

      // update selected monitoring with asr specific fields that are nested inside metaData > asrSpecificMetaData
      if (touchedAsrFields.length > 0) {
        let existingAsrSpecificMetaData = selectedMonitoring?.metaData?.asrSpecificMetaData || {};
        const upDatedAsrSpecificMetaData = form.getFieldsValue(touchedAsrFields);
        const newAsrSpecificFields = { ...existingAsrSpecificMetaData, ...upDatedAsrSpecificMetaData };
        updatedData.metaData.asrSpecificMetaData = newAsrSpecificFields;
      }

      // update selected monitoring with run time fields that are nested inside metaData
      if (touchedMetaDataFields.length > 0) {
        if (touchedMetaDataFields.includes('expectedMoveByTime')) {
          const expectedMoveByTime = form.getFieldValue('expectedMoveByTime');
          const newExpectedMoveByTime = expectedMoveByTime.format('HH:mm');
          updatedData.metaData.expecteMoveByTime = newExpectedMoveByTime;
        }

        if (touchedMetaDataFields.includes('pattern')) {
          const pattern = form.getFieldValue('pattern');
          updatedData.metaData.pattern = pattern;
        }

        if (touchedMetaDataFields.includes('minimumFileCount')) {
          const minimumFileCount = form.getFieldValue('minimumFileCount');
          updatedData.metaData.minimumFileCount = minimumFileCount;
        }

        if (touchedMetaDataFields.includes('maximumFileCount')) {
          const maximumFileCount = form.getFieldValue('maximumFileCount');
          updatedData.metaData.maximumFileCount = maximumFileCount;
        }
      }

      // update selected monitoring with notificationMetaData fields that are nested inside metaData
      if (touchedNotificationMetaDataFields.length > 0) {
        const existingNotificationMetaData = selectedMonitoring.metaData.notificationMetaData || {};
        const updatedNotificationMetaData = form.getFieldsValue(touchedNotificationMetaDataFields);
        const newNotificationMetaData = { ...existingNotificationMetaData, ...updatedNotificationMetaData };
        updatedData.metaData.notificationMetaData = newNotificationMetaData;
      }

      // new values of any other fields that are not part of asrFields, metaDataFields, notificationMetaDataFields
      const otherFields = fields.filter(
        (field) => !metaDataFields.includes(field) && !notificationMetaDataFields.includes(field)
      );

      // Update other fields
      const otherFieldsValues = form.getFieldsValue(otherFields);
      const newOtherFields = { ...selectedMonitoring, ...otherFieldsValues };
      updatedData = { ...updatedData, ...newOtherFields };

      // updated by
      const userDetails = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });
      updatedData.lastUpdatedBy = userDetails;

      // Make api call
      await updateMonitoring({ updatedData });

      // If no error thrown set state with new data
      fetchAllDirectoryMonitorings();

      message.success('Directory monitoring saved successfully');

      resetStates();
    } catch (err) {
      message.error('Failed to update directory monitoring');
    } finally {
      setSavingDirectoryMonitoring(false);
    }
  };

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
    setCopying(false);
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
            directoryMonitorings={directoryMonitorings}
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
        domains={domains}
        productCategories={productCategories}
        setSelectedDomain={setSelectedDomain}
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
          fetchAllDirectoryMonitorings={fetchAllDirectoryMonitorings}
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
