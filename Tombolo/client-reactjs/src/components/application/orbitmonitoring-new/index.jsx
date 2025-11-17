import { useState, useEffect, useRef } from 'react';

// Local Imports
import BreadCrumbs from '../../common/BreadCrumbs';
import { useSelector } from 'react-redux';
import { Form } from 'antd';
import { getRoleNameArray } from '../../common/AuthUtil';
import AddEditModal from './AddEditModal/Modal';
import MonitoringActionButton from '../../common/Monitoring/ActionButton';
import OrbitMonitoringTable from './OrbitMonitoringTable';
import ApproveRejectModal from '../../common/Monitoring/ApproveRejectModal';
import { Constants } from '../../common/Constants';
import { handleError, handleSuccess } from '../../common/handleResponse';
import orbitProfileMonitoringService from '@/services/orbitProfileMonitoring.service';

// Constants
const monitoringTypeName = 'Orbit Monitoring New';

const OrbitMonitoringNew = () => {
  // Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const clusters = useSelector((state) => state.application.clusters);

  // Constants
  const [form] = Form.useForm();
  const isMonitoringTypeIdFetched = useRef(false);
  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  //Local States
  const [displayAddEditModal, setDisplayAddEditModal] = useState(false);
  const [orbitMonitoring, setOrbitMonitoring] = useState([]);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [editingMonitoring, setEditingMonitoring] = useState(false);
  const [displayViewDetailsModal, setDisplayViewDetailsModal] = useState(false);
  const [displayApprovalModal, setDisplayApprovalModal] = useState(false);
  const [savingOrbitMonitoring, setSavingOrbitMonitoring] = useState(false);
  const [erroneousTabs, setErroneousTabs] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeTab, setActiveTab] = useState('0');
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [duplicatingData, setDuplicatingData] = useState({ isDuplicating: false });

  // Save orbit monitoring - can be reused for duplicate and edit
  const saveOrbitMonitoring = async (formData, isEditing = false) => {
    setSavingOrbitMonitoring(true);
    
    try {
      // Trim string values
      const trimmedData = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          trimmedData[key] = value.trim();
        } else {
          trimmedData[key] = value;
        }
      });

      // Prepare metadata structure similar to cluster monitoring
      const asrSpecificMetaData = {};
      const { domain, productCategory, severity } = trimmedData;
      const asrSpecificFields = { domain, productCategory, severity };
      
      for (let key in asrSpecificFields) {
        if (asrSpecificFields[key] !== undefined) {
          asrSpecificMetaData[key] = asrSpecificFields[key];
        }
        delete trimmedData[key];
      }

      // Group notification specific metadata
      const contacts = {};
      const { primaryContacts, secondaryContacts, notifyContacts } = trimmedData;
      const allContacts = { primaryContacts, secondaryContacts, notifyContacts };
      
      for (let key in allContacts) {
        if (allContacts[key] !== undefined) {
          contacts[key] = allContacts[key];
        }
        delete trimmedData[key];
      }

      // Create metadata object
      const metaData = {
        asrSpecificMetaData,
        contacts,
        monitoringDetails: {} // Add any additional monitoring details if needed
      };

      // Final payload
      const payload = {
        ...trimmedData,
        metaData
      };

      if (isEditing) {
        const responseData = await orbitProfileMonitoringService.updateOne(selectedMonitoring.id, payload);
        setOrbitMonitoring(orbitMonitoring.map(monitoring => 
          monitoring.id === selectedMonitoring.id ? responseData : monitoring
        ));
        handleSuccess('Orbit monitoring updated successfully');
      } else {
        const responseData = await orbitProfileMonitoringService.create(payload, applicationId);
        setOrbitMonitoring([responseData, ...orbitMonitoring]);
        handleSuccess('Orbit monitoring created successfully');
      }

      setDisplayAddEditModal(false);
      resetStates();
    } catch (error) {
      handleError(error.message || 'Failed to save orbit monitoring');
    } finally {
      setSavingOrbitMonitoring(false);
    }
  };

  const handleSaveOrbitMonitoring = async (formData) => {
    await saveOrbitMonitoring(formData, false);
  };

  const handleUpdateOrbitMonitoring = async (formData) => {
    await saveOrbitMonitoring(formData, true);
  };

  const handleDeleteOrbitMonitoring = async (ids) => {
    try {
      // Handle both single ID and array of IDs
      const idsToDelete = Array.isArray(ids) ? ids : [ids];
      
      await orbitProfileMonitoringService.delete(idsToDelete);
      setOrbitMonitoring(prev => prev.filter(monitoring => !idsToDelete.includes(monitoring.id)));
      handleSuccess('Orbit monitoring deleted successfully');
    } catch (error) {
      handleError(error.message || 'Failed to delete orbit monitoring');
    }
  };

  const handleApproveReject = async (action, data) => {
    try {
      // This would typically call an evaluate service
      await orbitProfileMonitoringService.evaluate(data);
      handleSuccess(`Orbit monitoring ${action.toLowerCase()}d successfully`);
      setDisplayApprovalModal(false);
      
      // Refresh data
      const refreshedData = await orbitProfileMonitoringService.getAll(applicationId);
      setOrbitMonitoring(refreshedData);
    } catch (error) {
      handleError(error.message || `Failed to ${action.toLowerCase()} orbit monitoring`);
    }
  };

  const handleToggleStatus = async (ids, isActive) => {
    try {
      const idsToToggle = Array.isArray(ids) ? ids : [ids];
      await orbitProfileMonitoringService.toggleStatus(idsToToggle, isActive);
      
      // Update local state
      setOrbitMonitoring(prev => 
        prev.map(monitoring => 
          idsToToggle.includes(monitoring.id) 
            ? { ...monitoring, isActive } 
            : monitoring
        )
      );
      
      handleSuccess(`Orbit monitoring ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      handleError(error.message || 'Failed to toggle orbit monitoring status');
    }
  };

  const handleCopyMonitoring = (monitoring) => {
    // Set up for duplication
    setSelectedMonitoring(monitoring);
    setDuplicatingData({ isDuplicating: true });
    setDisplayAddEditModal(true);
    
    // Pre-populate form with copied data but generate new name
    const newName = `${monitoring.name} - Copy`;
    form.setFieldsValue({
      ...monitoring,
      name: newName,
      ...monitoring?.metaData?.contacts,
      ...monitoring?.metaData?.asrSpecificMetaData,
    });
  };

  const resetStates = () => {
    setEditingMonitoring(false);
    setSelectedMonitoring(null);
    setSelectedCluster(null);
    setActiveTab('0');
    setErroneousTabs([]);
    setDuplicatingData({ isDuplicating: false });
    form.resetFields();
  };

  const openAddEditModal = () => {
    resetStates();
    setDisplayAddEditModal(true);
  };

  const openEditModal = (record) => {
    setEditingMonitoring(true);
    setSelectedMonitoring(record);
    
    // Pre-populate form with existing data
    form.setFieldsValue({
      ...record,
      ...record?.metaData?.contacts,
      ...record?.metaData?.asrSpecificMetaData,
    });
    
    setDisplayAddEditModal(true);
  };

  const openApprovalModal = (record) => {
    setSelectedMonitoring(record);
    setDisplayApprovalModal(true);
  };

  // Fetch orbit monitoring data on component mount
  useEffect(() => {
    const fetchOrbitMonitoring = async () => {
      try {
        const data = await orbitProfileMonitoringService.getAll(applicationId);
        setOrbitMonitoring(data);
      } catch (error) {
        console.error('Error fetching orbit monitoring:', error);
        handleError('Failed to fetch orbit monitoring data');
      }
    };

    if (applicationId) {
      fetchOrbitMonitoring();
    }
  }, [applicationId]);

  return (
    <div style={{ padding: '20px' }}>
      <BreadCrumbs
        extraContent={
          !isReader && (
            <MonitoringActionButton
              selectedRows={selectedRows}
              onAdd={openAddEditModal}
              onBulkDelete={handleDeleteOrbitMonitoring}
              onBulkStartPause={({ ids, action }) => {
                const isActive = action === 'start';
                handleToggleStatus(ids, isActive);
              }}
              showBulkActions={selectedRows.length > 0}
            />
          )
        }
      />

      <OrbitMonitoringTable
        orbitMonitoring={orbitMonitoring}
        applicationId={applicationId}
        setSelectedMonitoring={setSelectedMonitoring}
        isReader={isReader}
        setDisplayViewDetailsModal={setDisplayViewDetailsModal}
        setDisplayAddEditModal={setDisplayAddEditModal}
        setEditingMonitoring={setEditingMonitoring}
        setApproveRejectModal={setDisplayApprovalModal}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        setDuplicatingData={setDuplicatingData}
        setOrbitMonitoring={setOrbitMonitoring}
      />

      {displayAddEditModal && (
        <AddEditModal
          displayAddEditModal={displayAddEditModal}
          setDisplayAddEditModal={setDisplayAddEditModal}
          handleSaveOrbitMonitoring={handleSaveOrbitMonitoring}
          handleUpdateOrbitMonitoring={handleUpdateOrbitMonitoring}
          form={form}
          clusters={clusters}
          isEditing={editingMonitoring}
          isDuplicating={duplicatingData.isDuplicating}
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
        <div>
          {/* ViewDetailsModal placeholder - implement when needed */}
          <div>View Details Modal - {selectedMonitoring?.name}</div>
          <button onClick={() => setDisplayViewDetailsModal(false)}>Close</button>
        </div>
      )}

      {displayApprovalModal && (
        <ApproveRejectModal
          open={displayApprovalModal}
          setOpen={setDisplayApprovalModal}
          selectedMonitoring={selectedMonitoring}
          handleApproveReject={handleApproveReject}
          monitoringType="Orbit Monitoring"
        />
      )}
    </div>
  );
};

export default OrbitMonitoringNew;
