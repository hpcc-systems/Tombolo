import React, { useState } from 'react';
import { Modal, Tabs, Button, Badge } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

import JobMonitoringBasicTab from './JobMonitoringBasicTab.jsx';
import JobMonitoringTab from './JobMonitoringTab';
import JobMonitoringNotificationTab from './JobMonitoringNotificationTab.jsx';

const AddEditJobMonitoringModal = ({
  displayAddJobMonitoringModal,
  setDisplayAddJobMonitoringModal,
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
  setSelectedMonitoring,
  savingJobMonitoring,
  jobMonitorings,
  setEditingData,
  isEditing,
  asrIntegration,
  erroneousTabs,
  setErroneousTabs,
  setErroneousScheduling,
}) => {
  const [activeTab, setActiveTab] = useState('0');
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
        />
      ),
      id: 1,
    },
    {
      label: 'Monitoring Details',
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
          asrIntegration={asrIntegration}
        />
      ),
    },
    {
      label: 'Notifications',
      id: 3,
      component: () => (
        <JobMonitoringNotificationTab form={form} teamsHooks={teamsHooks} asrIntegration={asrIntegration} />
      ),
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
    form.resetFields();
    setIntermittentScheduling({ schedulingType: 'daily', id: uuidv4() });
    setCompleteSchedule([]);
    setDisplayAddJobMonitoringModal(false);
    setActiveTab('0');
    setVisitedTabs(['0']);
    setSelectedMonitoring(null);
    setEditingData({ isEditing: false });
    setErroneousTabs([]);
    setErroneousScheduling(false);
    setActiveTab('0');
    setMonitoringScope(null);
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
            // disabled={savingJobMonitoring || visitedTabs.length !== tabs.length}
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
      visible={displayAddJobMonitoringModal}
      width={800}
      onCancel={handleCancel}
      footer={renderFooter()}
      maskClosable={false}>
      <Tabs activeKey={activeTab.toString()} onChange={(key) => handleTabChange(key)}>
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
