import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Badge, Button, Card } from 'antd';

import BasicTab from './BasicTab';
import MonitoringTab from './MonitoringTab';
import NotificationTab from './NotificationTab';

type AnyForm = any;

interface Props {
  displayAddEditModal: boolean;
  setDisplayAddEditModal: (v: boolean) => void;
  form: AnyForm;
  applicationId: any;
  domains: any[];
  productCategories: any[];
  selectedDomain: any;
  setSelectedDomain: (d: any) => void;
  isEditing: boolean;
  isDuplicating: boolean;
  erroneousTabs: string[];
  setErroneousTabs: (t: string[]) => void;
  resetStates: () => void;
  activeTab: string | number;
  setActiveTab: (k: any) => void;
  selectedMonitoring: any;
  orbitMonitoringData: any[];
  savingOrbitMonitoring: boolean;
  saveOrbitMonitoring: (v: any, a?: boolean, b?: boolean) => Promise<void>;
}

const AddEditModal: React.FC<Props> = ({
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
  const [visitedTabs, setVisitedTabs] = useState<string[]>(['0']);

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
        const doesNameExist = (name: string) => orbitMonitoringData.some(m => m.monitoringName === name);

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

  const handleCancel = () => {
    setDisplayAddEditModal(false);
    resetStates();
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (!visitedTabs.includes(key)) setVisitedTabs([...visitedTabs, key]);
    if (erroneousTabs.includes(key)) setErroneousTabs(erroneousTabs.filter(tab => tab !== key));
  };

  const handleNext = () => {
    const nextTab = (parseInt(activeTab as string) + 1).toString();
    setActiveTab(nextTab);
    if (!visitedTabs.includes(nextTab)) setVisitedTabs([...visitedTabs, nextTab]);
  };

  const handlePrevious = () => {
    const previousTab = (parseInt(activeTab as string) - 1).toString();
    setActiveTab(previousTab);
    if (!visitedTabs.includes(previousTab)) setVisitedTabs([...visitedTabs, previousTab]);
  };

  const handleSaveOrbitMonitoringModal = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      const { primaryContacts, secondaryContacts, notifyContacts, domain, productCategory, severity, buildName } =
        values;
      const monitoringDataFromForm = values.monitoringData || {};
      values.applicationId = applicationId;

      const contacts = { primaryContacts, secondaryContacts, notifyContacts };
      const asrSpecificMetaData = { domain, productCategory, severity, buildName };
      const monitoringData = { ...monitoringDataFromForm };

      const metaData: any = {};
      metaData['asrSpecificMetaData'] = asrSpecificMetaData;
      metaData['monitoringData'] = monitoringData;
      metaData['contacts'] = contacts;

      delete values.primaryContacts;
      delete values.secondaryContacts;
      delete values.notifyContacts;
      delete values.domain;
      delete values.productCategory;
      delete values.severity;
      delete values.monitoringData;
      delete values.buildName;

      values.metaData = metaData;

      if (isEditing) {
        await saveOrbitMonitoring(values, true, false);
      } else {
        await saveOrbitMonitoring(values, false, isDuplicating);
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

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
      component: () => <MonitoringTab form={form} _isEditing={isEditing} _selectedMonitoring={selectedMonitoring} />,
    },
    {
      label: 'Notifications',
      id: 3,
      component: () => <NotificationTab form={form} _isEditing={isEditing} _selectedMonitoring={selectedMonitoring} />,
    },
  ];

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

  const renderFooter = () => {
    const totalTabs = tabs.length;
    const currentTabIndex = parseInt(activeTab as string);

    if (currentTabIndex === 0) {
      return (
        <>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        </>
      );
    } else if (currentTabIndex === totalTabs - 1) {
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

  const getModalTitle = () => {
    if (isDuplicating) return 'Duplicate Orbit Monitoring';
    if (isEditing) return 'Edit Orbit Monitoring';
    return 'Add Orbit Monitoring';
  };

  return (
    <Modal
      open={displayAddEditModal}
      onCancel={handleCancel}
      width={800}
      title={getModalTitle()}
      maskClosable={false}
      footer={renderFooter()}
      destroyOnClose={true}>
      <Card size="small">
        <Tabs type="card" activeKey={activeTab.toString()} onChange={key => handleTabChange(key)} items={tabItems} />
      </Card>
    </Modal>
  );
};

export default AddEditModal;
