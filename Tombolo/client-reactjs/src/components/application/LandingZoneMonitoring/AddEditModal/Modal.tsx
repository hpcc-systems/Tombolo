import React, { useState } from 'react';
import { Modal, Tabs, Button, Badge } from 'antd';

import BasicTab from './BasicTab';
import MonitoringTab from './MonitoringTab';
import NotificationTab from './NotificationTab';

const AddEditModal = ({
  displayAddEditModal,
  setDisplayAddEditModal,
  handleSaveLzmonitoring,
  handleUpdateLzMonitoring,
  form,
  clusters,
  isEditing,
  erroneousTabs,
  resetStates,
  selectedCluster,
  setSelectedCluster,
  activeTab,
  setActiveTab,
  directory,
  setDirectory,
  copying,
  setCopying,
  selectedMonitoring,
  domains,
  productCategories,
  setSelectedDomain,
  lzMonitoringType,
  setLzMonitoringType,
  landingZoneMonitoring,
  setMinSizeThresholdUnit,
  setMaxSizeThresholdUnit,
  minSizeThresholdUnit,
  maxSizeThresholdUnit,
}: any) => {
  const [visitedTabs, setVisitedTabs] = useState(['0']);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (!visitedTabs.includes(key)) {
      setVisitedTabs([...visitedTabs, key]);
    }
  };

  const tabs = [
    {
      key: '0',
      label: 'Basic',
      children: (
        <BasicTab
          form={form}
          clusters={clusters}
          isEditing={isEditing}
          selectedCluster={selectedCluster}
          directory={directory}
          setDirectory={setDirectory}
          copying={copying}
          selectedMonitoring={selectedMonitoring}
          domains={domains}
          productCategories={productCategories}
          setSelectedDomain={setSelectedDomain}
          landingZoneMonitoring={landingZoneMonitoring}
        />
      ),
    },
    {
      key: '1',
      label: 'Monitoring Details',
      children: (
        <MonitoringTab
          lzMonitoringType={lzMonitoringType}
          setLzMonitoringType={setLzMonitoringType}
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
          clusters={clusters}
          form={form}
          minSizeThresholdUnit={minSizeThresholdUnit}
          maxSizeThresholdUnit={maxSizeThresholdUnit}
          setMinSizeThresholdUnit={setMinSizeThresholdUnit}
          setMaxSizeThresholdUnit={setMaxSizeThresholdUnit}
        />
      ),
    },
    {
      key: '2',
      label: 'Notifications',
      children: <NotificationTab form={form} />,
    },
  ].map(tab => ({
    ...tab,
    label: erroneousTabs.includes(tab.key) ? (
      <span>
        <Badge color="var(--danger)" /> {tab.label}
      </span>
    ) : (
      tab.label
    ),
  }));

  const handleNext = () => {
    const nextTab = (parseInt(activeTab) + 1).toString();
    setActiveTab(nextTab);
    setVisitedTabs([...visitedTabs, nextTab]);
  };

  const handlePrevious = () => {
    const previousTab = (parseInt(activeTab) - 1).toString();
    setActiveTab(previousTab);
    setVisitedTabs([...visitedTabs, previousTab]);
  };

  const handleCancel = () => {
    resetStates();
    setActiveTab('0');
    setVisitedTabs(['0']);
    setActiveTab('0');
    setCopying(false);
    setDisplayAddEditModal(false);
    setLzMonitoringType(null);
  };

  const renderFooter = () => {
    if (activeTab === '0') {
      return (
        <>
          <Button type="primary" ghost onClick={handleNext}>
            Next
          </Button>
        </>
      );
    } else if (activeTab === '1') {
      return (
        <>
          <Button type="primary" ghost onClick={handlePrevious}>
            Previous
          </Button>
          <Button type="primary" ghost onClick={handleNext}>
            Next
          </Button>
        </>
      );
    } else {
      return (
        <>
          <Button type="primary" ghost onClick={handlePrevious}>
            Previous
          </Button>
          {!isEditing && (
            <Button type="primary" onClick={handleSaveLzmonitoring}>
              Submit
            </Button>
          )}
          {isEditing && (
            <Button type="primary" onClick={handleUpdateLzMonitoring}>
              Update
            </Button>
          )}
        </>
      );
    }
  };

  return (
    <Modal
      title={isEditing ? 'Edit Landing Zone Monitoring' : 'Add Landing Zone Monitoring'}
      open={displayAddEditModal}
      width={800}
      onCancel={handleCancel}
      footer={renderFooter()}
      destroyOnClose={true}
      maskClosable={false}>
      <Tabs type="card" activeKey={activeTab} onChange={handleTabChange} items={tabs} />
    </Modal>
  );
};

export default AddEditModal;
