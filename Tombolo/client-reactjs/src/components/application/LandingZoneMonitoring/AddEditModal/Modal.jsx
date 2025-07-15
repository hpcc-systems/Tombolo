import React, { useState } from 'react';
import { Modal, Tabs, Button, Badge } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import BasicTab from './BasicTab.jsx';
import MonitoringTab from './MonitoringTab.jsx';
import NotificationTab from './NotificationTab.jsx';

const AddEditModal = ({
  displayAddEditModal,
  setDisplayAddEditModal,
  handleSaveDirectoryMonitoring,
  handleUpdateLzMonitoring,
  intermittentScheduling,
  setIntermittentScheduling,
  setCompleteSchedule,
  completeSchedule,
  cron,
  // setCron,
  // cronMessage,
  setCronMessage,
  erroneousScheduling,
  form,
  clusters,
  teamsHooks,
  savingDirectoryMonitoring,
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
  selectedMonitoring = { selectedMonitoring },
  domains,
  productCategories,
  setSelectedDomain,
  lzMonitoringType,
  setLzMonitoringType,
  landingZoneMonitoring,
}) => {
  // Keep track of visited tabs, some form fields are loaded only when tab is visited. This is to avoid validation errors
  const [visitedTabs, setVisitedTabs] = useState(['0']);

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (!visitedTabs.includes(key)) {
      setVisitedTabs([...visitedTabs, key]);
    }
  };

  //Tabs for modal
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
          form={form}
          intermittentScheduling={intermittentScheduling}
          setIntermittentScheduling={setIntermittentScheduling}
          setCompleteSchedule={setCompleteSchedule}
          completeSchedule={completeSchedule}
          cron={cron}
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
          setCronMessage={setCronMessage}
          erroneousScheduling={erroneousScheduling}
          setSelectedDomain={setSelectedDomain}
          clusters={clusters}
          lzMonitoringType={lzMonitoringType}
          setLzMonitoringType={setLzMonitoringType}
        />
      ),
    },
    {
      key: '2',
      label: 'Notifications',
      children: <NotificationTab form={form} teamsHooks={teamsHooks} />,
    },
  ].map((tab) => ({
    ...tab,
    label: erroneousTabs.includes(tab.key) ? (
      <span>
        <Badge color="var(--danger)" /> {tab.label}
      </span>
    ) : (
      tab.label
    ),
  }));

  // When next button is clicked, go to next tab
  const handleNext = () => {
    const nextTab = (parseInt(activeTab) + 1).toString();
    setActiveTab(nextTab);
    setVisitedTabs([...visitedTabs, nextTab]);
  };

  // When previous button is clicked, go back to previous tab
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
  };

  //Render footer buttons based on active tab
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
            <Button
              type="primary"
              onClick={handleSaveDirectoryMonitoring}
              icon={savingDirectoryMonitoring ? <LoadingOutlined /> : null}>
              Submit
            </Button>
          )}
          {isEditing && (
            <Button
              type="primary"
              onClick={handleUpdateLzMonitoring}
              icon={savingDirectoryMonitoring ? <LoadingOutlined /> : null}>
              Update
            </Button>
          )}
        </>
      );
    }
  };

  return (
    <Modal
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
