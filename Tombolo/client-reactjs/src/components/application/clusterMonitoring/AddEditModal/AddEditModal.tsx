import React, { useState } from 'react';
import { Modal, Tabs, Badge, Button, Card, FormInstance } from 'antd';
import { handleError, handleSuccess } from '@/components/common/handleResponse';
import BasicTab from './BasicTab';
import NotificationTab from './NotificationTab';
import clusterMonitoringService from '@/services/clusterMonitoring.service';
import { identifyErroneousTabs } from '../clusterMonitoringUtils';
import type { ClusterMonitoringDTO } from '@tombolo/shared';

interface Domain {
  value: string;
  label: string;
}

interface ProductCategory {
  value: string;
  label: string;
}

interface AddEditModalProps {
  setDisplayAddEditModal: (display: boolean) => void;
  form: FormInstance;
  domains: Domain[];
  productCategories: ProductCategory[];
  setProductCategories?: (categories: ProductCategory[]) => void;
  selectedDomain?: string | null;
  setSelectedDomain: (domain: string | null) => void;
  setClusterMonitoring: React.Dispatch<React.SetStateAction<ClusterMonitoringDTO[]>>;
  clusterMonitoring: ClusterMonitoringDTO[];
  setEditingMonitoring: (editing: boolean) => void;
  editingMonitoring: boolean;
  selectedMonitoring: ClusterMonitoringDTO | null;
  setDuplicatingData: (data: { isDuplicating: boolean; selectedMonitoring?: ClusterMonitoringDTO }) => void;
  isDuplicating: boolean;
  monitoringType: string[];
  setMonitoringType: (types: string[]) => void;
}

function AddEditModal({
  setDisplayAddEditModal,
  form,
  domains,
  productCategories,
  setSelectedDomain,
  setClusterMonitoring,
  clusterMonitoring,
  setEditingMonitoring,
  editingMonitoring,
  selectedMonitoring,
  setDuplicatingData,
  isDuplicating,
  monitoringType,
  setMonitoringType,
}: AddEditModalProps) {
  // Local states
  const [activeTab, setActiveTab] = useState('0');
  const [visitedTabs, setVisitedTabs] = useState(['0']);
  const [savingClusterMonitoring, setSavingClusterMonitoring] = useState(false);
  const [erroneousTabs, setErroneousTabs] = useState<string[]>([]);

  // Handle Cancel
  const handleCancel = () => {
    setDisplayAddEditModal(false);
    setEditingMonitoring(false);
    form.resetFields();
    setDuplicatingData({ isDuplicating: false });
    setErroneousTabs([]);
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
          setSelectedDomain={setSelectedDomain}
          monitoringType={monitoringType}
          setMonitoringType={setMonitoringType}
        />
      ),
      id: 1,
    },
    {
      label: 'Notifications',
      id: 2,
      component: () => <NotificationTab form={form} />,
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
          <Button type="primary" onClick={handleSaveClusterMonitoring} loading={savingClusterMonitoring}>
            {editingMonitoring ? 'Update' : 'Submit'}
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
      return 'Duplicate Cluster Monitoring';
    } else if (editingMonitoring) {
      return 'Edit Cluster Monitoring';
    } else {
      return 'Add Cluster Monitoring';
    }
  };

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

  // Save cluster monitoring
  const handleSaveClusterMonitoring = async () => {
    setSavingClusterMonitoring(true);
    let validForm = true;

    // Validate form and set validForm to false if any field is invalid
    try {
      await form.validateFields();
    } catch {
      validForm = false;
    }

    // If form is invalid
    if (!validForm) {
      const erroneousFields = form
        .getFieldsError()
        .filter(f => f.errors.length > 0)
        .map(f => f.name[0] as string);
      const badTabs = identifyErroneousTabs({ erroneousFields });
      if (badTabs.length > 0) {
        setErroneousTabs(badTabs);
      }
      setSavingClusterMonitoring(false);
      return;
    }

    // If form is valid save cost monitoring
    try {
      // All inputs
      let allInputs = form.getFieldsValue();

      // Trim the input values
      Object.entries(allInputs).forEach(([key, value]) => {
        if (typeof value === 'string') {
          allInputs[key] = value.trim();
        }
      });

      const asrSpecificMetaData: any = {};
      const { domain, productCategory, severity, usageThreshold } = allInputs;
      const asrSpecificFields = { domain, productCategory, severity };
      for (let key in asrSpecificFields) {
        if ((asrSpecificFields as any)[key] !== undefined) {
          asrSpecificMetaData[key] = (asrSpecificFields as any)[key];
        }
        delete allInputs[key];
      }

      // Group Notification specific metaData and delete from allInputs
      const contacts: any = {};
      const { primaryContacts, secondaryContacts, notifyContacts } = allInputs;
      const allContacts = {
        primaryContacts,
        secondaryContacts,
        notifyContacts,
      };
      for (let key in allContacts) {
        if ((allContacts as any)[key] !== undefined) {
          contacts[key] = (allContacts as any)[key];
        }
        delete allInputs[key];
      }

      // Other monitoring details
      const monitoringDetails: any = {};
      if (allInputs.clusterMonitoringType.includes('usage') && usageThreshold !== undefined) {
        monitoringDetails.usageThreshold = usageThreshold;
        delete allInputs['usageThreshold'];
      }

      // Create metaData object
      const metaData: any = {};

      //Add asrSpecificMetaData, notificationMetaData to metaData object
      metaData.asrSpecificMetaData = asrSpecificMetaData;
      metaData.contacts = contacts;
      metaData.monitoringDetails = monitoringDetails;

      // Add metaData to allInputs
      allInputs = { ...allInputs, metaData };

      if (editingMonitoring && selectedMonitoring) {
        const responseData = await clusterMonitoringService.update({ ...allInputs, id: selectedMonitoring.id });
        let updatedMonitoring = responseData;

        setClusterMonitoring(
          clusterMonitoring.map(monitoring => (monitoring.id === updatedMonitoring.id ? updatedMonitoring : monitoring))
        );
      } else {
        let responseData = await clusterMonitoringService.create(allInputs);
        setClusterMonitoring([responseData, ...clusterMonitoring]);
      }

      form.resetFields();
      handleSuccess('Cluster monitoring saved successfully');
      setDisplayAddEditModal(false);
    } catch (err: any) {
      handleError(err?.message || 'Failed to save cluster monitoring');
    } finally {
      setSavingClusterMonitoring(false);
      setDuplicatingData({ isDuplicating: false });
    }
  };

  return (
    <Modal
      open={true}
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
}

export default AddEditModal;
