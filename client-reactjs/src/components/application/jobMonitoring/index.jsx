/* eslint-disable unused-imports/no-unused-imports */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import JobMonitoringActionButton from './JobMonitoringActionButton.jsx';
import AddEditJobMonitoringModal from './AddEditJobMonitoringModal.jsx';
import './jobMonitoring.css';
import { authHeader } from '../../common/AuthHeader.js';
import {
  getAllJobMonitorings,
  checkScheduleValidity,
  getAllTeamsHook,
  identifyErroneousTabs,
  getDomains,
  getProductCategories,
  getMonitoringTypeId,
} from './jobMonitoringUtils.js';
import JobMonitoringTable from './JobMonitoringTable.jsx';
import MonitoringDetailsModal from './MonitoringDetailsModal.jsx';
import ApproveRejectModal from './ApproveRejectModal.jsx';
import BulkUpdateModal from './BulkUpdateModal.jsx';
import BreadCrumbs from '../../common/BreadCrumbs';

// Constants
const monitoringTypeName = 'Job Monitoring';

function JobMonitoring() {
  //Redux
  const {
    applicationReducer: {
      application: { applicationId },
    },
    authenticationReducer: { user },
    applicationReducer: { clusters },
  } = useSelector((state) => state);

  //Local States
  const [displayAddJobMonitoringModal, setDisplayAddJobMonitoringModal] = useState(false);
  const [intermittentScheduling, setIntermittentScheduling] = useState({
    frequency: 'daily',
    id: uuidv4(),
    runWindow: 'daily',
  });
  const [completeSchedule, setCompleteSchedule] = useState([]);
  const [cron, setCron] = useState('');
  const [cronMessage, setCronMessage] = useState(null); // Cron message to display when cron is invalid or has errors
  const [erroneousScheduling, setErroneousScheduling] = useState(false);
  const [jobMonitorings, setJobMonitorings] = useState([]);
  const [displayMonitoringDetailsModal, setDisplayMonitoringDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [teamsHooks, setTeamsHook] = useState([]);
  const [editingData, setEditingData] = useState({ isEditing: false }); // Data to be edited
  const [monitoringScope, setMonitoringScope] = useState(null); // ClusterWideMonitoring or ClusterSpecificMonitoring
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);
  const [savingJobMonitoring, setSavingJobMonitoring] = useState(false); // Flag to indicate if job monitoring is being saved
  const [erroneousTabs, setErroneousTabs] = useState([]); // Tabs with erroneous fields
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [domains, setDomains] = useState([]);
  const [productCategories, setProductCategories] = useState([]);
  const [monitoringTypeId, setMonitoringTypeId] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);

  // Create form instance
  const [form] = Form.useForm();

  //When component mounts and appid change get all job monitorings
  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const allMonitorings = await getAllJobMonitorings({ applicationId });
        setJobMonitorings(allMonitorings);
      } catch (error) {
        message.error('Error fetching job monitorings');
      }
    })();
  }, [applicationId]);

  //When intention to edit a monitoring is discovered
  useEffect(() => {
    if (editingData?.isEditing) {
      form.setFieldsValue(selectedMonitoring);
      setMonitoringScope(selectedMonitoring.monitoringScope);
      setSelectedCluster(selectedMonitoring.clusterId);

      // Convert to dayjs objects
      let expectedCompletionTime = selectedMonitoring?.metaData?.expectedCompletionTime;
      let expectedStartTime = selectedMonitoring?.metaData?.expectedStartTime;
      expectedCompletionTime = dayjs(expectedCompletionTime, 'HH:mm');
      expectedStartTime = dayjs(expectedStartTime, 'HH:mm');

      form.setFieldsValue({
        ...selectedMonitoring?.metaData?.asrSpecificMetaData,
        ...selectedMonitoring?.metaData?.notificationMetaData,
        requireComplete: selectedMonitoring.metaData.requireComplete,
        expectedCompletionTime,
        expectedStartTime,
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
  }, [editingData]);

  // Get all teams hook, monitoring type ID
  useEffect(() => {
    // Teams hook
    (async () => {
      try {
        const allTeamsHook = await getAllTeamsHook();
        setTeamsHook(allTeamsHook);
      } catch (error) {
        message.error('Error fetching teams hook');
      }
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

  // Function reset states when modal is closed
  const resetStates = () => {
    setIntermittentScheduling({
      frequency: 'daily',
      id: uuidv4(),
      runWindow: 'daily',
    });
    setCompleteSchedule([]);
    setDisplayAddJobMonitoringModal(false);
    setSelectedMonitoring(null);
    setEditingData({ isEditing: false });
    setMonitoringScope(null);
    setErroneousTabs([]);
    setErroneousScheduling(false);
    setSelectedCluster(null);
    setProductCategories([]);
    setActiveTab('0');
    setCron('');
    form.resetFields();
  };

  //When add button new job monitoring button clicked
  const handleAddJobMonitoringButtonClick = () => {
    setDisplayAddJobMonitoringModal(true);
  };

  //Save job monitoring
  const handleSaveJobMonitoring = async () => {
    setSavingJobMonitoring(true);
    let validForm = true;

    // Validate from and set validForm to false if any field is invalid
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    //Check if schedule is valid
    const jobSchedule = checkScheduleValidity({ intermittentScheduling, completeSchedule, cron, cronMessage });

    // Error message need to be set for schedule because it is not part of from instance
    if (!jobSchedule.valid) {
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
    if (!badTabs.includes('1') && !jobSchedule.valid) {
      badTabs.push('1');
    }
    if (badTabs.length > 0) {
      setErroneousTabs(badTabs);
    }

    // If form is invalid or schedule is invalid return
    if (!validForm) {
      setSavingJobMonitoring(false);
      return;
    }

    // If form is valid and schedule is valid save job monitoring
    try {
      //All inputs
      let allInputs = form.getFieldsValue();

      //If monitoring scope is cluster-wide jobName should be * -  As it is required field in DB
      const { monitoringScope } = allInputs;
      if (monitoringScope === 'ClusterWideMonitoring') {
        allInputs.jobName = '*';
      }

      // if editingData.isEditing is true, add id to allInputs
      if (editingData?.isEditing) {
        allInputs.id = selectedMonitoring.id;
      }

      // Group ASR specific metaData and delete from allInputs
      const asrSpecificMetaData = {};
      const { domain, productCategory, jobMonitorType, severity, requireComplete } = allInputs;
      const asrSpecificFields = { domain, productCategory, jobMonitorType, severity };
      for (let key in asrSpecificFields) {
        if (asrSpecificFields[key] !== undefined) {
          asrSpecificMetaData[key] = asrSpecificFields[key];
        }
        delete allInputs[key];
      }

      // Group Notification specific metaData and delete from allInputs
      const notificationMetaData = {};
      const { notificationCondition, teamsHooks, primaryContacts, secondaryContacts, notifyContacts } = allInputs;
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
        delete allInputs[key];
      }

      // Add expectedCompletionTime to metaData if entered, delete from allInputs
      const metaData = {};
      let { expectedStartTime, expectedCompletionTime } = allInputs;
      metaData.requireComplete = requireComplete;
      metaData.expectedCompletionTime = expectedCompletionTime.format('HH:mm');
      metaData.expectedStartTime = expectedStartTime.format('HH:mm');
      delete allInputs.requireComplete;
      delete allInputs.expectedCompletionTime;
      delete allInputs.expectedStartTime;

      // Add schedule to metaData if entered,
      // Note: cluster wide monitoring should not have schedule because work units can have varying schedules
      if (jobSchedule.schedule.length > 0 && monitoringScope !== 'ClusterWideMonitoring') {
        metaData.schedule = jobSchedule.schedule;
      }

      //Add applicationId, createdBy, lastUpdatedBy to allInputs
      allInputs.applicationId = applicationId;
      const userDetails = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      if (!editingData?.isEditing) {
        allInputs.createdBy = userDetails;
      }
      allInputs.lastUpdatedBy = userDetails;

      //Add asrSpecificMetaData, notificationMetaData to metaData object
      metaData.asrSpecificMetaData = asrSpecificMetaData;
      metaData.notificationMetaData = notificationMetaData;

      //Add metaData to allInputs
      allInputs = { ...allInputs, metaData };

      const payload = {
        method: editingData.isEditing ? 'PATCH' : 'POST',
        header: authHeader(),
        body: JSON.stringify(allInputs),
      };

      const response = await fetch(`/api/jobmonitoring`, payload);

      if (!response.ok) {
        return message.error('Failed to save job monitoring');
      }

      //Set newly added job monitoring to jobMonitorings
      const responseData = await response.json();

      if (editingData?.isEditing) {
        const updatedJobMonitorings = jobMonitorings.map((jobMonitoring) => {
          if (jobMonitoring.id === responseData.id) {
            return responseData;
          }
          return jobMonitoring;
        });
        setJobMonitorings(updatedJobMonitorings);
        message.success('Job monitoring updated successfully');
      } else {
        setJobMonitorings([responseData, ...jobMonitorings]);
        message.success('Job monitoring saved successfully');
      }

      // Toggle editingData to false
      if (editingData?.isEditing) {
        setEditingData({ isEditing: false });
      }

      // Rest states and Close model if saved successfully
      resetStates();
      setDisplayAddJobMonitoringModal(false);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingJobMonitoring(false);
    }
  };

  //JSX
  return (
    <>
      <BreadCrumbs
        extraContent={
          <JobMonitoringActionButton
            handleAddJobMonitoringButtonClick={handleAddJobMonitoringButtonClick}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            setJobMonitorings={setJobMonitorings}
            setBulkEditModalVisibility={setBulkEditModalVisibility}
          />
        }
      />
      <AddEditJobMonitoringModal
        displayAddJobMonitoringModal={displayAddJobMonitoringModal}
        setDisplayAddJobMonitoringModal={setDisplayAddJobMonitoringModal}
        handleSaveJobMonitoring={handleSaveJobMonitoring}
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
        monitoringScope={monitoringScope}
        setMonitoringScope={setMonitoringScope}
        savingJobMonitoring={savingJobMonitoring}
        jobMonitorings={jobMonitorings}
        setEditingData={setEditingData}
        isEditing={editingData?.isEditing}
        erroneousTabs={erroneousTabs}
        setErroneousTabs={setErroneousTabs}
        setErroneousScheduling={setErroneousScheduling}
        selectedCluster={selectedCluster}
        setSelectedCluster={setSelectedCluster}
        resetStates={resetStates}
        domains={domains}
        productCategories={productCategories}
        setSelectedDomain={setSelectedDomain}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <JobMonitoringTable
        jobMonitorings={jobMonitorings}
        setJobMonitorings={setJobMonitorings}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddJobMonitoringModal={setDisplayAddJobMonitoringModal}
        setEditingData={setEditingData}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        applicationId={applicationId}
        setSelectedRows={setSelectedRows}
      />
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
        setJobMonitorings={setJobMonitorings}
      />
      {bulkEditModalVisibility && (
        <BulkUpdateModal
          bulkEditModalVisibility={bulkEditModalVisibility}
          setBulkEditModalVisibility={setBulkEditModalVisibility}
          jobMonitorings={jobMonitorings}
          setJobMonitorings={setJobMonitorings}
          selectedRows={selectedRows}
        />
      )}
      ,
    </>
  );
}

export default JobMonitoring;
