import React, { useState, useEffect } from 'react';
import { message, Form, Descriptions, Tag } from 'antd';
import { useSelector } from 'react-redux';
import BreadCrumbs from '../../common/BreadCrumbs';
import OrbitMonitoringTable from './OrbitMonitoringTable';
import AddEditModal from './AddEditModal/Modal';
import MonitoringDetailsModal from '../../common/Monitoring/MonitoringDetailsModal';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal';
import MonitoringActionButton from '../../common/Monitoring/ActionButton.jsx';
import { getRoleNameArray } from '../../common/AuthUtil.js';
import { useDomainAndCategories } from '@/hooks/useDomainsAndProductCategories';
import { useMonitorType } from '@/hooks/useMonitoringType';
import orbitProfileMonitoringService  from '../../../services/orbitProfileMonitoring.service';
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
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const clusters = useSelector((state) => state.application.clusters);
  
  // User permissions
  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;


  const { monitoringTypeId } = useMonitorType(monitoringTypeName);
  const {
    domains,
    selectedDomain,
    setSelectedDomain,
    productCategories,
  } = useDomainAndCategories(monitoringTypeId);

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
      message.error('Failed to fetch orbit monitoring data');
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
        message.success('Monitoring updated successfully');
      } else {
        response = await orbitProfileMonitoringService.create(formData, applicationId);
        if (isDuplicate) {
          message.success('Monitoring duplicated successfully');
        } else {
          message.success('Monitoring created successfully');
        }
      }
      
      // Refresh data and close modal
      await fetchOrbitMonitoring();
      setDisplayAddEditModal(false);
      resetStates();
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred while saving';
      message.error(errorMessage);
      throw error;
    } finally {
      setSavingOrbitMonitoring(false);
    }
  };

  const handleAddMonitoring = () => {
    resetStates();
    setDisplayAddEditModal(true);
  };

  const handleEditMonitoring = (monitoring) => {
    setSelectedMonitoring(monitoring);
    setIsEditing(true);
    setDisplayAddEditModal(true);
  };

  const handleCopyMonitoring = (monitoring) => {
    // Create a copy with modified name
    const copiedMonitoring = {
      ...monitoring,
      name: `${monitoring.name} (Copy)`,
      id: null // Remove ID so it creates a new record
    };
    setSelectedMonitoring(copiedMonitoring);
    // setIsDuplicating(true);
    setDisplayAddEditModal(true);
  };

  const handleDeleteMonitoring = async (ids) => {
    try {
      await orbitProfileMonitoringService.delete(ids);
      message.success('Monitoring deleted successfully');
      await fetchOrbitMonitoring();
    } catch (err) {
      message.error('Failed to delete monitoring');
      console.error('Delete error:', err);
    }
  };

  const handleToggleStatus = async (ids, isActive) => {
    try {
      await orbitProfileMonitoringService.toggleStatus(ids, isActive);
      message.success(`Monitoring ${isActive ? 'started' : 'paused'} successfully`);
      await fetchOrbitMonitoring();
    } catch (err) {
      message.error('Failed to toggle monitoring status');
      console.error('Toggle error:', err);
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
          {selectedMonitoring?.metaData?.notificationConditions && selectedMonitoring.metaData.notificationConditions.length > 0 && (
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
