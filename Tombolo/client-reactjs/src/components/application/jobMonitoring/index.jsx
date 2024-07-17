import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Form, message } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import JobMonitoringActionButton from './JobMonitoringActionButton.jsx';
import AddEditJobMonitoringModal from './AddEditJobMonitoringModal.jsx';
import './jobMonitoring.css';
import {
  createJobMonitoring,
  getAllJobMonitorings,
  checkScheduleValidity,
  identifyErroneousTabs,
  getDomains,
  getProductCategories,
  getAllProductCategories,
  getMonitoringTypeId,
  updateSelectedMonitoring,
  isScheduleUpdated,
} from './jobMonitoringUtils.js';
import JobMonitoringTable from './JobMonitoringTable.jsx';
import MonitoringDetailsModal from './MonitoringDetailsModal.jsx';
import ApproveRejectModal from './ApproveRejectModal.jsx';
import BulkUpdateModal from './BulkUpdateModal.jsx';
import BreadCrumbs from '../../common/BreadCrumbs';
import JobMonitoringFilters from './JobMonitoringFilters.jsx';

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
  const [filteredJobMonitoring, setFilteredJobMonitoring] = useState([]); // Filtered job monitorings
  const [displayMonitoringDetailsModal, setDisplayMonitoringDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [editingData, setEditingData] = useState({ isEditing: false }); // Data to be edited
  const [duplicatingData, setDuplicatingData] = useState({ isDuplicating: false }); // JM to be duplicated
  const [monitoringScope, setMonitoringScope] = useState(null); // ClusterWideMonitoring or ClusterSpecificMonitoring
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);
  const [savingJobMonitoring, setSavingJobMonitoring] = useState(false); // Flag to indicate if job monitoring is being saved
  const [erroneousTabs, setErroneousTabs] = useState([]); // Tabs with erroneous fields
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [domains, setDomains] = useState([]);
  const [productCategories, setProductCategories] = useState([]); // Product categories for selected domain
  const [allProductCategories, setAllProductCategories] = useState([]); // All product categories - regardless of domain
  const [monitoringTypeId, setMonitoringTypeId] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [filters, setFilters] = useState({});
  const [filtersVisible, setFiltersVisible] = useState(true);

  // Create form instance
  const [form] = Form.useForm();

  //When component mounts and appid change get all job monitorings
  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const allMonitorings = await getAllJobMonitorings({ applicationId });
        setJobMonitorings(allMonitorings);
        setFilteredJobMonitoring(allMonitorings);
      } catch (error) {
        message.error('Error fetching job monitorings');
      }
    })();

    (async () => {
      try {
        const allProducts = await getAllProductCategories();
        setAllProductCategories(allProducts);
      } catch (error) {
        message.error('Error fetching list of all products categories');
      }
    })();
  }, [applicationId]);

  //When intention to edit a monitoring is discovered
  useEffect(() => {
    if (editingData?.isEditing || duplicatingData?.isDuplicating) {
      form.setFieldsValue(selectedMonitoring);
      setMonitoringScope(selectedMonitoring.monitoringScope);
      setSelectedCluster(clusters.find((c) => c.id === selectedMonitoring.clusterId));

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
  }, [editingData, duplicatingData]);

  // Get all teams hook, monitoring type ID, Filters from local storage
  useEffect(() => {
    // Get monitoringType id for job monitoring
    (async () => {
      try {
        const monitoringTypeId = await getMonitoringTypeId({ monitoringTypeName });
        setMonitoringTypeId(monitoringTypeId);
      } catch (error) {
        message.error('Error fetching monitoring type ID');
      }
    })();

    // Get filters from local storage
    const existingFiltersFromLocalStorage = localStorage.getItem('jMFilters');
    if (existingFiltersFromLocalStorage) {
      const filtersFromLocalStorage = JSON.parse(existingFiltersFromLocalStorage);
      setFilters(filtersFromLocalStorage);
    }
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

  // When filterChange filter the job monitorings
  useEffect(() => {
    if (jobMonitorings.length === 0) return;
    if (Object.keys(filters).length < 1) return;
    const { approvalStatus, activeStatus, domain, frequency, product } = filters;

    // Convert activeStatus to boolean
    let activeStatusBool;
    if (activeStatus === 'Active') {
      activeStatusBool = true;
    } else if (activeStatus === 'Inactive') {
      activeStatusBool = false;
    }

    const filteredJobMonitorings = jobMonitorings.filter((jobMonitoring) => {
      let include = true;
      const currentDomain = jobMonitoring?.metaData?.asrSpecificMetaData?.domain;
      const currentProduct = jobMonitoring?.metaData?.asrSpecificMetaData?.productCategory;
      const currentFrequency = jobMonitoring?.metaData?.schedule[0]?.frequency;

      if (approvalStatus && jobMonitoring.approvalStatus !== approvalStatus) {
        include = false;
      }
      if (activeStatusBool !== undefined && jobMonitoring.isActive !== activeStatusBool) {
        include = false;
      }
      if (domain && currentDomain !== domain) {
        include = false;
      }

      if (product && currentProduct !== product) {
        include = false;
      }

      if (frequency && currentFrequency !== frequency) {
        include = false;
      }

      return include;
    });

    setFilteredJobMonitoring(filteredJobMonitorings);
  }, [filters, jobMonitorings]);

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
    setDuplicatingData({ isDuplicating: false });
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

  //Save new job monitoring
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
      const { notificationCondition, primaryContacts, secondaryContacts, notifyContacts } = allInputs;
      const notificationSpecificFields = {
        notificationCondition,
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
      delete allInputs.requireComplete;

      // Format expectedCompletionTime and expectedStartTime
      metaData.expectedCompletionTime = expectedCompletionTime.format('HH:mm');
      delete allInputs.expectedCompletionTime;
      metaData.expectedStartTime = expectedStartTime.format('HH:mm');
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

      allInputs.createdBy = userDetails;
      allInputs.lastUpdatedBy = userDetails;

      //Add asrSpecificMetaData, notificationMetaData to metaData object
      metaData.asrSpecificMetaData = asrSpecificMetaData;
      metaData.notificationMetaData = notificationMetaData;

      //Add metaData to allInputs
      allInputs = { ...allInputs, metaData };

      const responseData = await createJobMonitoring({ inputData: allInputs });
      setJobMonitorings([responseData, ...jobMonitorings]);
      message.success('Job monitoring saved successfully');

      // Rest states and Close model if saved successfully
      resetStates();
      setDisplayAddJobMonitoringModal(false);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingJobMonitoring(false);
    }
  };

  // Handle update existing monitoring
  const handleUpdateJobMonitoring = async () => {
    setSavingJobMonitoring(true);
    try {
      // Validate from and set validForm to false if any field is invalid
      let validForm = true;
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

      // Form fields
      const formFields = form.getFieldsValue();
      const fields = Object.keys(formFields);

      // Need to be checked separately, because the data is nested inside metaData object
      const asrSpecificFields = ['domain', 'productCategory', 'severity'];
      const metaDataFields = ['expectedCompletionTime', 'expectedStartTime', 'requireComplete'];
      const notificationMetaDataFields = [
        'primaryContacts',
        'secondaryContacts',
        'notifyContacts',
        'notificationCondition',
      ];

      // Identify the fields that were touched
      const touchedFields = [];
      fields.forEach((field) => {
        if (form.isFieldTouched(field)) {
          touchedFields.push(field);
        }
      });

      // Check if schedule is changed - it is not part of form instance
      const existingSchedule = selectedMonitoring?.metaData?.schedule || [];
      const scheduleChanged = isScheduleUpdated({ existingSchedule, newSchedule: jobSchedule.schedule });
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
        updatedData.metaData.schedule = jobSchedule.schedule;
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
        if (touchedMetaDataFields.includes('expectedCompletionTime')) {
          const expectedCompletionTime = form.getFieldValue('expectedCompletionTime');
          const newExpectedCompletionTime = expectedCompletionTime.format('HH:mm');
          updatedData.metaData.expectedCompletionTime = newExpectedCompletionTime;
        }

        if (touchedMetaDataFields.includes('expectedStartTime')) {
          const expectedStartTime = form.getFieldValue('expectedStartTime');
          const newExpectedStartTime = expectedStartTime.format('HH:mm');
          updatedData.metaData.expectedStartTime = newExpectedStartTime;
        }

        if (touchedMetaDataFields.includes('requireComplete')) {
          const requireComplete = form.getFieldValue('requireComplete');
          updatedData.metaData.requireComplete = requireComplete;
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
        (field) =>
          !asrSpecificFields.includes(field) &&
          !metaDataFields.includes(field) &&
          !notificationMetaDataFields.includes(field)
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
      await updateSelectedMonitoring({ updatedData });

      // If no error thrown set state with new data
      setJobMonitorings((prev) => {
        const updatedJobMonitorings = prev.map((jobMonitoring) => {
          updatedData.approvalStatus = 'Pending';
          updatedData.isActive = false;
          if (jobMonitoring.id === updatedData.id) {
            return updatedData;
          }
          return jobMonitoring;
        });
        return updatedJobMonitorings;
      });
      resetStates();
    } catch (err) {
      message.error('Failed to update job monitoring');
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
            setFiltersVisible={setFiltersVisible}
            filtersVisible={filtersVisible}
          />
        }
      />
      <JobMonitoringFilters
        jobMonitorings={jobMonitorings}
        setFilters={setFilters}
        filters={filters}
        domains={domains}
        productCategories={productCategories}
        allProductCategories={allProductCategories}
        setProductCategories={setProductCategories}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
      />
      <AddEditJobMonitoringModal
        displayAddJobMonitoringModal={displayAddJobMonitoringModal}
        setDisplayAddJobMonitoringModal={setDisplayAddJobMonitoringModal}
        handleSaveJobMonitoring={handleSaveJobMonitoring}
        handleUpdateJobMonitoring={handleUpdateJobMonitoring}
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
        setSelectedMonitoring={setSelectedMonitoring}
        monitoringScope={monitoringScope}
        setMonitoringScope={setMonitoringScope}
        savingJobMonitoring={savingJobMonitoring}
        jobMonitorings={jobMonitorings}
        setEditingData={setEditingData}
        isEditing={editingData?.isEditing}
        isDuplicating={duplicatingData?.isDuplicating}
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
        jobMonitorings={filteredJobMonitoring}
        setJobMonitorings={setJobMonitorings}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddJobMonitoringModal={setDisplayAddJobMonitoringModal}
        setEditingData={setEditingData}
        setDuplicatingData={setDuplicatingData}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        applicationId={applicationId}
        setSelectedRows={setSelectedRows}
        domains={domains}
        productCategories={productCategories}
        allProductCategories={allProductCategories}
      />
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={displayMonitoringDetailsModal}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={selectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={clusters}
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
          setSelectedRows={setSelectedRows}
        />
      )}
      ,
    </>
  );
}

export default JobMonitoring;
