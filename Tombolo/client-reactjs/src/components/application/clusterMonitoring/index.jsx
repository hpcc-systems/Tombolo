/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Tooltip, Button, message, Form, Tabs, Modal } from 'antd';
import { getRoleNameArray } from '../../common/AuthUtil.js';

import ClusterMonitoringTable from './ClusterMonitoringTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import ClusterMonitoringBasicTab from './ClusterMonitoringBasicTab';
import ClusterMonitoringTab from './ClusterMonitoringTab';
import ClusterMonitoringNotificationTab from './ClusterMonitoringNotificationTab';
import { authHeader, handleError } from '../../common/AuthHeader.js';

//Constants
const { TabPane } = Tabs;

function ClusterMonitoring() {
  //Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const clusters = useSelector((state) => state.application.clusters);

  //get user roles
  const roleArray = getRoleNameArray();

  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  //Local State
  const [clusterMonitorings, setClusterMonitorings] = useState([]);
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [engines, setEngines] = useState([]);
  const [selectedEngines, setSelectedEngines] = useState([]);
  const [fetchingEngines, setFetchingEngines] = useState(false);
  const [notifyConditions, setNotifyConditions] = useState([]);
  const [selectedMonitoring, setSelectedMonitoring] = useState(null);
  const [notificationDetails, setNotificationDetails] = useState({});

  //When component loads get all file monitoring
  useEffect(() => {
    if (applicationId) getClusterMonitorings(applicationId);
  }, [applicationId]);

  // When selected Monitoring is not null, pass selected monitoring data to form instance
  useEffect(() => {
    if (!selectedMonitoring) return;

    form.setFieldsValue(selectedMonitoring);
  }, [selectedMonitoring]);

  //When submit btn is clicked
  const handleFinish = (values) => {
    console.log('Success:', values);
  };

  // Show modal func
  const showModal = () => {
    setVisible(true);
  };

  //When submit btn on modal is clicked
  const handleOk = async () => {
    try {
      await validateForms();
      // await form.validateFields(); // if errs will be caught by catch block
      const payload = form.getFieldsValue();
      payload.app_id = applicationId;
      // await form.validateFields();
      await saveClusterMonitoring(payload);
    } catch (err) {
      handleError(err);
    }
  };

  //Cancel / close modal
  const handleCancel = () => {
    form.resetFields();
    setSelectedMonitoring(null);
    setVisible(false);

    setActiveTab('1');
    setSelectedCluster(null);
    setEngines([]);
    setSelectedEngines([]);
    setNotifyConditions([]);
    setNotificationDetails({});
  };

  //Function to get all cluster monitoring
  const getClusterMonitorings = async (applicationId) => {
    try {
      const payload = {
        method: 'GET',
        headers: authHeader(),
      };

      const response = await fetch(`/api/clustermonitoring/all/${applicationId}`, payload);

      if (!response.ok) handleError(response);

      const data = await response.json();
      if (data) {
        setClusterMonitorings(data);
      }
    } catch (err) {
      console.log(err);
      message.error('Failed to fetch cluster monitoring');
    }
  };

  //validate forms before saving
  const validateForms = async () => {
    let validationError = null;
    let formData = {};

    try {
      formData = await form.validateFields();
    } catch (err) {
      validationError = err;
    }

    return { validationError, formData };
  };

  const saveClusterMonitoring = async (formData) => {
    try {
      const { monitoring_engines, engineSizeLimit, notificationChannels, emails, msTeamsGroups, notifyCondition } =
        formData;

      const monitoringConditions = {};

      if (engineSizeLimit) {
        const engineSizeMonitoringDetails = [];

        for (let key in engineSizeLimit) {
          const details = {
            engine: key.split('engineLimit-')[1],
            maxSize: engineSizeLimit[key],
            maxSizeExceeded: false,
            notified: [],
          };

          engineSizeMonitoringDetails.push(details);
        }
        monitoringConditions.monitorEngineSize = engineSizeMonitoringDetails;
      }

      const notifications = [];
      if (notificationChannels.includes('eMail')) {
        notifications.push({ channel: 'eMail', recipients: emails });
      }

      if (notificationChannels.includes('msTeams')) {
        notifications.push({ channel: 'msTeams', recipients: msTeamsGroups });
      }

      const metaData = {
        last_monitored: null,
        monitoring_engines,
        monitoringConditions,
        notifications,
        notifyCondition,
      };

      //Delete since these items are nested inside metaData object
      const keysToDelete = [
        'monitoring_engines',
        'engineSizeLimit',
        'notificationChannels',
        'emails',
        'msTeamsGroups',
        'notifyCondition',
      ];
      for (let key of keysToDelete) {
        delete formData[key];
      }
      formData = { ...formData, application_id: applicationId, metaData };
      if (selectedMonitoring) formData.id = selectedMonitoring.id;

      const payload = {
        method: selectedMonitoring ? 'PUT' : 'POST',
        headers: authHeader(),
        body: JSON.stringify(formData),
      };

      const response = await fetch(`/api/clustermonitoring/`, payload);

      if (!response.ok) handleError(response);

      const data = await response.json();
      //If editing - no need to add to monitoring list
      if (data && !selectedMonitoring) {
        setClusterMonitorings((prev) => [...prev, data]);
      }

      // If any monitoring updated. update the monitoring list
      // so changes are reflected without refreshing page
      const updatedMonitoringList = [];
      if (selectedMonitoring) {
        clusterMonitorings.forEach((monitoring) => {
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
        setClusterMonitorings(updatedMonitoringList);
        setSelectedMonitoring(null);
      }
      handleCancel();
    } catch (err) {
      console.log(err);
      message.error('Failed to save cluster monitoring');
    }
  };

  //Handle Cluster change
  const handleClusterChange = (value) => {
    setSelectedCluster(value);
    setEngines([]);
    form.setFieldsValue({ engine: [] });
    getExecutionEngines(value);
  };

  //Function to get all engines for selected cluster ->  clusterMetaData
  const getExecutionEngines = async (clusterId) => {
    try {
      setFetchingEngines(true);
      setEngines([]);
      const payload = {
        method: 'GET',
        headers: authHeader(),
      };

      const response = await fetch(`/api/hpcc/read/clusterMetaData?clusterId=${clusterId}`, payload);
      if (!response.ok) handleError(response);

      const { tpLogicalCluster } = await response.json();
      if (tpLogicalCluster) {
        setEngines(tpLogicalCluster);
      }
    } catch (err) {
      console.log(err);
      message.error('Failed to fetch cluster monitoring');
    } finally {
      setFetchingEngines(false);
    }
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
    <Button key="save" type="primary" onClick={() => handleOk()} disabled={isReader}>
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
            <Button type="primary">{<Text text="Add Cluster Monitoring" />}</Button>
          </Tooltip>
        }
      />
      <ClusterMonitoringTable
        clusterMonitorings={clusterMonitorings}
        applicationId={applicationId}
        setClusterMonitorings={setClusterMonitorings}
        setSelectedMonitoring={setSelectedMonitoring}
        setVisible={setVisible}
        setSelectedCluster={setSelectedCluster}
        setNotifyConditions={setNotifyConditions}
        setEngines={setEngines}
        setSelectedEngines={setSelectedEngines}
        notificationDetails={notificationDetails}
        setNotificationDetails={setNotificationDetails}
        isReader={isReader}
      />

      <Modal
        open={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={btns[activeTab]}
        destroyOnClose
        maskClosable={false}>
        <Form
          form={form}
          onFinish={handleFinish}
          layout="vertical"
          initialValues={{ msTeamsGroups: [''], emails: [''] }}>
          <Tabs
            activeKey={activeTab}
            type="card"
            onTabClick={(record) => {
              setActiveTab(record);
            }}>
            <TabPane tab={<span>Basic</span>} key="1" forceRender>
              <ClusterMonitoringBasicTab
                clusters={clusters}
                handleClusterChange={handleClusterChange}
                selectedCluster={selectedCluster}
                fetchingEngines={fetchingEngines}
                setSelectedEngines={setSelectedEngines}
                engines={engines}
              />
            </TabPane>

            <TabPane tab={<span>Monitoring </span>} key="2" forceRender>
              <ClusterMonitoringTab
                clusterMonitorings={clusterMonitorings}
                setNotifyConditions={setNotifyConditions}
                selectedEngines={selectedEngines}
                notifyConditions={notifyConditions}
                selectedMonitoring={selectedMonitoring}
              />
            </TabPane>
            <TabPane tab={<span>Notifications </span>} key="3" forceRender>
              <ClusterMonitoringNotificationTab
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

export default ClusterMonitoring;

// 546
