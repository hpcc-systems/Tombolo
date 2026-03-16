// Imports from libraries
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, Descriptions, Tag } from 'antd';

// Local imports
import { handleError, handleSuccess } from '@/components/common/handleResponse';
import MonitoringActionButton from '../../common/Monitoring/ActionButton';
import AddEditFileMonitoringModal from './AddEditFileMonitoringModal';
import fileMonitoringService from '@/services/fileMonitoring.service';
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
import type { FileMonitoringDTO } from '@tombolo/shared';

const monitoringTypeName = 'File Monitoring';

const notificationConditionsObj: Record<string, string> = {
  sizeNotInRange: 'File size not in range',
  subFileCountNotInRange: 'Subfile count not in range',
};

interface Cluster {
  id: string;
  name: string;
  [key: string]: any;
}

interface EditingData {
  isEditing: boolean;
  selectedMonitoring?: string;
}

interface DuplicatingData {
  isDuplicating: boolean;
  selectedMonitoring?: FileMonitoringDTO;
}

function FileMonitoring() {
  // Redux
  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const clusters = useSelector((state: any) => state.application.clusters);

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  // Local States
  const [displayAddFileMonitoringModal, setDisplayAddFileMonitoringModal] = useState(false);
  const [filteredFileMonitoring, setFilteredFileMonitoring] = useState<FileMonitoringDTO[]>([]);
  const [displayMonitoringDetailsModal, setDisplayMonitoringDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState<FileMonitoringDTO | null>(null);
  const [editingData, setEditingData] = useState<EditingData>({ isEditing: false }); // Data to be edited
  const [duplicatingData, setDuplicatingData] = useState<DuplicatingData>({ isDuplicating: false }); // FM to be duplicated
  const [displayAddRejectModal, setDisplayAddRejectModal] = useState(false);
  const [savingFileMonitoring, setSavingFileMonitoring] = useState(false);
  const [erroneousTabs, setErroneousTabs] = useState<string[]>([]); // Tabs with erroneous fields
  const [selectedClusters, setSelectedClusters] = useState<Cluster[]>([]);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState<FileMonitoringDTO[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [selectedNotificationCondition, setSelectedNotificationCondition] = useState<string[]>([]);
  const [monitoringFileType, setMonitoringFileType] = useState<'stdLogicalFile' | 'superFile'>('stdLogicalFile');

  // Form instance
  const [form] = Form.useForm();

  const fileTypes: Record<string, string> = {
    stdLogicalFile: 'Standard Logical File',
    superFile: 'Super File',
  };

  // When component mounts and appid change get all file monitoring
  const {
    monitorings: fileMonitoring,
    setMonitorings: setFileMonitoring,
    allProductCategories,
  } = useMonitoringsAndAllProductCategories(applicationId, fileMonitoringService.getAll);

  // When intention to edit a monitoring is discovered
  useEffect(() => {
    if (editingData?.isEditing || duplicatingData?.isDuplicating) {
      if (!selectedMonitoring) return;
      form.setFieldsValue(selectedMonitoring);
      const clusterIds =
        (selectedMonitoring as any).clusterIds ?? (selectedMonitoring.clusterId ? [selectedMonitoring.clusterId] : []);
      setSelectedClusters(clusters.filter(c => clusterIds.includes(c.id)));

      // Set states that are responsible for hiding/displaying dependent fields
      setSelectedNotificationCondition(selectedMonitoring?.metaData?.monitoringData?.notificationCondition || []);
      setMonitoringFileType(
        (selectedMonitoring?.fileMonitoringType as 'stdLogicalFile' | 'superFile') || 'stdLogicalFile'
      );

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
    let activeStatusBool: boolean | undefined;
    if (activeStatus === 'Active') {
      activeStatusBool = true;
    } else if (activeStatus === 'Inactive') {
      activeStatusBool = false;
    }

    let filteredFileMonitoringData = fileMonitoring.filter(fm => {
      let include = true;

      if (approvalStatus && fm.approvalStatus !== approvalStatus) {
        include = false;
      }
      if (activeStatusBool !== undefined && fm.isActive !== activeStatusBool) {
        include = false;
      }
      if (filterClusters && filterClusters.length > 0) {
        const fmClusterIds: string[] = (fm as any).clusterIds ?? ((fm as any).clusterId ? [(fm as any).clusterId] : []);
        const hasMatchingCluster = fmClusterIds.some((clusterId: string) => filterClusters.includes(clusterId));
        if (!hasMatchingCluster) {
          include = false;
        }
      }

      return include;
    });

    const matchedFileIds: string[] = [];

    // Calculate the number of matched string instances
    if (searchTerm) {
      let instanceCount = 0;
      filteredFileMonitoringData.forEach(file => {
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
      filteredFileMonitoringData = filteredFileMonitoringData.filter(file => matchedFileIds.includes(file.id));
    } else if (matchedFileIds.length === 0 && searchTerm) {
      filteredFileMonitoringData = [];
    }

    setFilteredFileMonitoring(filteredFileMonitoringData);
  }, [filters, fileMonitoring, searchTerm]);

  const handleOpenBulkEdit = () => setBulkEditModalVisibility(true);
  const handleOpenApproveReject = () => setDisplayAddRejectModal(true);
  const handleToggleFilters = () => setFiltersVisible(prev => !prev);

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
    } catch {
      validForm = false;
    }

    // Identify erroneous tabs
    const erroneousFields = form
      .getFieldsError()
      .filter(f => f.errors.length > 0)
      .map(f => f.name[0] as string);
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

      const asrSpecificMetaData: any = {};
      const { domain, productCategory, severity } = allInputs;
      const asrSpecificFields = { domain, productCategory, severity };
      for (let key in asrSpecificFields) {
        if ((asrSpecificFields as any)[key] !== undefined) {
          asrSpecificMetaData[key] = (asrSpecificFields as any)[key];
        }
        delete allInputs[key];
      }

      // Group contacts
      const contacts: any = {};
      const { primaryContacts, secondaryContacts, notifyContacts } = allInputs;
      const contactFields = {
        primaryContacts,
        secondaryContacts,
        notifyContacts,
      };
      for (let key in contactFields) {
        if ((contactFields as any)[key] !== undefined) {
          contacts[key] = (contactFields as any)[key];
        }
        delete allInputs[key];
      }

      // Group monitoring data
      const monitoringData: any = {};
      const {
        notificationCondition,
        minFileSize,
        maxFileSize,
        minSubFileCount,
        maxSubFileCount,
        fileNamePattern,
        minSizeThresholdUnit,
        maxSizeThresholdUnit,
      } = allInputs;
      const monitoringFields = {
        fileNamePattern,
        notificationCondition,
        minFileSize,
        maxFileSize,
        minSubFileCount,
        maxSubFileCount,
        minSizeThresholdUnit,
        maxSizeThresholdUnit,
      };
      for (let key in monitoringFields) {
        if ((monitoringFields as any)[key] !== undefined) {
          monitoringData[key] = (monitoringFields as any)[key];
        }
        delete allInputs[key];
      }

      // Add applicationId, createdBy, lastUpdatedBy to allInputs
      allInputs.applicationId = applicationId;

      // Create metaData object
      const metaData: any = {
        contacts: contacts,
        monitoringData: monitoringData,
      };

      if (Object.keys(asrSpecificMetaData).length > 0) {
        metaData.asrSpecificMetaData = asrSpecificMetaData;
      }

      // Add metaData to allInputs
      allInputs = { ...allInputs, metaData };

      const responseData = await fileMonitoringService.create({ inputData: allInputs });

      setFileMonitoring([responseData, ...fileMonitoring]);
      handleSuccess('File monitoring saved successfully');

      // Reset states and Close modal if saved successfully
      resetStates();
      setDisplayAddFileMonitoringModal(false);
    } catch (err: any) {
      handleError(err.message);
    } finally {
      setSavingFileMonitoring(false);
    }
  };

  const handleClusterChange = (selectedClusterIds: string) => {
    setSelectedClusters(selectedClusterIds as any);
    // Update form field value to keep the form in sync
    form.setFieldsValue({ clusterIds: selectedClusterIds });
  };

  // Handle bulk update of file monitoring
  const handlePauseAndStartAction = async ({ ids, action }: { ids: string[]; action: string }) => {
    const response = await fileMonitoringService.toggle({ ids, action: action as any });
    // the response is array of updated objects, these need to replace the existing objects in the state
    const updatedMap = new Map(response.map((u: FileMonitoringDTO) => [u.id, u]));
    setFileMonitoring(prev => prev.map(m => updatedMap.get(m.id) || m));
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
      } catch {
        validForm = false;
      }

      // Identify erroneous tabs
      const erroneousFields = form
        .getFieldsError()
        .filter(f => f.errors.length > 0)
        .map(f => f.name[0] as string);
      const badTabs = identifyErroneousTabs({ erroneousFields });
      if (badTabs.length > 0) {
        setErroneousTabs(badTabs);
      }

      // If form is invalid return
      if (!validForm) {
        setSavingFileMonitoring(false);
        return;
      }

      if (!selectedMonitoring) {
        handleError('No monitoring selected');
        return;
      }

      // Form fields
      const allInputs = form.getFieldsValue();
      const fields = Object.keys(allInputs);

      // Identify the fields that were touched
      const touchedFields: string[] = [];
      fields.forEach(field => {
        if (form.isFieldTouched(field)) {
          touchedFields.push(field);
        }
      });
      // If no touched fields
      if (touchedFields.length === 0) {
        return handleError('No changes detected');
      }

      const asrSpecificMetaData: any = {};
      const { domain, productCategory, severity } = allInputs;
      const asrSpecificFields = { domain, productCategory, severity };
      for (let key in asrSpecificFields) {
        if ((asrSpecificFields as any)[key] !== undefined) {
          asrSpecificMetaData[key] = (asrSpecificFields as any)[key];
        }
        delete allInputs[key];
      }

      // Group contacts
      const contacts: any = {};
      const { primaryContacts, secondaryContacts, notifyContacts } = allInputs;
      const contactFields = {
        primaryContacts,
        secondaryContacts,
        notifyContacts,
      };
      for (let key in contactFields) {
        if ((contactFields as any)[key] !== undefined) {
          contacts[key] = (contactFields as any)[key];
        }
        delete allInputs[key];
      }

      // Group monitoring data
      const monitoringData: any = {};
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
        if ((monitoringFields as any)[key] !== undefined) {
          monitoringData[key] = (monitoringFields as any)[key];
        }
        delete allInputs[key];
      }

      // Add applicationId, createdBy, lastUpdatedBy to allInputs
      allInputs.applicationId = applicationId;

      // Create metaData object
      const metaData: any = {
        contacts: contacts,
        monitoringData: monitoringData,
      };

      if (Object.keys(asrSpecificMetaData).length > 0) {
        metaData.asrSpecificMetaData = asrSpecificMetaData;
      }

      // Add metaData to allInputs
      const updatedData = { ...allInputs, metaData };

      const response = await fileMonitoringService.updateOne(updatedData, selectedMonitoring.id);

      // If no error thrown set state with new data
      setFileMonitoring(prev => prev.map(fm => (fm.id === response.id ? response : fm)));
      resetStates();
      handleSuccess('File monitoring updated successfully');
    } catch {
      handleError('Failed to update file monitoring');
    } finally {
      setSavingFileMonitoring(false);
    }
  };

  const handleBulkDeleteSelectedFileMonitoring = async (ids: string[]) => {
    try {
      await fileMonitoringService.delete(ids);
      setFileMonitoring(prev => prev.filter(cm => !ids.includes(cm.id)));
      setSelectedRows([]);
      handleSuccess('Selected file monitoring deleted successfully');
    } catch {
      handleError('Unable to delete selected file monitoring');
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
        domains={domains as any}
        allProductCategories={allProductCategories as any}
        selectedDomain={selectedDomain as any}
        setSelectedDomain={setSelectedDomain as any}
      />
      <AddEditFileMonitoringModal
        displayAddFileMonitoringModal={displayAddFileMonitoringModal}
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
        resetStates={resetStates}
        domains={domains as any}
        productCategories={productCategories as any}
        setSelectedDomain={setSelectedDomain as any}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleClusterChange={handleClusterChange}
        selectedNotificationCondition={selectedNotificationCondition}
        setSelectedNotificationCondition={setSelectedNotificationCondition}
        monitoringFileType={monitoringFileType}
        setMonitoringFileType={setMonitoringFileType}
        fileTypes={fileTypes}
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
        domains={domains as any}
        allProductCategories={allProductCategories as any}
        isReader={isReader}
        clusters={clusters}
        searchTerm={searchTerm}
      />
      {displayMonitoringDetailsModal && selectedMonitoring && (
        <MonitoringDetailsModal
          monitoringTypeName={monitoringTypeName}
          displayMonitoringDetailsModal={displayMonitoringDetailsModal}
          setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
          selectedMonitoring={{
            ...selectedMonitoring,
            metaData: {
              ...selectedMonitoring.metaData,
              notificationMetaData: selectedMonitoring?.metaData?.contacts,
            },
          }}
          clusters={clusters}
          domains={domains as any}
          productCategories={productCategories as any}>
          <Descriptions.Item label="File Type "> {fileTypes[selectedMonitoring.fileMonitoringType!]}</Descriptions.Item>
          <Descriptions.Item label="File Name / Pattern">
            {selectedMonitoring?.metaData?.monitoringData?.fileNamePattern}
          </Descriptions.Item>
          <Descriptions.Item label="Notify when">
            {selectedMonitoring?.metaData?.monitoringData?.notificationCondition?.map(
              (condition: string, i: number) => (
                <Tag key={i}>{notificationConditionsObj[condition]}</Tag>
              )
            )}
          </Descriptions.Item>

          {selectedMonitoring?.metaData?.monitoringData?.minFileSize &&
            selectedMonitoring?.metaData?.monitoringData?.minFileSize && (
              <Descriptions.Item label="File Size Range">
                {`${selectedMonitoring?.metaData?.monitoringData?.minFileSize} ${selectedMonitoring?.metaData?.monitoringData?.minSizeThresholdUnit}
            -  ${selectedMonitoring?.metaData?.monitoringData?.maxFileSize} ${selectedMonitoring?.metaData?.monitoringData?.maxSizeThresholdUnit}`}
              </Descriptions.Item>
            )}

          {/* File count range  */}
          {selectedMonitoring?.metaData?.monitoringData?.minSubFileCount && (
            <Descriptions.Item label="File Count Range">
              {`${selectedMonitoring?.metaData?.monitoringData?.minSubFileCount} - ${selectedMonitoring?.metaData?.monitoringData?.maxSubFileCount}`}
            </Descriptions.Item>
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
          setMonitoring={setFileMonitoring}
          monitoringTypeLabel={monitoringTypeName}
          evaluateMonitoring={fileMonitoringService.evaluate}
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
          handleBulkUpdateMonitorings={fileMonitoringService.bulkUpdate}
        />
      )}
    </>
  );
}

export default FileMonitoring;
