import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, message } from 'antd';

import CostMonitoringActionButton from './CostMonitoringActionButton';
import AddEditCostMonitoringModal from './AddEditCostMonitoringModal';
import './costMonitoring.css';
import {
  createCostMonitoring,
  getAllCostMonitorings,
  handleBulkUpdateCostMonitorings,
  updateSelectedCostMonitoring,
} from './costMonitoringUtils';

import { identifyErroneousTabs } from '../jobMonitoring/jobMonitoringUtils';

import { getRoleNameArray } from '../../common/AuthUtil';
import CostMonitoringTable from './CostMonitoringTable';
import CostMonitoringDetailsModal from './CostMonitoringDetailsModal';
import CostMonitoringApproveRejectModal from './ApproveRejectModal';
import BreadCrumbs from '../../common/BreadCrumbs';
import CostMonitoringFilters from './CostMonitoringFilters';
import { getUser } from '../../common/userStorage';
import BulkUpdateModal from '../../common/BulkUpdateModal';

function CostMonitoring() {
  // Redux
  const {
    applicationReducer: {
      application: { applicationId },
      clusters,
    },
  } = useSelector((state) => state);

  const user = getUser();

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  // Local States
  const [displayAddCostMonitoringModal, setDisplayAddCostMonitoringModal] = useState(false);
  const [costMonitorings, setCostMonitorings] = useState([]);
  const [filteredCostMonitoring, setFilteredCostMonitoring] = useState([]); // Filtered cost monitorings
  const [displayMonitoringDetailsModal, setDisplayMonitoringDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [editingData, setEditingData] = useState({ isEditing: false }); // Data to be edited
  const [duplicatingData, setDuplicatingData] = useState({ isDuplicating: false }); // CM to be duplicated
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);
  const [savingCostMonitoring, setSavingCostMonitoring] = useState(false); // Flag to indicate if cost monitoring is being saved
  const [erroneousTabs, setErroneousTabs] = useState([]); // Tabs with erroneous fields
  const [selectedClusters, setSelectedClusters] = useState([]); // Selected clusters for cost monitoring
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [filters, setFilters] = useState({});
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filteringCosts, setFilteringCosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);

  // Create form instance
  const [form] = Form.useForm();

  // When component mounts and appid change get all cost monitorings
  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      try {
        const allMonitorings = await getAllCostMonitorings({ applicationId });
        setCostMonitorings(allMonitorings.data);
      } catch (error) {
        message.error('Error fetching cost monitorings');
      }
    })();
  }, [applicationId]);

  // When intention to edit a monitoring is discovered
  useEffect(() => {
    if (editingData?.isEditing || duplicatingData?.isDuplicating) {
      form.setFieldsValue(selectedMonitoring);
      setSelectedClusters(selectedMonitoring.clusterIds || []);

      // Set form values from metadata
      form.setFieldsValue({
        ...selectedMonitoring?.metaData?.notificationMetaData,
        ...selectedMonitoring?.metaData,
        clusterIds: selectedMonitoring.clusterIds,
        users: selectedMonitoring?.metaData?.users,
        threshold: selectedMonitoring?.metaData?.notificationMetaData?.notificationCondition,
        timeWindow: selectedMonitoring?.metaData?.timeWindow,
      });
    }
  }, [editingData, duplicatingData, selectedMonitoring]);

  // Get filters from local storage
  useEffect(() => {
    const existingFiltersFromLocalStorage = localStorage.getItem('cMFilters');
    if (existingFiltersFromLocalStorage) {
      const filtersFromLocalStorage = JSON.parse(existingFiltersFromLocalStorage);
      setFilters(filtersFromLocalStorage);
    }

    // Get filter visibility from local storage
    const filtersVisibilityFromLocalStorage = localStorage.getItem('cMFiltersVisible');
    if (filtersVisibilityFromLocalStorage !== null) {
      setFiltersVisible(JSON.parse(filtersVisibilityFromLocalStorage));
    }
  }, []);

  // When filter changes, filter the cost monitorings
  useEffect(() => {
    setFilteringCosts(true);
    if (costMonitorings.length === 0) {
      setFilteringCosts(false);
      return;
    }

    const { approvalStatus, activeStatus, clusters: filterClusters } = filters;

    // Convert activeStatus to boolean
    let activeStatusBool;
    if (activeStatus === 'Active') {
      activeStatusBool = true;
    } else if (activeStatus === 'Inactive') {
      activeStatusBool = false;
    }

    let filteredCm = costMonitorings.filter((costMonitoring) => {
      let include = true;

      if (approvalStatus && costMonitoring.approvalStatus !== approvalStatus) {
        include = false;
      }
      if (activeStatusBool !== undefined && costMonitoring.isActive !== activeStatusBool) {
        include = false;
      }
      if (filterClusters && filterClusters.length > 0) {
        const hasMatchingCluster = costMonitoring.clusterIds?.some((clusterId) => filterClusters.includes(clusterId));
        if (!hasMatchingCluster) {
          include = false;
        }
      }

      return include;
    });

    const matchedCostIds = [];

    // Calculate the number of matched string instances
    if (searchTerm) {
      let instanceCount = 0;
      filteredCm.forEach((cost) => {
        const monitoringName = cost.monitoringName.toLowerCase();
        const description = cost.description?.toLowerCase() || '';

        if (monitoringName.includes(searchTerm.toLowerCase())) {
          matchedCostIds.push(cost.id);
          instanceCount++;
        }

        if (description.includes(searchTerm.toLowerCase())) {
          matchedCostIds.push(cost.id);
          instanceCount++;
        }
      });

      setMatchCount(instanceCount);
    } else {
      setMatchCount(0);
    }

    if (matchedCostIds.length > 0) {
      filteredCm = filteredCm.filter((cost) => matchedCostIds.includes(cost.id));
    } else if (matchedCostIds.length === 0 && searchTerm) {
      filteredCm = [];
    }

    setFilteredCostMonitoring(filteredCm);
    setFilteringCosts(false);
  }, [filters, costMonitorings, searchTerm]);

  // Function reset states when modal is closed
  const resetStates = () => {
    setDisplayAddCostMonitoringModal(false);
    setSelectedMonitoring(null);
    setEditingData({ isEditing: false });
    setDuplicatingData({ isDuplicating: false });
    setErroneousTabs([]);
    setSelectedClusters([]);
    setActiveTab('0');
    form.resetFields();
  };

  // When add button new cost monitoring button clicked
  const handleAddCostMonitoringButtonClick = () => {
    setDisplayAddCostMonitoringModal(true);
  };

  // Save new cost monitoring
  const handleSaveCostMonitoring = async () => {
    setSavingCostMonitoring(true);
    let validForm = true;

    // Validate form and set validForm to false if any field is invalid
    try {
      await form.validateFields();
    } catch (err) {
      validForm = false;
    }

    // Identify erroneous tabs
    const erroneousFields = form
      .getFieldsError()
      .filter((f) => f.errors.length > 0)
      .map((f) => f.name[0]);
    const badTabs = identifyErroneousTabs({ erroneousFields });
    if (badTabs.length > 0) {
      setErroneousTabs(badTabs);
    }

    // If form is invalid return
    if (!validForm) {
      setSavingCostMonitoring(false);
      return;
    }

    // If form is valid save cost monitoring
    try {
      // All inputs
      let allInputs = form.getFieldsValue();

      // Trim the input values
      Object.entries(allInputs).forEach(([key, value]) => {
        if (typeof value === 'string') {
          allInputs[key] = value.trim();
        }
      });

      // Group Notification specific metaData and delete from allInputs
      const notificationMetaData = {};
      const { threshold, primaryContacts, secondaryContacts, notifyContacts } = allInputs;
      const notificationSpecificFields = {
        notificationCondition: threshold,
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

      // Create metaData object
      const metaData = {};
      const { users } = allInputs;

      // Add cost monitoring specific fields to metaData
      if (users) metaData.users = users;
      // Remove these from allInputs as they belong in metaData
      delete allInputs.users;
      delete allInputs.threshold;
      delete allInputs.timeWindow;

      // Add applicationId, createdBy, lastUpdatedBy to allInputs
      allInputs.applicationId = applicationId;
      const userDetails = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      allInputs.createdBy = userDetails;
      allInputs.lastUpdatedBy = userDetails;

      // Add notificationMetaData to metaData object
      metaData.notificationMetaData = notificationMetaData;

      // Add metaData to allInputs
      allInputs = { ...allInputs, metaData, approvalStatus: 'Pending', isActive: false };

      const responseData = await createCostMonitoring({ inputData: allInputs });

      setCostMonitorings([responseData.data, ...costMonitorings]);
      message.success('Cost monitoring saved successfully');

      // Reset states and Close modal if saved successfully
      resetStates();
      setDisplayAddCostMonitoringModal(false);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingCostMonitoring(false);
    }
  };

  const handleClusterChange = (selectedClusterIds) => {
    setSelectedClusters(selectedClusterIds);
    // Update form field value to keep the form in sync
    form.setFieldsValue({ clusterIds: selectedClusterIds });
  };

  // Handle updates to existing monitoring
  const handleUpdateCostMonitoring = async () => {
    setSavingCostMonitoring(true);
    try {
      // Validate form and set validForm to false if any field is invalid
      let validForm = true;
      try {
        await form.validateFields();
      } catch (err) {
        validForm = false;
      }

      // Identify erroneous tabs
      const erroneousFields = form
        .getFieldsError()
        .filter((f) => f.errors.length > 0)
        .map((f) => f.name[0]);
      const badTabs = identifyErroneousTabs({ erroneousFields });
      if (badTabs.length > 0) {
        setErroneousTabs(badTabs);
      }

      // If form is invalid return
      if (!validForm) {
        setSavingCostMonitoring(false);
        return;
      }

      // Form fields
      const formFields = form.getFieldsValue();
      const fields = Object.keys(formFields);

      // Fields that are nested inside the metaData object
      const metaDataFields = ['users', 'threshold', 'timeWindow'];
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

      // If no touched fields
      if (touchedFields.length === 0) {
        return message.error('No changes detected');
      }

      // Updated monitoring
      let updatedData = { ...selectedMonitoring };

      // Update metaData fields
      const touchedMetaDataFields = touchedFields.filter((field) => metaDataFields.includes(field));
      const touchedNotificationMetaDataFields = touchedFields.filter((field) =>
        notificationMetaDataFields.includes(field)
      );

      // Update cost monitoring specific metaData fields
      if (touchedMetaDataFields.length > 0) {
        const existingMetaData = selectedMonitoring?.metaData || {};
        const updatedMetaDataValues = form.getFieldsValue(touchedMetaDataFields);
        updatedData.metaData = { ...existingMetaData, ...updatedMetaDataValues };
      }

      // Update notification metaData fields
      if (touchedNotificationMetaDataFields.length > 0) {
        const existingNotificationMetaData = selectedMonitoring?.metaData?.notificationMetaData || {};
        const updatedNotificationMetaData = form.getFieldsValue(touchedNotificationMetaDataFields);
        const newNotificationMetaData = { ...existingNotificationMetaData, ...updatedNotificationMetaData };
        updatedData.metaData = { ...updatedData.metaData, notificationMetaData: newNotificationMetaData };
      }

      // New values of any other fields that are not part of metaDataFields, notificationMetaDataFields
      const otherFields = fields.filter(
        (field) => !metaDataFields.includes(field) && !notificationMetaDataFields.includes(field)
      );

      // Update other fields
      const otherFieldsValues = form.getFieldsValue(otherFields);
      const newOtherFields = { ...selectedMonitoring, ...otherFieldsValues };
      updatedData = { ...updatedData, ...newOtherFields };

      // Updated by
      updatedData.lastUpdatedBy = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      };

      await updateSelectedCostMonitoring({ updatedData });

      // If no error thrown set state with new data
      setCostMonitorings((prev) => {
        return prev.map((costMonitoring) => {
          updatedData.approvalStatus = 'Pending';
          updatedData.isActive = false;
          if (costMonitoring.id === updatedData.id) {
            return updatedData;
          }
          return costMonitoring;
        });
      });
      resetStates();
      message.success('Cost monitoring updated successfully');
    } catch (err) {
      message.error('Failed to update cost monitoring');
    } finally {
      setSavingCostMonitoring(false);
    }
  };

  // JSX
  return (
    <>
      <BreadCrumbs
        extraContent={
          <CostMonitoringActionButton
            handleAddCostMonitoringButtonClick={handleAddCostMonitoringButtonClick}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            setCostMonitorings={setCostMonitorings}
            setFiltersVisible={setFiltersVisible}
            filtersVisible={filtersVisible}
            isReader={isReader}
            displayAddRejectModal={displayAddRejectModal}
            setDisplayAddRejectModal={setDisplayAddRejectModal}
            setBulkEditModalVisibility={setBulkEditModalVisibility}
          />
        }
      />
      <CostMonitoringFilters
        costMonitorings={costMonitorings}
        setFilters={setFilters}
        filters={filters}
        clusters={clusters}
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
        isReader={isReader}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        matchCount={matchCount}
      />
      <AddEditCostMonitoringModal
        displayAddCostMonitoringModal={displayAddCostMonitoringModal}
        setDisplayAddCostMonitoringModal={setDisplayAddCostMonitoringModal}
        handleSaveCostMonitoring={handleSaveCostMonitoring}
        handleUpdateCostMonitoring={handleUpdateCostMonitoring}
        form={form}
        clusters={clusters}
        savingCostMonitoring={savingCostMonitoring}
        costMonitorings={costMonitorings}
        isEditing={editingData?.isEditing}
        isDuplicating={duplicatingData?.isDuplicating}
        erroneousTabs={erroneousTabs}
        setErroneousTabs={setErroneousTabs}
        selectedClusters={selectedClusters}
        setSelectedClusters={setSelectedClusters}
        resetStates={resetStates}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleClusterChange={handleClusterChange}
      />
      <CostMonitoringTable
        costMonitorings={filteredCostMonitoring}
        setCostMonitorings={setCostMonitorings}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddCostMonitoringModal={setDisplayAddCostMonitoringModal}
        setEditingData={setEditingData}
        setDuplicatingData={setDuplicatingData}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        setSelectedRows={setSelectedRows}
        selectedRows={selectedRows}
        filteringCosts={filteringCosts}
        isReader={isReader}
        clusters={clusters}
        searchTerm={searchTerm}
      />
      {displayMonitoringDetailsModal && (
        <CostMonitoringDetailsModal
          displayMonitoringDetailsModal={displayMonitoringDetailsModal}
          setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          clusters={clusters}
        />
      )}
      {/* Approve Reject Modal - only add if setDisplayAddRejectModal is true */}
      {displayAddRejectModal && (
        <CostMonitoringApproveRejectModal
          id={selectedMonitoring?.id}
          selectedRows={selectedRows}
          displayAddRejectModal={displayAddRejectModal}
          setDisplayAddRejectModal={setDisplayAddRejectModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          user={user}
          setCostMonitorings={setCostMonitorings}
        />
      )}

      {/* Bulk Update Modal */}
      {bulkEditModalVisibility && (
        <BulkUpdateModal
          bulkEditModalVisibility={bulkEditModalVisibility}
          setBulkEditModalVisibility={setBulkEditModalVisibility}
          monitorings={costMonitorings}
          setMonitorings={setCostMonitorings}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          monitoringType="cost"
          handleBulkUpdateMonitorings={handleBulkUpdateCostMonitorings}
        />
      )}
    </>
  );
}

export default CostMonitoring;
