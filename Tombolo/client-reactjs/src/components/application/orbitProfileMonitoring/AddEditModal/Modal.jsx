import React, { useState } from 'react';
import { Modal, Tabs, Badge, Button, Card } from 'antd';

import BasicTab from './BasicTab.jsx';
import MonitoringTab from './MonitoringTab.jsx';
import NotificationTab from './NotificationTab.jsx';

const AddEditModal = ({
  displayAddEditModal,
  setDisplayAddEditModal,
  form,
  clusters,
  applicationId,
  domains,
  productCategories,
  selectedDomain,
  setSelectedDomain,
  isEditing,
  isDuplicating,
  erroneousTabs,
  setErroneousTabs,
  resetStates,
  selectedCluster,
  setSelectedCluster,
  activeTab,
  setActiveTab,
  selectedMonitoring,
  savingOrbitMonitoring,
  saveOrbitMonitoring
}) => {
  // Keep track of visited tabs
  const [visitedTabs, setVisitedTabs] = useState(['0']);

  // Handle Cancel
  const handleCancel = () => {
    setDisplayAddEditModal(false);
    resetStates();
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (!visitedTabs.includes(key)) {
      setVisitedTabs([...visitedTabs, key]);
    }

    // Clear error indicator for visited tab
    if (erroneousTabs.includes(key)) {
      setErroneousTabs(erroneousTabs.filter((tab) => tab !== key));
    }
  };

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

  // Handle form submission
  const handleSaveOrbitMonitoringModal = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      const { primaryContacts, secondaryContacts, notifyContacts, domain, productCategory, severity, notificationConditions , buildName } = values;
      values.applicationId = applicationId;

      // all contacts 
      const contacts = {primaryContacts, secondaryContacts, notifyContacts};
      const asrSpecificMetaData = {domain, productCategory, severity, buildName};
      const monitoringData = {notificationConditions};

      // Metadata
      const metaData = {}
      metaData['asrSpecificMetaData'] = asrSpecificMetaData;
      metaData['monitoringData'] = monitoringData;
      metaData['contacts'] = contacts;

      // Remove items added in metaData
      delete values.primaryContacts;
      delete values.secondaryContacts;
      delete values.notifyContacts;
      delete values.domain;
      delete values.productCategory;
      delete values.severity;
      delete values.notificationConditions;

      // Add metaData to values
      values.metaData = metaData;

      if (isEditing) {
        await saveOrbitMonitoring(values, true, false);
      } else {
        await saveOrbitMonitoring(values, false, isDuplicating);
      }
    } catch (error) {
      // Handle error in form validation with utility function
      console.error('Form validation failed:', error);
    }
  };

  // Tabs for modal
  const tabs = [
    {
      label: 'Basic',
      component: () => (
        <BasicTab
          form={form}
          clusters={clusters}
          domains={domains}
          productCategories={productCategories}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
          isEditing={isEditing}
          selectedMonitoring={selectedMonitoring}
        />
      ),
      id: 1,
    },
    {
      label: 'Monitoring Details',
      id: 2,
      component: () => (
        <MonitoringTab
          form={form}
          clusters={clusters}
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
          isEditing={isEditing}
          selectedMonitoring={selectedMonitoring}
        />
      ),
    },
    {
      label: 'Notifications',
      id: 3,
      component: () => (
        <NotificationTab
          form={form}
          isEditing={isEditing}
          selectedMonitoring={selectedMonitoring}
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
          <Button
            type="primary"
            onClick={handleSaveOrbitMonitoringModal}
            loading={savingOrbitMonitoring}
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
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

  // Modal title based on action
  const getModalTitle = () => {
    if (isDuplicating) {
      return 'Duplicate Orbit Monitoring';
    } else if (isEditing) {
      return 'Edit Orbit Monitoring';
    } else {
      return 'Add Orbit Monitoring';
    }
  };

  return (
    <Modal
      open={displayAddEditModal}
      onCancel={handleCancel}
      width={800}
      title={getModalTitle()}
      maskClosable={false}
      footer={renderFooter()}
      destroyOnHidden={true}>
      <Card size="small">
        <Tabs type="card" activeKey={activeTab.toString()} onChange={(key) => handleTabChange(key)} items={tabItems} />
      </Card>
    </Modal>
  );
};

export default AddEditModal;