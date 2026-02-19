import React, { useState, useEffect } from 'react';
import { Form, Descriptions, Tag } from 'antd';
import { useSelector } from 'react-redux';
import { handleError, handleSuccess } from '../../common/handleResponse';
import BreadCrumbs from '../../common/BreadCrumbs';
import OrbitMonitoringTable from './OrbitMonitoringTable';
import AddEditModal from './AddEditModal/Modal';
import MonitoringDetailsModal from '../../common/Monitoring/MonitoringDetailsModal';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal';
import BulkUpdateModal from '../../common/Monitoring/BulkUpdateModal';
import MonitoringActionButton from '../../common/Monitoring/ActionButton';
import OrbitProfileMonitoringFilters from './OrbitProfileMonitoringFilters';
import { getRoleNameArray } from '../../common/AuthUtil';
import { useDomainAndCategories } from '@/hooks/useDomainsAndProductCategories';
import { useMonitorType } from '@/hooks/useMonitoringType';
import { useMonitoringsAndAllProductCategories } from '@/hooks/useMonitoringsAndAllProductCategories';
import orbitProfileMonitoringService from '../../../services/orbitProfileMonitoring.service';
import styles from './orbitMonitoring.module.css';

const monitoringTypeName = 'Orbit Profile Monitoring';

const OrbitMonitoring: React.FC = () => {
  const [filteredOrbitMonitoring, setFilteredOrbitMonitoring] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [displayAddEditModal, setDisplayAddEditModal] = useState<boolean>(false);
  const [displayViewDetailsModal, setDisplayViewDetailsModal] = useState<boolean>(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savingOrbitMonitoring, setSavingOrbitMonitoring] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDuplicating, setIsDuplicating] = useState<boolean>(false);
  const [erroneousTabs, setErroneousTabs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('0');
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [displayApproveRejectModal, setDisplayApproveRejectModal] = useState<boolean>(false);
  const [bulkEditModalVisibility, setBulkEditModalVisibility] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>({});
  const [filtersVisible, setFiltersVisible] = useState<boolean>(true);
  const [matchCount, setMatchCount] = useState<number>(0);

  const [form] = Form.useForm();
  const applicationId = useSelector((state: any) => state.application.application.applicationId);

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  const { monitoringTypeId } = useMonitorType(monitoringTypeName as string);
  const { domains, selectedDomain, setSelectedDomain, productCategories } = useDomainAndCategories(
    monitoringTypeId,
    selectedMonitoring
  );

  const {
    monitorings: orbitMonitoringData,
    setMonitorings: setOrbitMonitoringData,
    allProductCategories,
  } = useMonitoringsAndAllProductCategories(applicationId, orbitProfileMonitoringService.getAll as any);

  useEffect(() => {
    if (!orbitMonitoringData || orbitMonitoringData.length === 0) return;

    const { approvalStatus, activeStatus, domain, product, creator } = filters || {};

    let activeStatusBool: boolean | undefined;
    if (activeStatus === 'Active') activeStatusBool = true;
    else if (activeStatus === 'Inactive') activeStatusBool = false;

    let filteredOm = orbitMonitoringData.filter((orbit: any) => {
      let include = true;
      if (approvalStatus && orbit.approvalStatus !== approvalStatus) include = false;
      if (activeStatusBool !== undefined && orbit.isActive !== activeStatusBool) include = false;

      const currentDomain = orbit.metaData?.asrSpecificMetaData?.domain || null;
      if (domain && currentDomain !== domain) include = false;

      const currentProduct = orbit.metaData?.asrSpecificMetaData?.productCategory || null;
      if (product && currentProduct !== product) include = false;

      const currentCreator = orbit.createdBy || null;
      if (creator && currentCreator !== creator) include = false;

      return include;
    });

    const matchedOrbitIds: any[] = [];
    if (searchTerm) {
      setIsLoading(true);
      let instanceCount = 0;
      filteredOm.forEach((orbit: any) => {
        const monitoringName = (orbit.monitoringName || '').toLowerCase();
        const description = (orbit.description || '').toLowerCase();
        const buildName = (orbit.metaData?.asrSpecificMetaData?.buildName || '').toLowerCase();

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

    if (matchedOrbitIds.length > 0) filteredOm = filteredOm.filter((orbit: any) => matchedOrbitIds.includes(orbit.id));
    else if (matchedOrbitIds.length === 0 && searchTerm) filteredOm = [];

    setFilteredOrbitMonitoring(filteredOm);
    setIsLoading(false);
  }, [filters, orbitMonitoringData, searchTerm, setOrbitMonitoringData]);

  const handleToggleFilters = () => setFiltersVisible(prev => !prev);

  const resetStates = () => {
    setSelectedMonitoring(null);
    setIsEditing(false);
    setIsDuplicating(false);
    setErroneousTabs([]);
    setActiveTab('0');
    form.resetFields();
  };

  const saveOrbitMonitoring = async (formData: any, isUpdate = false, isDuplicate = false) => {
    try {
      setSavingOrbitMonitoring(true);
      let response;
      if (isUpdate && selectedMonitoring?.id) {
        response = await orbitProfileMonitoringService.updateOne(selectedMonitoring.id, formData);
        handleSuccess('Monitoring updated successfully');
      } else {
        response = await orbitProfileMonitoringService.create({ ...formData, applicationId });
        handleSuccess(isDuplicate ? 'Monitoring duplicated successfully' : 'Monitoring created successfully');
      }
      const refreshedData = await orbitProfileMonitoringService.getAll({ applicationId });
      setOrbitMonitoringData(refreshedData || []);
      setDisplayAddEditModal(false);
      resetStates();
      return response;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'An error occurred while saving';
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

  const handleEditMonitoring = (monitoring: any) => {
    setSelectedMonitoring(monitoring);
    setIsEditing(true);
    setDisplayAddEditModal(true);
  };

  const handleCopyMonitoring = (monitoring: any) => {
    const { id, ...copiedMonitoring } = monitoring;
    setSelectedMonitoring(copiedMonitoring);
    setIsDuplicating(true);
    setDisplayAddEditModal(true);
  };

  const handleDeleteMonitoring = async (id: any) => {
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

  const handleToggleStatus = async (ids: any[], isActive: boolean) => {
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

  const handleBulkStartPauseOrbitMonitorings = async ({ ids, action }: any) => {
    try {
      const isActive = action === 'start';
      await orbitProfileMonitoringService.toggleStatus(ids, isActive);
      setOrbitMonitoringData((prev: any[]) => prev.map(m => (ids.includes(m.id) ? { ...m, isActive } : m)));
      setSelectedRows([]);
      handleSuccess(`Selected orbit monitorings ${action === 'start' ? 'started' : 'paused'} successfully`);
    } catch (err) {
      handleError('Unable to start/pause selected orbit monitorings');
      console.error('Bulk start/pause error:', err);
    }
  };

  const handleBulkDeleteSelectedOrbitMonitorings = async (ids: any[]) => {
    try {
      await orbitProfileMonitoringService.delete(ids);
      setOrbitMonitoringData((prev: any[]) => prev.filter(om => !ids.includes(om.id)));
      setSelectedRows([]);
      handleSuccess('Selected orbit monitorings deleted successfully');
    } catch (err) {
      handleError('Unable to delete selected orbit monitorings');
      console.error('Bulk delete error:', err);
    }
  };

  const handleBulkUpdateOrbitMonitorings = async ({ updatedData }: any) => {
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
                {selectedMonitoring.metaData.notificationConditions.map((condition: any, index: number) => (
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
