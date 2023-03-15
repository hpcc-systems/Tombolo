/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Tooltip, Button, message, Form, Tabs, Modal } from 'antd';

import JobMonitoringTable from './JobMonitoringTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import JobMonitoringBasicTab from './JobMonitoringBasicTab';
import JobMonitoringTab from './JobMonitoringTab';
import JobMonitoringNotificationTab from './JobMonitoringNotificationTab';
import { authHeader, handleError } from '../../common/AuthHeader.js';

//Constants
const { TabPane } = Tabs;

function JobMonitoring() {
  //Redux
  const {
    clusters,
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  //Local State
  const [jobMonitorings, setJobMonitorings] = useState([]);
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [notifyConditions, setNotifyConditions] = useState([]);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [notificationDetails, setNotificationDetails] = useState({});
  const [monitoringScope, setMonitoringScope] = useState(null);

  //When component loads get all file monitoring
  useEffect(() => {
    if (applicationId) getJobMonitorings(applicationId);
  }, [applicationId]);

  // When selected Monitoring is not null, pass selected monitoring data to form instance
  useEffect(() => {
    if (!selectedMonitoring) return;

    form.setFieldsValue(selectedMonitoring);
  }, [selectedMonitoring]);

  // Show modal func
  const showModal = () => {
    setVisible(true);
  };

  //When submit btn on modal is clicked
  const handleOk = async () => {
    try {
      // await form.validateFields(); // if errs will be caught by catch block
      const payload = form.getFieldsValue();
      payload.app_id = applicationId;
      await form.validateFields();
      await saveJobMonitoring(payload);
    } catch (err) {
      handleError(err);
    }
  };

  const saveJobMonitoring = async (formData) => {
    try {
      const { notificationChannels, emails, msTeamsGroups, notificationConditions, jobName, monitoringScope } =
        formData;

      const notifications = [];
      if (notificationChannels.includes('eMail')) {
        notifications.push({ channel: 'eMail', recipients: emails });
      }

      if (notificationChannels.includes('msTeams')) {
        notifications.push({ channel: 'msTeams', recipients: msTeamsGroups });
      }

      const metaData = {
        last_monitored: null,
        notifications,
        notificationConditions,
        jobName,
        monitoringScope,
      };

      //Delete since these items are nested inside metaData object
      const keysToDelete = ['notificationChannels', 'emails', 'msTeamsGroups', 'notifyCondition'];
      for (let key of keysToDelete) {
        delete formData[key];
      }

      formData = { ...formData, application_id: applicationId, metaData };
      if (selectedMonitoring) formData.id = selectedMonitoring.id;

      const payload = {
        method: selectedMonitoring ? 'PUT' : 'POST',
        header: authHeader(),
        body: JSON.stringify(formData),
      };

      const response = await fetch(`/api/jobmonitoring/`, payload);
      if (!response.ok) handleError(response);

      const data = await response.json();
      //If editing - no need to add to monitoring list
      if (data && !selectedMonitoring) {
        setJobMonitorings((prev) => [...prev, data]);
      }

      // If any monitoring updated. update the monitoring list
      // so changes are reflected without refreshing page
      const updatedMonitoringList = [];
      if (selectedMonitoring) {
        jobMonitorings.forEach((monitoring) => {
          if (monitoring.id === selectedMonitoring.id) {
            const newFormData = {
              ...formData,
              createdAt: selectedMonitoring.createdAt,
              metaData: { ...metaData, last_monitored: selectedMonitoring?.metaData?.last_monitored },
            };
            updatedMonitoringList.push(newFormData);
          } else {
            updatedMonitoringList.push(monitoring);
          }
        });
        setJobMonitorings(updatedMonitoringList);
        setSelectedMonitoring(null);
      }
      handleCancel();
    } catch (err) {
      console.log(err);
      message.error('Failed to save cluster monitoring');
    }
  };

  //Cancel / close modal
  const handleCancel = () => {
    form.resetFields();
    setSelectedMonitoring(null);
    setVisible(false);

    setActiveTab('1');
    setSelectedCluster(null);
    setNotifyConditions([]);
    setNotificationDetails({});
  };

  //Function to get all cluster monitoring
  const getJobMonitorings = async (applicationId) => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/jobmonitoring/all/${applicationId}`, payload);
      if (!response.ok) handleError(response);

      const data = await response.json();
      if (data) {
        setJobMonitorings(data);
      }
    } catch (err) {
      console.log(err);
      message.error('Failed to fetch job monitoring');
    }
  };

  //Handle Cluster change
  const handleClusterChange = (value) => {
    setSelectedCluster(value);
  };

  //Modal footer btns -------------------------------------------------------------------------
  const nextBtn = (
    <Button
      key="next"
      type="primary"
      ghost
      onClick={() => {
        setActiveTab((parseInt(activeTab) + 1).toString());
      }}>
      Next
    </Button>
  );

  const backBtn = (
    <Button
      key="back"
      type="primary"
      ghost
      onClick={() => {
        setActiveTab((parseInt(activeTab) - 1).toString());
      }}>
      Back
    </Button>
  );

  const saveBtn = (
    <Button key="save" type="primary" onClick={handleOk}>
      Save
    </Button>
  );
  const btns = {
    0: null,
    1: [nextBtn],
    2: [backBtn, nextBtn],
    3: [backBtn, saveBtn],
  };
  //JSX ---------------------------------------------------------------------------------------------
  return (
    <>
      <BreadCrumbs
        extraContent={
          <Tooltip placement="bottom" title={'Click to add a new Application'} onClick={showModal}>
            <Button type="primary">{<Text text="Add Job Monitoring" />}</Button>
          </Tooltip>
        }
      />
      <JobMonitoringTable
        jobMonitorings={jobMonitorings}
        applicationId={applicationId}
        setJobMonitorings={setJobMonitorings}
        setSelectedMonitoring={setSelectedMonitoring}
        setVisible={setVisible}
        setNotifyConditions={setNotifyConditions}
        notificationDetails={notificationDetails}
        setNotificationDetails={setNotificationDetails}
        setMonitoringScope={setMonitoringScope}
        setSelectedCluster={setSelectedCluster}
      />

      <Modal
        visible={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={btns[activeTab]}
        destroyOnClose
        maskClosable={false}>
        <Form form={form} layout="vertical" initialValues={{ msTeamsGroups: [''], emails: [''] }}>
          <Tabs
            activeKey={activeTab}
            onTabClick={(record) => {
              setActiveTab(record);
            }}>
            <TabPane tab={<span>Basic</span>} key="1" forceRender>
              <JobMonitoringBasicTab
                clusters={clusters}
                handleClusterChange={handleClusterChange}
                selectedCluster={selectedCluster}
                monitoringScope={monitoringScope}
                setMonitoringScope={setMonitoringScope}
              />
            </TabPane>

            <TabPane tab={<span>Monitoring </span>} key="2" forceRender>
              <JobMonitoringTab
                jobMonitorings={jobMonitorings}
                setNotifyConditions={setNotifyConditions}
                notifyConditions={notifyConditions}
                selectedMonitoring={selectedMonitoring}
              />
            </TabPane>
            <TabPane tab={<span>Notifications </span>} key="3" forceRender>
              <JobMonitoringNotificationTab
                notificationDetails={notificationDetails}
                setNotificationDetails={setNotificationDetails}
              />
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
    </>
  );
}

export default JobMonitoring;
