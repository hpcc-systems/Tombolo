import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, message, Tag, Descriptions } from 'antd';

import MonitoringActionButton from '../../common/Monitoring/ActionButton.jsx';
import AddEditCostMonitoringModal from './AddEditCostMonitoringModal';
import {
  createCostMonitoring,
  getAllCostMonitorings,
  handleBulkUpdateCostMonitorings,
  updateSelectedCostMonitoring,
  handleBulkDeleteCostMonitorings,
  toggleCostMonitoringStatus,
  evaluateCostMonitoring,
} from './costMonitoringUtils';

import { identifyErroneousTabs } from '../jobMonitoring/jobMonitoringUtils';

import { getRoleNameArray } from '../../common/AuthUtil';
import CostMonitoringTable from './CostMonitoringTable';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal';
import BreadCrumbs from '../../common/BreadCrumbs';
import CostMonitoringFilters from './CostMonitoringFilters';
import BulkUpdateModal from '../../common/Monitoring/BulkUpdateModal';
import { useMonitoringsAndAllProductCategories } from '@/hooks/useMonitoringsAndAllProductCategories';
import { useDomainAndCategories } from '@/hooks/useDomainsAndProductCategories';
import { useMonitorType } from '@/hooks/useMonitoringType';
import MonitoringDetailsModal from '../../common/Monitoring/MonitoringDetailsModal';
import { Constants } from '@/components/common/Constants';

const monitoringTypeName = 'Cost Monitoring';

function CostMonitoring() {
  // Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const clusters = useSelector((state) => state.application.clusters);

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  // Local States
  const [displayAddCostMonitoringModal, setDisplayAddCostMonitoringModal] = useState(false);
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
  const {
    monitorings: costMonitorings,
    setMonitorings: setCostMonitorings,
    allProductCategories,
  } = useMonitoringsAndAllProductCategories(applicationId, getAllCostMonitorings);

  // When intention to edit a monitoring is discovered
  useEffect(() => {
    if (editingData?.isEditing || duplicatingData?.isDuplicating) {
      form.setFieldsValue(selectedMonitoring);
      setSelectedClusters(selectedMonitoring.clusterIds || []);

      // Set form values from metadata
      form.setFieldsValue({
        ...selectedMonitoring?.metaData?.notificationMetaData,
        ...selectedMonitoring?.metaData,
        ...selectedMonitoring?.metaData?.asrSpecificMetaData,
        clusterIds: selectedMonitoring.clusterIds,
        users: selectedMonitoring?.metaData?.users,
        threshold: selectedMonitoring?.metaData?.notificationMetaData?.notificationCondition,
        timeWindow: selectedMonitoring?.metaData?.timeWindow,
      });
    }
  }, [editingData, duplicatingData, selectedMonitoring, form]);

  const { monitoringTypeId } = useMonitorType(monitoringTypeName);

  // Get domains and product categories
  const { domains, productCategories, setProductCategories, selectedDomain, setSelectedDomain } =
    useDomainAndCategories(monitoringTypeId, selectedMonitoring);

  // When filter changes, filter the cost monitorings
  useEffect(() => {
    setFilteringCosts(true);
    if (costMonitorings.length === 0) {
      setFilteringCosts(false);
      return;
    }

    const { approvalStatus, activeStatus, clusters: filterClusters, users: filterUsers } = filters;

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

      if (filterUsers && filterUsers.length > 0) {
        const costMonitoringUsers = costMonitoring.metaData?.users || [];
        // Check if any of the selected filter users exist in the cost monitoring users array
        const hasMatchingUser = filterUsers.some((filterUser) => costMonitoringUsers.includes(filterUser));
        if (!hasMatchingUser) {
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

  const handleOpenBulkEdit = () => setBulkEditModalVisibility(true);
  const handleOpenApproveReject = () => setDisplayAddRejectModal(true);
  const handleToggleFilters = () => setFiltersVisible((prev) => !prev);

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

      const asrSpecificMetaData = {};
      const { domain, productCategory, jobMonitorType, severity } = allInputs;
      const asrSpecificFields = { domain, productCategory, jobMonitorType, severity };
      for (let key in asrSpecificFields) {
        if (asrSpecificFields[key] !== undefined) {
          asrSpecificMetaData[key] = asrSpecificFields[key];
        }
        delete allInputs[key];
      }

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
      delete allInputs.updater;
      delete allInputs.creator;
      delete allInputs.createdBy;
      delete allInputs.lastUpdatedBy;

      // Add applicationId, createdBy, lastUpdatedBy to allInputs
      allInputs.applicationId = applicationId;

      //Add asrSpecificMetaData, notificationMetaData to metaData object
      metaData.asrSpecificMetaData = asrSpecificMetaData;
      metaData.notificationMetaData = notificationMetaData;

      // Add notificationMetaData to metaData object
      metaData.notificationMetaData = notificationMetaData;

      // Parse value from isSummed to boolean
      allInputs.isSummed = allInputs.isSummed === 'true';

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
      const asrSpecificFields = ['domain', 'productCategory', 'severity'];
      const metaDataFields = ['users', 'timeWindow'];
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
      const touchedAsrFields = touchedFields.filter((field) => asrSpecificFields.includes(field));
      const touchedMetaDataFields = touchedFields.filter((field) => metaDataFields.includes(field));
      const touchedNotificationMetaDataFields = touchedFields.filter((field) =>
        notificationMetaDataFields.includes(field)
      );

      if (touchedAsrFields.length > 0) {
        let existingAsrSpecificMetaData = selectedMonitoring?.metaData?.asrSpecificMetaData || {};
        const upDatedAsrSpecificMetaData = form.getFieldsValue(touchedAsrFields);
        updatedData.metaData.asrSpecificMetaData = { ...existingAsrSpecificMetaData, ...upDatedAsrSpecificMetaData };
      }

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

        // Preserve existing metaData that might have been set in the previous block
        const existingUpdatedMetaData = updatedData.metaData || selectedMonitoring?.metaData || {};
        updatedData.metaData = { ...existingUpdatedMetaData, notificationMetaData: newNotificationMetaData };
      }

      // New values of any other fields that are not part of metaDataFields, notificationMetaDataFields
      const otherFields = fields.filter(
        (field) => !metaDataFields.includes(field) && !notificationMetaDataFields.includes(field)
      );

      // Update other fields
      const otherFieldsValues = form.getFieldsValue(otherFields);
      const { metaData: _, ...selectedMonitoringWithoutMetaData } = selectedMonitoring;
      const newOtherFields = { ...selectedMonitoringWithoutMetaData, ...otherFieldsValues };
      updatedData = { ...updatedData, ...newOtherFields };

      if (touchedFields.includes('threshold')) {
        updatedData.metaData.notificationMetaData.notificationCondition = updatedData.threshold;
      }
      delete updatedData.threshold;

      const response = await updateSelectedCostMonitoring({ updatedData });

      // If no error thrown set state with new data
      setCostMonitorings((prev) => {
        const updatedArray = Array.isArray(response?.data) ? response.data : [response?.data].filter(Boolean);
        if (updatedArray.length === 0) return prev;

        const updatedMap = new Map(updatedArray.map((u) => [u.id, u]));
        return prev.map((cm) => (updatedMap.has(cm.id) ? updatedMap.get(cm.id) : cm));
      });

      resetStates();
      message.success('Cost monitoring updated successfully');
    } catch (err) {
      message.error('Failed to update cost monitoring');
    } finally {
      setSavingCostMonitoring(false);
    }
  };

  const handleBulkDeleteSelectedCostMonitorings = async (ids) => {
    try {
      await handleBulkDeleteCostMonitorings(ids);
      setCostMonitorings((prev) => prev.filter((cm) => !ids.includes(cm.id)));
      setSelectedRows([]);
      message.success('Selected cost monitorings deleted successfully');
    } catch (_) {
      message.error('Unable to delete selected cost monitorings');
    }
  };

  const handleBulkStartPauseCostMonitorings = async ({ ids, action }) => {
    try {
      const updatedMonitorings = await toggleCostMonitoringStatus(ids, action);
      const updatedMap = new Map(updatedMonitorings.map((u) => [u.id, u]));
      setCostMonitorings((prev) => prev.map((m) => updatedMap.get(m.id) || m));
    } catch (_) {
      message.error('Unable to start/pause selected cost monitorings');
    }
  };

  // JSX
  return (
    <>
      <BreadCrumbs
        extraContent={
          <MonitoringActionButton
            label="Cost Monitoring Actions"
            isReader={isReader}
            selectedRows={selectedRows}
            onAdd={handleAddCostMonitoringButtonClick}
            onBulkEdit={handleOpenBulkEdit}
            onBulkApproveReject={handleOpenApproveReject}
            onToggleFilters={handleToggleFilters}
            showBulkApproveReject={true}
            showFiltersToggle={true}
            filtersStorageKey={Constants.CM_FILTERS_VS_KEY}
            onBulkDelete={handleBulkDeleteSelectedCostMonitorings}
            onBulkStartPause={handleBulkStartPauseCostMonitorings}
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
        domains={domains}
        productCategories={productCategories}
        allProductCategories={allProductCategories}
        setProductCategories={setProductCategories}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
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
        domains={domains}
        productCategories={productCategories}
        setSelectedDomain={setSelectedDomain}
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
        domains={domains}
        productCategories={productCategories}
        allProductCategories={allProductCategories}
        filteringCosts={filteringCosts}
        isReader={isReader}
        clusters={clusters}
        searchTerm={searchTerm}
      />
      {displayMonitoringDetailsModal && (
        <MonitoringDetailsModal
          displayMonitoringDetailsModal={displayMonitoringDetailsModal}
          setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          clusters={clusters}
          domains={domains}
          productCategories={productCategories}>
          <Descriptions.Item label="Monitoring scope">{selectedMonitoring.monitoringScope}</Descriptions.Item>
          {selectedMonitoring.metaData.users && selectedMonitoring.metaData.users.length > 0 && (
            <Descriptions.Item label="Monitored Users">
              {selectedMonitoring.metaData.users.map((monitoredUser, index) => (
                <Tag key={`cmdu-${index}`} style={{ marginBottom: '4px' }}>
                  {monitoredUser}
                </Tag>
              ))}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Is Summed">
            {selectedMonitoring.isSummed ? (
              <Tag color="var(--success)" key={'yes'}>
                Yes
              </Tag>
            ) : (
              <Tag color="var(--danger)" key={'no'}>
                No
              </Tag>
            )}
          </Descriptions.Item>

          {selectedMonitoring.metaData.costThreshold && (
            <Descriptions.Item label="Cost Threshold">${selectedMonitoring.metaData.costThreshold}</Descriptions.Item>
          )}

          {selectedMonitoring.metaData.timeWindow && (
            <Descriptions.Item label="Time Window">{selectedMonitoring.metaData.timeWindow}</Descriptions.Item>
          )}
        </MonitoringDetailsModal>
      )}
      {/* Approve Reject Modal - only add if setDisplayAddRejectModal is true */}
      {displayAddRejectModal && (
        <ApproveRejectModal
          visible={displayAddRejectModal}
          onCancel={() => setDisplayAddRejectModal(false)}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          selectedRows={selectedRows}
          setMonitoring={setCostMonitorings}
          monitoringTypeLabel={monitoringTypeName}
          evaluateMonitoring={evaluateCostMonitoring}
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
