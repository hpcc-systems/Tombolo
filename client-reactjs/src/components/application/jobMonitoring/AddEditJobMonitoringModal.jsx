import React, { useState } from 'react';
import { Modal, Tabs, Button, Badge } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import JobMonitoringBasicTab from './JobMonitoringBasicTab.jsx';
import JobMonitoringTab from './JobMonitoringTab';
import JobMonitoringNotificationTab from './JobMonitoringNotificationTab.jsx';

const AddEditJobMonitoringModal = ({
  displayAddJobMonitoringModal,
  monitoringScope,
  setMonitoringScope,
  handleSaveJobMonitoring,
  intermittentScheduling,
  setIntermittentScheduling,
  setCompleteSchedule,
  completeSchedule,
  cron,
  setCron,
  cronMessage,
  setCronMessage,
  erroneousScheduling,
  form,
  clusters,
  teamsHooks,
  savingJobMonitoring,
  jobMonitorings,
  isEditing,
  erroneousTabs,
  resetStates,
  domains,
  productCategories,
  setSelectedDomain,
  selectedCluster,
  setSelectedCluster,
  activeTab,
  setActiveTab,
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
      label: 'Basic',
      component: () => (
        <JobMonitoringBasicTab
          form={form}
          clusters={clusters}
          monitoringScope={monitoringScope}
          setMonitoringScope={setMonitoringScope}
          jobMonitorings={jobMonitorings}
          isEditing={isEditing}
          selectedCluster={selectedCluster}
          setSelectedCluster={setSelectedCluster}
        />
      ),
      id: 1,
    },
    {
      label: 'Scheduling Details',
      id: 2,
      component: () => (
        <JobMonitoringTab
          form={form}
          intermittentScheduling={intermittentScheduling}
          setIntermittentScheduling={setIntermittentScheduling}
          setCompleteSchedule={setCompleteSchedule}
          completeSchedule={completeSchedule}
          cron={cron}
          setCron={setCron}
          cronMessage={cronMessage}
          setCronMessage={setCronMessage}
          erroneousScheduling={erroneousScheduling}
          monitoringScope={monitoringScope}
          selectedCluster={selectedCluster}
          domains={domains}
          productCategories={productCategories}
          setSelectedDomain={setSelectedDomain}
        />
      ),
    },
    {
      label: 'Notifications',
      id: 3,
      component: () => <JobMonitoringNotificationTab form={form} teamsHooks={teamsHooks} />,
    },
  ];

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
          <Button
            type="primary"
            onClick={handleSaveJobMonitoring}
            icon={savingJobMonitoring ? <LoadingOutlined /> : null}>
            Submit
          </Button>
        </>
      );
    }
  };

  return (
    <Modal
      open={displayAddJobMonitoringModal}
      width={800}
      onCancel={handleCancel}
      footer={renderFooter()}
      destroyOnClose={true}
      maskClosable={false}>
      <Tabs type="card" activeKey={activeTab.toString()} onChange={(key) => handleTabChange(key)}>
        {tabs.map((tab, index) => (
          <Tabs.TabPane
            key={index}
            tab={
              erroneousTabs.includes(index.toString()) ? (
                <span>
                  <Badge color="var(--danger)" /> {`${tab.label}`}
                </span>
              ) : (
                `${tab.label}`
              )
            }>
            {tab.component()}
          </Tabs.TabPane>
        ))}
      </Tabs>
    </Modal>
  );
};

export default AddEditJobMonitoringModal;
