import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';

import AddJobMonitoringBtn from './AddJobMonitoringBtn.jsx';
import AddEditJobMonitoringModal from './AddEditJobMonitoringModal.jsx';
import './jobMonitoring.css';
import { authHeader } from '../../common/AuthHeader.js';
import {
  getAllJobMonitorings,
  checkScheduleValidity,
  getAllTeamsHook,
  identifyErroneousTabs,
} from './jobMonitoringUtils.js';
import JobMonitoringTable from './JobMonitoringTable.jsx';
import MonitoringDetailsModal from './MonitoringDetailsModal.jsx';
import ApproveRejectModal from './ApproveRejectModal.jsx';

function JobMonitoring() {
  //Local States
  const [displayAddJobMonitoringModal, setDisplayAddJobMonitoringModal] = useState(false);
  const [intermittentScheduling, setIntermittentScheduling] = useState({ schedulingType: 'daily', id: uuidv4() });
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

  //Redux
  const {
    applicationReducer: {
      application: { applicationId },
    },
    authenticationReducer: { user },
    applicationReducer: { clusters },
  } = useSelector((state) => state);

  //When component mounts get all teams hook
  useEffect(() => {
    //Get all teams hook
    (async () => {
      try {
        const allTeamsHook = await getAllTeamsHook();
        setTeamsHook(allTeamsHook);
      } catch (error) {
        message.error('Error fetching teams hook');
      }
    })();

    // Get all job monitorings
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
    if (editingData.isEditing) {
      form.setFieldsValue(selectedMonitoring);
      setMonitoringScope(selectedMonitoring.monitoringScope);
      form.setFieldsValue({
        threshold: selectedMonitoring?.metaData?.threshold,
        ...selectedMonitoring?.metaData?.asrSpecificMetaData,
        ...selectedMonitoring?.metaData?.notificationMetaData,
      });
      if (selectedMonitoring.metaData.schedule) {
        const { schedule } = selectedMonitoring.metaData;
        if (schedule.length > 0) {
          const { schedulingType } = schedule[0];
          if (schedulingType === 'cron') {
            setCron(schedule[0].cron);
          } else if (schedulingType === 'daily' || schedulingType === 'weekly') {
            setIntermittentScheduling(schedule[0]);
          } else {
            setCompleteSchedule(schedule);
            setIntermittentScheduling({ schedulingType: schedule[0].schedulingType });
          }
        }
      }
    }
  }, [editingData]);

  // Create form instance
  const [form] = Form.useForm();

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
      if (editingData.isEditing) {
        allInputs.id = selectedMonitoring.id;
      }

      // Group ASR specific metaData and delete from allInputs
      const asrSpecificMetaData = {};
      const { domain, productCategory, jobMonitorType, severity, requireComplete } = allInputs;
      const asrSpecificFields = { domain, productCategory, jobMonitorType, severity, requireComplete };
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

      // Add threshold to metaData if entered, delete from allInputs
      const metaData = {};
      if (allInputs.threshold) {
        metaData.threshold = allInputs.threshold;
      }
      delete allInputs.threshold;

      // Add schedule to metaData if entered,
      // Note: cluster wide monitoring should not have schedule because work units can have varying schedules
      if (jobSchedule.schedule.length > 0 && monitoringScope !== 'ClusterWideMonitoring') {
        console.log('jobSchedule.schedule', jobSchedule.schedule);
        metaData.schedule = jobSchedule.schedule;
      }

      //Add applicationId, createdBy, lastUpdatedBy to allInputs
      allInputs.applicationId = applicationId;
      const userDetails = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });
      allInputs.createdBy = userDetails;
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

      if (editingData.isEditing) {
        const updatedJobMonitorings = jobMonitorings.map((jobMonitoring) => {
          if (jobMonitoring.id === responseData.id) {
            return responseData;
          }
          return jobMonitoring;
        });
        setJobMonitorings(updatedJobMonitorings);
        message.success('Job monitoring updated successfully');
      } else {
        setJobMonitorings([...jobMonitorings, responseData]);
        message.success('Job monitoring saved successfully');
      }
      // Close model if saved successfully
      setDisplayAddJobMonitoringModal(false);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingJobMonitoring(false);
      if (editingData.isEditing) {
        setEditingData({ isEditing: false });
      }
    }
  };

  //JSX
  return (
    <>
      <AddJobMonitoringBtn handleAddJobMonitoringButtonClick={handleAddJobMonitoringButtonClick} />
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
        isEditing={editingData.isEditing}
        erroneousTabs={erroneousTabs}
        setErroneousTabs={setErroneousTabs}
        setErroneousScheduling={setErroneousScheduling}
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
      />
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={displayMonitoringDetailsModal}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
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
        setJobMonitorings={setJobMonitorings}
      />
    </>
  );
}

export default JobMonitoring;
