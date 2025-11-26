import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Badge, Button, Card } from 'antd';

import BasicTab from './BasicTab.jsx';
import MonitoringTab from './MonitoringTab.jsx';
import NotificationTab from './NotificationTab.jsx';

const AddEditModal = ({
  displayAddEditModal,
  setDisplayAddEditModal,
  form,
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
  activeTab,
  setActiveTab,
  selectedMonitoring,
  orbitMonitoringData,
  savingOrbitMonitoring,
  saveOrbitMonitoring,
}) => {
  // Keep track of visited tabs
  const [visitedTabs, setVisitedTabs] = useState(['0']);

  // Populate form fields when editing or duplicating. When duplicating, also
  // generate a unique name and place a warning on the field.
  useEffect(() => {
    if ((isEditing || isDuplicating) && selectedMonitoring && form) {
      const { metaData } = selectedMonitoring;
      form.setFieldsValue({
        monitoringName: selectedMonitoring.monitoringName,
        description: selectedMonitoring.description,
        domain: metaData?.asrSpecificMetaData?.domain,
        productCategory: metaData?.asrSpecificMetaData?.productCategory,
        severity: metaData?.asrSpecificMetaData?.severity,
        buildName: metaData?.asrSpecificMetaData?.buildName,
        primaryContacts: metaData?.contacts?.primaryContacts,
        secondaryContacts: metaData?.contacts?.secondaryContacts,
        notifyContacts: metaData?.contacts?.notifyContacts,
        monitoringData: {
          notificationConditions: metaData?.monitoringData?.notificationConditions,
          buildStatus: metaData?.monitoringData?.buildStatus,
          updateInterval: metaData?.monitoringData?.updateInterval,
          updateIntervalDays: metaData?.monitoringData?.updateIntervalDays,
        },
      });
      if (metaData?.asrSpecificMetaData?.domain) {
        setSelectedDomain(metaData.asrSpecificMetaData.domain);
      }

      if (isDuplicating) {
        // Generate unique name
        const doesNameExist = name => orbitMonitoringData.some(m => m.monitoringName === name);

        const currentName = selectedMonitoring.monitoringName;
        let newName = `copy-${currentName}`;
        let copyCount = 0;

        while (doesNameExist(newName)) {
          copyCount++;
          newName = `copy-${currentName}-${copyCount}`;
        }

        form.setFields([
          {
            name: 'monitoringName',
            value: newName,
            warnings: ['Auto generated name. Please modify if necessary.'],
          },
        ]);
      }
    }
  }, [isEditing, isDuplicating, selectedMonitoring, form, orbitMonitoringData, setSelectedDomain]);

  // Handle Cancel
  const handleCancel = () => {
    setDisplayAddEditModal(false);
    resetStates();
  };

  // Handle tab change
  const handleTabChange = key => {
    setActiveTab(key);
    if (!visitedTabs.includes(key)) {
      setVisitedTabs([...visitedTabs, key]);
    }

    // Clear error indicator for visited tab
    if (erroneousTabs.includes(key)) {
      setErroneousTabs(erroneousTabs.filter(tab => tab !== key));
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
      const { primaryContacts, secondaryContacts, notifyContacts, domain, productCategory, severity, buildName } =
        values;
      const monitoringDataFromForm = values.monitoringData || {};
      values.applicationId = applicationId;

      // all contacts
      const contacts = { primaryContacts, secondaryContacts, notifyContacts };
      const asrSpecificMetaData = { domain, productCategory, severity, buildName };
      const monitoringData = {
        ...monitoringDataFromForm,
      };

      // Metadata
      const metaData = {};
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
      delete values.monitoringData;
      delete values.buildName;

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
          domains={domains}
          productCategories={productCategories}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
          isEditing={isEditing}
          selectedMonitoring={selectedMonitoring}
        />
      ),
      id: 1,
    },
    {
      label: 'Monitoring Details',
      id: 2,
      component: () => <MonitoringTab form={form} isEditing={isEditing} selectedMonitoring={selectedMonitoring} />,
    },
    {
      label: 'Notifications',
      id: 3,
      component: () => <NotificationTab form={form} isEditing={isEditing} selectedMonitoring={selectedMonitoring} />,
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
          <Button type="primary" onClick={handleSaveOrbitMonitoringModal} loading={savingOrbitMonitoring}>
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
        <Tabs type="card" activeKey={activeTab.toString()} onChange={key => handleTabChange(key)} items={tabItems} />
      </Card>
    </Modal>
  );
};

export default AddEditModal;
