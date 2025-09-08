import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, message } from 'antd';

import MonitoringActionButton from '../../common/Monitoring/ActionButton.jsx';
import AddEditFileMonitoringModal from './AddEditFileMonitoringModal';
import {
  evaluateFileMonitoring,
  getAllFileMonitoring,
  createFileMonitoring,
  updateSelectedFileMonitoring,
  handleDeleteFileMonitoring,
  toggleFileMonitoringStatus,
  handleBulkUpdateFileMonitoring,
} from './fileMonitoringUtils';
import { identifyErroneousTabs } from '../jobMonitoring/jobMonitoringUtils';
import { getRoleNameArray } from '../../common/AuthUtil';
import FileMonitoringTable from './FileMonitoringTable';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal';
import BreadCrumbs from '../../common/BreadCrumbs';
import FileMonitoringFilters from './FileMonitoringFilters';
import BulkUpdateModal from '../../common/Monitoring/BulkUpdateModal';
import { useMonitoringsAndAllProductCategories } from '@/hooks/useMonitoringsAndAllProductCategories';
import { useDomainAndCategories } from '@/hooks/useDomainsAndProductCategories';
import { useMonitorType } from '@/hooks/useMonitoringType';
import MonitoringDetailsModal from '../../common/Monitoring/MonitoringDetailsModal';
import { Constants } from '@/components/common/Constants';

const monitoringTypeName = 'File Monitoring';

function FileMonitoring() {
  // Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const clusters = useSelector((state) => state.application.clusters);

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  // Local States
  const [displayAddFileMonitoringModal, setDisplayAddFileMonitoringModal] = useState(false);
  const [filteredFileMonitoring, setFilteredFileMonitoring] = useState([]);
  const [displayMonitoringDetailsModal, setDisplayMonitoringDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [editingData, setEditingData] = useState({ isEditing: false }); // Data to be edited
  const [duplicatingData, setDuplicatingData] = useState({ isDuplicating: false }); // CM to be duplicated
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);
  const [savingFileMonitoring, setSavingFileMonitoring] = useState(false);
  const [erroneousTabs, setErroneousTabs] = useState([]); // Tabs with erroneous fields
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [filters, setFilters] = useState({});
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [selectedNotificationCondition, setSelectedNotificationCondition] = useState([]);
  const [monitoringFileType, setMonitoringFileType] = useState('stdLogicalFile');

  // Form instance
  const [form] = Form.useForm();

  // When component mounts and appid change get all file monitoring
  const {
    monitorings: fileMonitoring,
    setMonitorings: setFileMonitoring,
    allProductCategories,
  } = useMonitoringsAndAllProductCategories(applicationId, getAllFileMonitoring);

  // When intention to edit a monitoring is discovered
  useEffect(() => {
    if (editingData?.isEditing || duplicatingData?.isDuplicating) {
      form.setFieldsValue(selectedMonitoring);
      setSelectedClusters(selectedMonitoring.clusterIds || []);

      // Set states that are responsible for hiding/displaying dependent fields
      setSelectedNotificationCondition(selectedMonitoring?.metaData?.monitoringData?.notificationCondition || []);
      setMonitoringFileType(selectedMonitoring?.monitoringFileType || 'stdLogicalFile');

      // Set form values from metadata
      form.setFieldsValue({
        ...selectedMonitoring,
        ...selectedMonitoring?.metaData?.contacts,
        ...selectedMonitoring?.metaData?.monitoringData,
        ...selectedMonitoring?.metaData?.asrSpecificMetaData,
      });
    }
  }, [editingData, duplicatingData, selectedMonitoring, form]);

  const { monitoringTypeId } = useMonitorType(monitoringTypeName);

  // Get domains and product categories
  const { domains, productCategories, selectedDomain, setSelectedDomain } = useDomainAndCategories(
    monitoringTypeId,
    selectedMonitoring
  );

  // When filter changes, filter the file monitoring
  useEffect(() => {
    const { approvalStatus, activeStatus, clusters: filterClusters } = filters;

    // Convert activeStatus to boolean
    let activeStatusBool;
    if (activeStatus === 'Active') {
      activeStatusBool = true;
    } else if (activeStatus === 'Inactive') {
      activeStatusBool = false;
    }

    let filteredFileMonitoring = fileMonitoring.filter((fm) => {
      let include = true;

      if (approvalStatus && fm.approvalStatus !== approvalStatus) {
        include = false;
      }
      if (activeStatusBool !== undefined && fm.isActive !== activeStatusBool) {
        include = false;
      }
      if (filterClusters && filterClusters.length > 0) {
        const hasMatchingCluster = fm.clusterIds?.some((clusterId) => filterClusters.includes(clusterId));
        if (!hasMatchingCluster) {
          include = false;
        }
      }

      return include;
    });

    const matchedFileIds = [];

    // Calculate the number of matched string instances
    if (searchTerm) {
      let instanceCount = 0;
      filteredFileMonitoring.forEach((file) => {
        const monitoringName = file.monitoringName.toLowerCase();
        const description = file.description?.toLowerCase() || '';

        if (monitoringName.includes(searchTerm.toLowerCase())) {
          matchedFileIds.push(file.id);
          instanceCount++;
        }

        if (description.includes(searchTerm.toLowerCase())) {
          matchedFileIds.push(file.id);
          instanceCount++;
        }
      });

      setMatchCount(instanceCount);
    } else {
      setMatchCount(0);
    }

    if (matchedFileIds.length > 0) {
      filteredFileMonitoring = filteredFileMonitoring.filter((file) => matchedFileIds.includes(file.id));
    } else if (matchedFileIds.length === 0 && searchTerm) {
      filteredFileMonitoring = [];
    }

    setFilteredFileMonitoring(filteredFileMonitoring);
  }, [filters, fileMonitoring, searchTerm]);

  const handleOpenBulkEdit = () => setBulkEditModalVisibility(true);
  const handleOpenApproveReject = () => setDisplayAddRejectModal(true);
  const handleToggleFilters = () => setFiltersVisible((prev) => !prev);

  // Function reset states when modal is closed
  const resetStates = () => {
    setDisplayAddFileMonitoringModal(false);
    setSelectedMonitoring(null);
    setEditingData({ isEditing: false });
    setDuplicatingData({ isDuplicating: false });
    setErroneousTabs([]);
    setSelectedClusters([]);
    setActiveTab('0');
    form.resetFields();
  };

  // When add button new file monitoring button clicked
  const handleAddFileMonitoringButtonClick = () => {
    setDisplayAddFileMonitoringModal(true);
  };

  // Save new file monitoring
  const handleSaveFileMonitoring = async () => {
    setSavingFileMonitoring(true);
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
      setSavingFileMonitoring(false);
      return;
    }

    // If form is valid save file monitoring
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
      const { domain, productCategory, severity } = allInputs;
      const asrSpecificFields = { domain, productCategory, severity };
      for (let key in asrSpecificFields) {
        if (asrSpecificFields[key] !== undefined) {
          asrSpecificMetaData[key] = asrSpecificFields[key];
        }
        delete allInputs[key];
      }

      // Group contacts
      const contacts = {};
      const { primaryContacts, secondaryContacts, notifyContacts } = allInputs;
      const contactFields = {
        primaryContacts,
        secondaryContacts,
        notifyContacts,
      };
      for (let key in contactFields) {
        if (contactFields[key] !== undefined) {
          contacts[key] = contactFields[key];
        }
        delete allInputs[key];
      }

      // Group monitoring data
      const monitoringData = {};
      const { notificationCondition, minFileSize, maxFileSize, minSubFileCount, maxSubFileCount, fileNamePattern } =
        allInputs;
      const monitoringFields = {
        fileNamePattern,
        notificationCondition,
        minFileSize,
        maxFileSize,
        minSubFileCount,
        maxSubFileCount,
      };
      for (let key in monitoringFields) {
        if (monitoringFields[key] !== undefined) {
          monitoringData[key] = monitoringFields[key];
        }
        delete allInputs[key];
      }

      // Add applicationId, createdBy, lastUpdatedBy to allInputs
      allInputs.applicationId = applicationId;

      // Create metaData object
      const metaData = {
        contacts: contacts,
        monitoringData: monitoringData,
      };

      if (Object.keys(asrSpecificMetaData).length > 0) {
        metaData.asrSpecificMetaData = asrSpecificMetaData;
      }

      // Add metaData to allInputs
      allInputs = { ...allInputs, metaData };

      const responseData = await createFileMonitoring({ inputData: allInputs });

      setFileMonitoring([responseData.data, ...fileMonitoring]);
      message.success('File monitoring saved successfully');

      // Reset states and Close modal if saved successfully
      resetStates();
      setDisplayAddFileMonitoringModal(false);
    } catch (err) {
      message.error(err.message);
    } finally {
      setSavingFileMonitoring(false);
    }
  };

  const handleClusterChange = (selectedClusterIds) => {
    setSelectedClusters(selectedClusterIds);
    // Update form field value to keep the form in sync
    form.setFieldsValue({ clusterIds: selectedClusterIds });
  };

  // Handle bulk update of file monitoring
  const handlePauseAndStartAction = async ({ ids, action }) => {
    const response = await toggleFileMonitoringStatus({ ids, action });
    // the response is array of updated objects, these need to replace the existing objects in the state
    const updatedMap = new Map(response.map((u) => [u.id, u]));
    setFileMonitoring((prev) => prev.map((m) => updatedMap.get(m.id) || m));
    setSelectedMonitoring(null);
  };

  // Handle updates to existing monitoring
  const handleUpdateFileMonitoring = async () => {
    setSavingFileMonitoring(true);
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
        setSavingFileMonitoring(false);
        return;
      }

      // Form fields
      const allInputs = form.getFieldsValue();
      const fields = Object.keys(allInputs);

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

      const asrSpecificMetaData = {};
      const { domain, productCategory, severity } = allInputs;
      const asrSpecificFields = { domain, productCategory, severity };
      for (let key in asrSpecificFields) {
        if (asrSpecificFields[key] !== undefined) {
          asrSpecificMetaData[key] = asrSpecificFields[key];
        }
        delete allInputs[key];
      }

      // Group contacts
      const contacts = {};
      const { primaryContacts, secondaryContacts, notifyContacts } = allInputs;
      const contactFields = {
        primaryContacts,
        secondaryContacts,
        notifyContacts,
      };
      for (let key in contactFields) {
        if (contactFields[key] !== undefined) {
          contacts[key] = contactFields[key];
        }
        delete allInputs[key];
      }

      // Group monitoring data
      const monitoringData = {};
      const { notificationCondition, minFileSize, maxFileSize, minSubFileCount, maxSubFileCount, fileNamePattern } =
        allInputs;
      const monitoringFields = {
        fileNamePattern,
        notificationCondition,
        minFileSize,
        maxFileSize,
        minSubFileCount,
        maxSubFileCount,
      };
      for (let key in monitoringFields) {
        if (monitoringFields[key] !== undefined) {
          monitoringData[key] = monitoringFields[key];
        }
        delete allInputs[key];
      }

      // Add applicationId, createdBy, lastUpdatedBy to allInputs
      allInputs.applicationId = applicationId;

      // Create metaData object
      const metaData = {
        contacts: contacts,
        monitoringData: monitoringData,
      };

      if (Object.keys(asrSpecificMetaData).length > 0) {
        metaData.asrSpecificMetaData = asrSpecificMetaData;
      }

      // Add metaData to allInputs
      const updatedData = { ...allInputs, metaData };

      await updateSelectedFileMonitoring(updatedData, selectedMonitoring.id);

      // If no error thrown set state with new data
      setFileMonitoring((prev) => {
        return prev.map((fm) => {
          updatedData.approvalStatus = 'Pending';
          updatedData.isActive = false;
          if (fm.id === updatedData.id) {
            return updatedData;
          }
          return fm;
        });
      });
      resetStates();
      message.success('File monitoring updated successfully');
    } catch (err) {
      message.error('Failed to update file monitoring');
    } finally {
      setSavingFileMonitoring(false);
    }
  };

  const handleBulkDeleteSelectedFileMonitoring = async (ids) => {
    try {
      await handleDeleteFileMonitoring(ids);
      setFileMonitoring((prev) => prev.filter((cm) => !ids.includes(cm.id)));
      setSelectedRows([]);
      message.success('Selected file monitoring deleted successfully');
    } catch (_) {
      message.error('Unable to delete selected file monitoring');
    }
  };

  // JSX
  return (
    <>
      <BreadCrumbs
        extraContent={
          <MonitoringActionButton
            label="File Monitoring Actions"
            isReader={isReader}
            selectedRows={selectedRows}
            onAdd={handleAddFileMonitoringButtonClick}
            onBulkEdit={handleOpenBulkEdit}
            onBulkApproveReject={handleOpenApproveReject}
            onToggleFilters={handleToggleFilters}
            showBulkApproveReject={true}
            showFiltersToggle={true}
            filtersStorageKey={Constants.CM_FILTERS_VS_KEY}
            onBulkDelete={handleBulkDeleteSelectedFileMonitoring}
            onBulkStartPause={handlePauseAndStartAction}
          />
        }
      />
      <FileMonitoringFilters
        fileMonitoring={fileMonitoring}
        setFilters={setFilters}
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        matchCount={matchCount}
        domains={domains}
        allProductCategories={allProductCategories}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
      />
      <AddEditFileMonitoringModal
        displayAddFileMonitoringModal={displayAddFileMonitoringModal}
        setDisplayAddFileMonitoringModal={setDisplayAddFileMonitoringModal}
        handleSaveFileMonitoring={handleSaveFileMonitoring}
        handleUpdateFileMonitoring={handleUpdateFileMonitoring}
        form={form}
        clusters={clusters}
        savingFileMonitoring={savingFileMonitoring}
        fileMonitoring={fileMonitoring}
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
        selectedNotificationCondition={selectedNotificationCondition}
        setSelectedNotificationCondition={setSelectedNotificationCondition}
        monitoringFileType={monitoringFileType}
        setMonitoringFileType={setMonitoringFileType}
      />
      <FileMonitoringTable
        fileMonitoring={filteredFileMonitoring}
        setFileMonitoring={setFileMonitoring}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        setSelectedMonitoring={setSelectedMonitoring}
        setDisplayAddFileMonitoringModal={setDisplayAddFileMonitoringModal}
        setEditingData={setEditingData}
        setDuplicatingData={setDuplicatingData}
        setDisplayAddRejectModal={setDisplayAddRejectModal}
        setSelectedRows={setSelectedRows}
        selectedRows={selectedRows}
        domains={domains}
        allProductCategories={allProductCategories}
        isReader={isReader}
        clusters={clusters}
        searchTerm={searchTerm}
      />
      {displayMonitoringDetailsModal && (
        <MonitoringDetailsModal
          monitoringTypeName={monitoringTypeName}
          displayMonitoringDetailsModal={displayMonitoringDetailsModal}
          setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          clusters={clusters}
          domains={domains}
          productCategories={productCategories}></MonitoringDetailsModal>
      )}
      {/* Approve Reject Modal - only add if setDisplayAddRejectModal is true */}
      {displayAddRejectModal && (
        <ApproveRejectModal
          visible={displayAddRejectModal}
          onCancel={() => setDisplayAddRejectModal(false)}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          selectedRows={selectedRows}
          setMonitoring={setFileMonitoring}
          monitoringTypeLabel={monitoringTypeName}
          evaluateMonitoring={evaluateFileMonitoring}
        />
      )}

      {/* Bulk Update Modal */}
      {bulkEditModalVisibility && (
        <BulkUpdateModal
          bulkEditModalVisibility={bulkEditModalVisibility}
          setBulkEditModalVisibility={setBulkEditModalVisibility}
          monitorings={fileMonitoring}
          setMonitorings={setFileMonitoring}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          monitoringType="fileMonitoring"
          handleBulkUpdateMonitorings={handleBulkUpdateFileMonitoring}
        />
      )}
    </>
  );
}

export default FileMonitoring;
