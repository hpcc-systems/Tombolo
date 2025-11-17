import React, { useState, useEffect } from 'react';
import { Modal, message } from 'antd';
import { useSelector } from 'react-redux';
import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import OrbitMonitoringTable from './OrbitMonitoringTable';
import AddEditModal from './AddEditModal/Modal';
import { orbitProfileMonitoringService } from '../../../services/orbitProfileMonitoringService';
import styles from './orbitMonitoring.module.css';

const OrbitMonitoring = () => {
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const applicationId = useSelector((state) => state.application.application.applicationId);

  useEffect(() => {
    if (applicationId) {
      fetchOrbitMonitoring();
    }
  }, [applicationId]);

  const fetchOrbitMonitoring = async () => {
    try {
      setIsLoading(true);
      const response = await orbitProfileMonitoringService.getAll(applicationId);
      setData(response.data || []);
    } catch (err) {
      message.error('Failed to fetch orbit monitoring data');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable save function for create, update, and duplicate
  const saveOrbitMonitoring = async (formData, isUpdate = false, isDuplicate = false) => {
    try {
      setSaving(true);
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
      setIsModalVisible(false);
      setSelectedMonitoring(null);
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred while saving';
      message.error(errorMessage);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleAddMonitoring = () => {
    setSelectedMonitoring(null);
    setIsModalVisible(true);
  };

  const handleEditMonitoring = (monitoring) => {
    setSelectedMonitoring(monitoring);
    setIsModalVisible(true);
  };

  const handleCopyMonitoring = (monitoring) => {
    // Create a copy with modified name
    const copiedMonitoring = {
      ...monitoring,
      name: `${monitoring.name} (Copy)`,
      id: null // Remove ID so it creates a new record
    };
    setSelectedMonitoring(copiedMonitoring);
    setIsModalVisible(true);
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

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setSelectedMonitoring(null);
  };

  const handleViewDetails = (_monitoring) => {
    Modal.info({
      title: 'Monitoring Details',
      content: (
        <div>
          <div>View Details Modal - {selectedMonitoring?.name}</div>
          {/* Add detailed view content here */}
        </div>
      ),
      width: 800,
    });
  };

  return (
    <div className={styles.container}>
      <BreadCrumbs 
        extraContent={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAddMonitoring}
            className={styles.addButton}
          >
            Add Monitoring
          </Button>
        }
      />
      
      <div className={styles.content}>
        <Text text="Orbit Profile Monitoring" />
        
        <OrbitMonitoringTable
          data={data}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onEdit={handleEditMonitoring}
          onCopy={handleCopyMonitoring}
          onDelete={handleDeleteMonitoring}
          onToggleStatus={handleToggleStatus}
          onViewDetails={handleViewDetails}
          loading={isLoading}
        />
      </div>

      <AddEditModal
        visible={isModalVisible}
        onCancel={handleModalCancel}
        selectedMonitoring={selectedMonitoring}
        onSave={saveOrbitMonitoring}
        saving={saving}
      />
    </div>
  );
};

export default OrbitMonitoring;
