import React, { useState, useEffect } from 'react';
import { Form, Descriptions, Tag } from 'antd';
import { useSelector } from 'react-redux';
import { handleError, handleSuccess } from '../../common/handleResponse.jsx';
import BreadCrumbs from '../../common/BreadCrumbs.jsx';
import OrbitMonitoringTable from './OrbitMonitoringTable.jsx';
import AddEditModal from './AddEditModal/Modal.jsx';
import MonitoringDetailsModal from '../../common/Monitoring/MonitoringDetailsModal.jsx';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal.jsx';
import BulkUpdateModal from '../../common/Monitoring/BulkUpdateModal.jsx';
import MonitoringActionButton from '../../common/Monitoring/ActionButton.jsx';
import OrbitProfileMonitoringFilters from './OrbitProfileMonitoringFilters.jsx';
import { getRoleNameArray } from '../../common/AuthUtil.js';
import { useDomainAndCategories } from '@/hooks/useDomainsAndProductCategories';
import { useMonitorType } from '@/hooks/useMonitoringType';
import { useMonitoringsAndAllProductCategories } from '@/hooks/useMonitoringsAndAllProductCategories';
import orbitProfileMonitoringService from '../../../services/orbitProfileMonitoring.service.js';
import styles from './orbitMonitoring.module.css';

// Constants
const monitoringTypeName = 'Orbit Profile Monitoring';

const OrbitMonitoring = () => {
  const [filteredOrbitMonitoring, setFilteredOrbitMonitoring] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayAddEditModal, setDisplayAddEditModal] = useState(false);
  const [displayViewDetailsModal, setDisplayViewDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingOrbitMonitoring, setSavingOrbitMonitoring] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [erroneousTabs, setErroneousTabs] = useState([]);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [displayApproveRejectModal, setDisplayApproveRejectModal] = useState(false);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState(false);
  const [filters, setFilters] = useState({});
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filteringOrbits, setFilteringOrbits] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const [form] = Form.useForm();
  const applicationId = useSelector(state => state.application.application.applicationId);

  // User permissions
  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  const { monitoringTypeId } = useMonitorType(monitoringTypeName);
  const { domains, selectedDomain, setSelectedDomain, productCategories } = useDomainAndCategories(
    monitoringTypeId,
    selectedMonitoring
  );

  // Use the hook to get monitorings and all product categories
  const {
    monitorings: orbitMonitoringData,
    setMonitorings: setOrbitMonitoringData,
    allProductCategories,
  } = useMonitoringsAndAllProductCategories(applicationId, orbitProfileMonitoringService.getAll);

  // Filter logic
  useEffect(() => {
    setFilteringOrbits(true);
    if (orbitMonitoringData.length === 0) {
      setFilteringOrbits(false);
      return;
    }

    const { approvalStatus, activeStatus, domain, product, creator } = filters;

    // Convert activeStatus to boolean
    let activeStatusBool;
    if (activeStatus === 'Active') {
      activeStatusBool = true;
    } else if (activeStatus === 'Inactive') {
      activeStatusBool = false;
    }

    let filteredOm = orbitMonitoringData.filter(orbitMonitoring => {
      let include = true;

      if (approvalStatus && orbitMonitoring.approvalStatus !== approvalStatus) {
        include = false;
      }
      if (activeStatusBool !== undefined && orbitMonitoring.isActive !== activeStatusBool) {
        include = false;
      }

      // Domain filter
      const currentDomain = orbitMonitoring.metaData?.asrSpecificMetaData?.domain || null;
      if (domain && currentDomain !== domain) {
        include = false;
      }

      // Product category filter
      const currentProduct = orbitMonitoring.metaData?.asrSpecificMetaData?.productCategory || null;
      if (product && currentProduct !== product) {
        include = false;
      }

      // Creator filter
      const currentCreator = orbitMonitoring.createdBy || null;
      if (creator && currentCreator !== creator) {
        include = false;
      }

      return include;
    });

    const matchedOrbitIds = [];

    // Calculate the number of matched string instances
    if (searchTerm) {
      let instanceCount = 0;
      filteredOm.forEach(orbit => {
        const monitoringName = orbit.monitoringName.toLowerCase();
        const description = orbit.description?.toLowerCase() || '';
        const buildName = orbit.metaData?.asrSpecificMetaData?.buildName?.toLowerCase() || '';

        if (monitoringName.includes(searchTerm)) {
          matchedOrbitIds.push(orbit.id);
          instanceCount++;
        }

        if (description.includes(searchTerm)) {
          matchedOrbitIds.push(orbit.id);
          instanceCount++;
        }

        if (buildName.includes(searchTerm)) {
          matchedOrbitIds.push(orbit.id);
          instanceCount++;
        }
      });

      setMatchCount(instanceCount);
    } else {
      setMatchCount(0);
    }

    if (matchedOrbitIds.length > 0) {
      filteredOm = filteredOm.filter(orbit => matchedOrbitIds.includes(orbit.id));
    } else if (matchedOrbitIds.length === 0 && searchTerm) {
      filteredOm = [];
    }

    setFilteredOrbitMonitoring(filteredOm);
    setFilteringOrbits(false);
  }, [filters, orbitMonitoringData, searchTerm]);

  const handleToggleFilters = () => setFiltersVisible(prev => !prev);

  // Reset modal states
  const resetStates = () => {
    setSelectedMonitoring(null);
    setIsEditing(false);
    setIsDuplicating(false);
    setErroneousTabs([]);
    setActiveTab('0');
    form.resetFields();
  };

  // Reusable save function for create, update, and duplicate
  const saveOrbitMonitoring = async (formData, isUpdate = false, isDuplicate = false) => {
    try {
      setSavingOrbitMonitoring(true);
      let response;

      if (isUpdate && selectedMonitoring?.id) {
        response = await orbitProfileMonitoringService.updateOne(selectedMonitoring.id, formData);
        handleSuccess('Monitoring updated successfully');
      } else {
        response = await orbitProfileMonitoringService.create(formData, applicationId);
        if (isDuplicate) {
          handleSuccess('Monitoring duplicated successfully');
        } else {
          handleSuccess('Monitoring created successfully');
        }
      }

      // Refresh data and close modal
      const refreshedData = await orbitProfileMonitoringService.getAll({ applicationId });
      setOrbitMonitoringData(refreshedData || []);
      setDisplayAddEditModal(false);
      resetStates();

      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred while saving';
      handleError(errorMessage);
      throw error;
    } finally {
      setSavingOrbitMonitoring(false);
    }
  };

  const handleAddMonitoring = () => {
    resetStates();
    setDisplayAddEditModal(true);
  };

  const handleEditMonitoring = monitoring => {
    setSelectedMonitoring(monitoring);
    setIsEditing(true);
    setDisplayAddEditModal(true);
  };

  const handleCopyMonitoring = monitoring => {
    // Create a copy with modified name
    const copiedMonitoring = {
      ...monitoring,
      id: null, // Remove ID so it creates a new record
    };
    setSelectedMonitoring(copiedMonitoring);
    setIsDuplicating(true);
    setDisplayAddEditModal(true);
  };

  const handleDeleteMonitoring = async id => {
    try {
      await orbitProfileMonitoringService.delete([id]);
      handleSuccess('Monitoring deleted successfully');
      const refreshedData = await orbitProfileMonitoringService.getAll({ applicationId });
      setOrbitMonitoringData(refreshedData || []);
    } catch (err) {
      handleError('Failed to delete monitoring');
      console.error('Delete error:', err);
    }
  };

  const handleToggleStatus = async (ids, isActive) => {
    try {
      await orbitProfileMonitoringService.toggleStatus(ids, isActive);
      handleSuccess(`Monitoring ${isActive ? 'started' : 'paused'} successfully`);
      const refreshedData = await orbitProfileMonitoringService.getAll({ applicationId });
      setOrbitMonitoringData(refreshedData || []);
    } catch (err) {
      handleError('Failed to toggle monitoring status');
      console.error('Toggle error:', err);
    }
  };

  const handleBulkStartPauseOrbitMonitorings = async ({ ids, action }) => {
    try {
      const isActive = action === 'start';
      await orbitProfileMonitoringService.toggleStatus(ids, isActive);
      setOrbitMonitoringData(prev => prev.map(m => (ids.includes(m.id) ? { ...m, isActive } : m)));
      setSelectedRows([]);
      handleSuccess(`Selected orbit monitorings ${action === 'start' ? 'started' : 'paused'} successfully`);
    } catch (err) {
      handleError('Unable to start/pause selected orbit monitorings');
      console.error('Bulk start/pause error:', err);
    }
  };

  const handleBulkDeleteSelectedOrbitMonitorings = async ids => {
    try {
      await orbitProfileMonitoringService.delete(ids);
      setOrbitMonitoringData(prev => prev.filter(om => !ids.includes(om.id)));
      setSelectedRows([]);
      handleSuccess('Selected orbit monitorings deleted successfully');
    } catch (err) {
      handleError('Unable to delete selected orbit monitorings');
      console.error('Bulk delete error:', err);
    }
  };

  const handleBulkUpdateOrbitMonitorings = async ({ updatedData }) => {
    try {
      await orbitProfileMonitoringService.bulkUpdate(updatedData);
      const refreshedData = await orbitProfileMonitoringService.getAll({ applicationId });
      setOrbitMonitoringData(refreshedData || []);
    } catch (err) {
      console.error('Bulk update error:', err);
      throw err;
    }
  };

  return (
    <div className={styles.container}>
      <BreadCrumbs
        extraContent={
          <MonitoringActionButton
            label="Orbit Monitoring Actions"
            isReader={isReader}
            selectedRows={selectedRows}
            onAdd={handleAddMonitoring}
            onBulkEdit={() => setBulkEditModalVisibility(true)}
            onBulkApproveReject={() => setDisplayApproveRejectModal(true)}
            onBulkStartPause={handleBulkStartPauseOrbitMonitorings}
            onBulkDelete={handleBulkDeleteSelectedOrbitMonitorings}
            showBulkApproveReject={true}
            showFiltersToggle={true}
            onToggleFilters={handleToggleFilters}
          />
        }
      />

      <OrbitProfileMonitoringFilters
        setFilters={setFilters}
        orbitMonitorings={orbitMonitoringData}
        filtersVisible={filtersVisible}
        setFiltersVisible={setFiltersVisible}
        setSearchTerm={setSearchTerm}
        matchCount={matchCount}
        searchTerm={searchTerm}
        domains={domains}
        setSelectedDomain={setSelectedDomain}
        selectedDomain={selectedDomain}
        productCategories={productCategories}
        allProductCategories={allProductCategories}
      />

      <div className={styles.content}>
        <OrbitMonitoringTable
          orbitMonitoringData={filteredOrbitMonitoring}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onEdit={handleEditMonitoring}
          onCopy={handleCopyMonitoring}
          onDelete={handleDeleteMonitoring}
          onToggleStatus={handleToggleStatus}
          loading={isLoading}
          setDisplayViewDetailsModal={setDisplayViewDetailsModal}
          setSelectedMonitoring={setSelectedMonitoring}
          isReader={isReader}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          applicationId={applicationId}
          setApproveRejectModal={setDisplayApproveRejectModal}
        />
      </div>

      {displayAddEditModal && (
        <AddEditModal
          displayAddEditModal={displayAddEditModal}
          setDisplayAddEditModal={setDisplayAddEditModal}
          saveOrbitMonitoring={saveOrbitMonitoring}
          form={form}
          domains={domains}
          productCategories={productCategories}
          applicationId={applicationId}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          isEditing={isEditing}
          isDuplicating={isDuplicating}
          erroneousTabs={erroneousTabs}
          setErroneousTabs={setErroneousTabs}
          resetStates={resetStates}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedMonitoring={selectedMonitoring}
          orbitMonitoringData={orbitMonitoringData}
          savingOrbitMonitoring={savingOrbitMonitoring}
        />
      )}

      {displayViewDetailsModal && (
        <MonitoringDetailsModal
          monitoringTypeName={monitoringTypeName}
          displayMonitoringDetailsModal={displayViewDetailsModal}
          setDisplayMonitoringDetailsModal={setDisplayViewDetailsModal}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          domains={domains}
          productCategories={productCategories}>
          {selectedMonitoring?.metaData?.asrSpecificMetaData?.buildName && (
            <Descriptions.Item label="Build Name">
              {selectedMonitoring.metaData.asrSpecificMetaData.buildName}
            </Descriptions.Item>
          )}
          {selectedMonitoring?.metaData?.notificationConditions &&
            selectedMonitoring.metaData.notificationConditions.length > 0 && (
              <Descriptions.Item label="Notification Conditions">
                {selectedMonitoring.metaData.notificationConditions.map((condition, index) => (
                  <Tag key={`oc-${index}`} style={{ marginBottom: '4px' }}>
                    {condition}
                  </Tag>
                ))}
              </Descriptions.Item>
            )}
        </MonitoringDetailsModal>
      )}

      {displayApproveRejectModal && (
        <ApproveRejectModal
          visible={displayApproveRejectModal}
          onCancel={() => setDisplayApproveRejectModal(false)}
          selectedMonitoring={selectedMonitoring}
          setSelectedMonitoring={setSelectedMonitoring}
          selectedRows={selectedRows}
          setMonitoring={setOrbitMonitoringData}
          monitoringTypeLabel={monitoringTypeName}
          evaluateMonitoring={orbitProfileMonitoringService.evaluate}
        />
      )}

      {bulkEditModalVisibility && (
        <BulkUpdateModal
          bulkEditModalVisibility={bulkEditModalVisibility}
          setBulkEditModalVisibility={setBulkEditModalVisibility}
          monitorings={orbitMonitoringData}
          setMonitorings={setOrbitMonitoringData}
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          monitoringType="orbit"
          handleBulkUpdateMonitorings={handleBulkUpdateOrbitMonitorings}
        />
      )}
    </div>
  );
};

export default OrbitMonitoring;
