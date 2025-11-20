import React, { useState, useEffect } from 'react';
import { Form, Descriptions, Tag } from 'antd';
import { useSelector } from 'react-redux';
import { handleError, handleSuccess } from '../../common/handleResponse.jsx';
import BreadCrumbs from '../../common/BreadCrumbs.jsx';
import OrbitMonitoringTable from './OrbitMonitoringTable.jsx';
import AddEditModal from './AddEditModal/Modal.jsx';
import MonitoringDetailsModal from '../../common/Monitoring/MonitoringDetailsModal.jsx';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal.jsx';
import MonitoringActionButton from '../../common/Monitoring/ActionButton.jsx';
import { getRoleNameArray } from '../../common/AuthUtil.js';
import { useDomainAndCategories } from '@/hooks/useDomainsAndProductCategories';
import { useMonitorType } from '@/hooks/useMonitoringType';
import orbitProfileMonitoringService from '../../../services/orbitProfileMonitoring.service.js';
import styles from './orbitMonitoring.module.css';

// Constants
const monitoringTypeName = 'Orbit Profile Monitoring';

const OrbitMonitoring = () => {
  const [orbitMonitoringData, setOrbitMonitoringData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayAddEditModal, setDisplayAddEditModal] = useState(false);
  const [displayViewDetailsModal, setDisplayViewDetailsModal] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingOrbitMonitoring, setSavingOrbitMonitoring] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [erroneousTabs, setErroneousTabs] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [displayApproveRejectModal, setDisplayApproveRejectModal] = useState(false);

  const [form] = Form.useForm();
  const applicationId = useSelector(state => state.application.application.applicationId);
  const clusters = useSelector(state => state.application.clusters);

  // User permissions
  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  const { monitoringTypeId } = useMonitorType(monitoringTypeName);
  const { domains, selectedDomain, setSelectedDomain, productCategories } = useDomainAndCategories(monitoringTypeId);

  useEffect(() => {
    if (applicationId) {
      fetchOrbitMonitoring();
    }
  }, [applicationId]);

  // Fetch Orbit Monitoring data function
  const fetchOrbitMonitoring = async () => {
    try {
      setIsLoading(true);
      const response = await orbitProfileMonitoringService.getAll(applicationId);
      setOrbitMonitoringData(response || []);
    } catch (err) {
      handleError('Failed to fetch orbit monitoring data');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset modal states
  const resetStates = () => {
    setSelectedMonitoring(null);
    setIsEditing(false);
    setErroneousTabs([]);
    setSelectedCluster(null);
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
      await fetchOrbitMonitoring();
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
      name: `${monitoring.name} (Copy)`,
      id: null, // Remove ID so it creates a new record
    };
    setSelectedMonitoring(copiedMonitoring);
    // setIsDuplicating(true);
    setDisplayAddEditModal(true);
  };

  const handleDeleteMonitoring = async id => {
    try {
      await orbitProfileMonitoringService.delete([id]);
      handleSuccess('Monitoring deleted successfully');
      await fetchOrbitMonitoring();
    } catch (err) {
      handleError('Failed to delete monitoring');
      console.error('Delete error:', err);
    }
  };

  const handleToggleStatus = async (ids, isActive) => {
    try {
      await orbitProfileMonitoringService.toggleStatus(ids, isActive);
      handleSuccess(`Monitoring ${isActive ? 'started' : 'paused'} successfully`);
      await fetchOrbitMonitoring();
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

  return (
    <div className={styles.container}>
      <BreadCrumbs
        extraContent={
          <MonitoringActionButton
            label="Orbit Monitoring Actions"
            isReader={isReader}
            selectedRows={selectedRows}
            onAdd={handleAddMonitoring}
            onBulkStartPause={handleBulkStartPauseOrbitMonitorings}
            onBulkDelete={handleBulkDeleteSelectedOrbitMonitorings}
            showBulkApproveReject={false}
            showFiltersToggle={false}
          />
        }
      />

      <div className={styles.content}>
        <OrbitMonitoringTable
          orbitMonitoringData={orbitMonitoringData}
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
          clusters={clusters}
          domains={domains}
          productCategories={productCategories}
          applicationId={applicationId}
          // setProductCategories={setProductCategories}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          // monitoringType={monitoringTypeId}
          // setMonitoringType={setMonitoringType}
          isEditing={isEditing}
          erroneousTabs={erroneousTabs}
          setErroneousTabs={setErroneousTabs}
          resetStates={resetStates}
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedMonitoring={selectedMonitoring}
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
          clusters={clusters}
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
    </div>
  );
};

export default OrbitMonitoring;
