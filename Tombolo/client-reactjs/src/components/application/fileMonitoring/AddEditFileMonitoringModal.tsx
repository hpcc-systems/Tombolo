// Imports from libraries
import React, { useState } from 'react';
import { Modal, Tabs, Button, Badge, Form } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';

// Local imports
import FileMonitoringBasicTab from './FileMonitoringBasicTab';
import FileMonitoringNotificationTab from './FileMonitoringNotificationTab';
import type { FileMonitoringDTO } from '@tombolo/shared';

interface Cluster {
  id: string;
  name: string;
  [key: string]: any;
}

interface Domain {
  value: string;
  label: string;
}

interface ProductCategory {
  id: string;
  name: string;
  shortCode: string;
}

interface AddEditFileMonitoringModalProps {
  displayAddFileMonitoringModal: boolean;
  handleSaveFileMonitoring: () => Promise<void>;
  handleUpdateFileMonitoring: () => Promise<void>;
  form: FormInstance;
  clusters: Cluster[];
  savingFileMonitoring: boolean;
  isEditing: boolean;
  isDuplicating: boolean;
  erroneousTabs: string[];
  resetStates: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setErroneousTabs: (tabs: string[]) => void;
  handleClusterChange: (clusterId: string) => void;
  fileMonitoring: FileMonitoringDTO[];
  domains: Domain[];
  productCategories: ProductCategory[];
  selectedClusters: Cluster[];
  setSelectedDomain: (domain: string) => void;
  selectedNotificationCondition: string[];
  setSelectedNotificationCondition: (conditions: string[]) => void;
  monitoringFileType: 'stdLogicalFile' | 'superFile';
  setMonitoringFileType: (type: 'stdLogicalFile' | 'superFile') => void;
  fileTypes: Record<string, string>;
}

const AddEditFileMonitoringModal = ({
  displayAddFileMonitoringModal,
  handleSaveFileMonitoring,
  handleUpdateFileMonitoring,
  form,
  clusters,
  savingFileMonitoring,
  isEditing,
  isDuplicating,
  erroneousTabs,
  resetStates,
  activeTab,
  setActiveTab,
  setErroneousTabs,
  handleClusterChange,
  fileMonitoring,
  domains,
  productCategories,
  selectedClusters,
  setSelectedDomain,
  selectedNotificationCondition,
  setSelectedNotificationCondition,
  monitoringFileType,
  setMonitoringFileType,
  fileTypes,
}: AddEditFileMonitoringModalProps) => {
  // Keep track of visited tabs, some form fields are loaded only when the tab is visited. This is to avoid validation errors
  const [visitedTabs, setVisitedTabs] = useState(['0']);
  const [minSizeThresholdUnit, setMinSizeThresholdUnit] = useState('MB');
  const [maxSizeThresholdUnit, setMaxSizeThresholdUnit] = useState('MB');

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (!visitedTabs.includes(key)) {
      setVisitedTabs([...visitedTabs, key]);
    }

    // Clear error indicator for visited tab
    if (erroneousTabs.includes(key)) {
      setErroneousTabs(erroneousTabs.filter(tab => tab !== key));
    }
  };

  // Tabs for modal
  const tabs = [
    {
      label: 'Basic',
      component: () => (
        <FileMonitoringBasicTab
          form={form}
          clusters={clusters}
          handleClusterChange={handleClusterChange}
          isDuplicating={isDuplicating}
          isEditing={isEditing}
          fileMonitoring={fileMonitoring}
          domains={domains}
          productCategories={productCategories}
          selectedClusters={selectedClusters}
          setSelectedDomain={setSelectedDomain}
          setMonitoringFileType={setMonitoringFileType}
          fileTypes={fileTypes}
        />
      ),
      id: 1,
    },
    {
      label: 'Notifications',
      id: 2,
      component: () => (
        <FileMonitoringNotificationTab
          selectedNotificationCondition={selectedNotificationCondition}
          setSelectedNotificationCondition={setSelectedNotificationCondition}
          form={form}
          monitoringFileType={monitoringFileType}
          isEditing={isEditing}
          isDuplicating={isDuplicating}
          setMinSizeThresholdUnit={setMinSizeThresholdUnit}
          setMaxSizeThresholdUnit={setMaxSizeThresholdUnit}
          maxSizeThresholdUnit={maxSizeThresholdUnit}
          minSizeThresholdUnit={minSizeThresholdUnit}
        />
      ),
    },
  ];

  // Define tab items for a Tabs component
  const tabItems = tabs.map((tab, index) => ({
    key: index.toString(),
    label: erroneousTabs.includes(index.toString()) ? (
      <span>
        <Badge color="var(--danger)" /> {`${tab.label}`}
      </span>
    ) : (
      `${tab.label}`
    ),
    children: tab.component(),
  }));

  // When the next button is clicked, go to the next tab
  const handleNext = () => {
    const nextTab = (parseInt(activeTab) + 1).toString();
    setActiveTab(nextTab);
    if (!visitedTabs.includes(nextTab)) {
      setVisitedTabs([...visitedTabs, nextTab]);
    }
  };

  // When the previous button is clicked, go back to the previous tab
  const handlePrevious = () => {
    const previousTab = (parseInt(activeTab) - 1).toString();
    setActiveTab(previousTab);
    if (!visitedTabs.includes(previousTab)) {
      setVisitedTabs([...visitedTabs, previousTab]);
    }
  };

  const handleCancel = () => {
    resetStates();
    setActiveTab('0');
    setVisitedTabs(['0']);
  };

  // Render footer buttons based on the active tab
  const renderFooter = () => {
    const totalTabs = tabs.length;
    const currentTabIndex = parseInt(activeTab);

    if (currentTabIndex === 0) {
      // First tab - only Next button
      return (
        <>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        </>
      );
    } else if (currentTabIndex === totalTabs - 1) {
      // Last tab - Previous and Submit/Update buttons
      return (
        <>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" ghost onClick={handlePrevious}>
            Previous
          </Button>
          {!isEditing ? (
            <Button
              type="primary"
              onClick={handleSaveFileMonitoring}
              loading={savingFileMonitoring}
              icon={savingFileMonitoring ? <LoadingOutlined /> : null}>
              Submit
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={handleUpdateFileMonitoring}
              loading={savingFileMonitoring}
              icon={savingFileMonitoring ? <LoadingOutlined /> : null}>
              Update
            </Button>
          )}
        </>
      );
    } else {
      // Middle tabs - Previous and Next buttons
      return (
        <>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" ghost onClick={handlePrevious}>
            Previous
          </Button>
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        </>
      );
    }
  };

  return (
    <Modal
      open={displayAddFileMonitoringModal}
      width={800}
      onCancel={handleCancel}
      footer={renderFooter()}
      destroyOnClose={true}
      maskClosable={false}>
      <Form form={form} layout="vertical" initialValues={{ maxSizeThresholdUnit, minSizeThresholdUnit }}>
        <Tabs
          type="card"
          activeKey={activeTab.toString()}
          onChange={key => handleTabChange(key)}
          items={tabItems}
          destroyInactiveTabPane={false}
        />
      </Form>
    </Modal>
  );
};

export default AddEditFileMonitoringModal;
