import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Button, Tabs, Form, message } from 'antd';
import BasicTab from './BasicTab';
import MonitoringTab from './MonitoringTab';
import NotificationsTab from './NotificationsTab';
import useWindowSize from '../../../hooks/useWindowSize';
const { TabPane } = Tabs;

const OrbitMonitoringModal = ({ modalVisible, orbitBuildList, setModalVisible, saveOrbitBuildDetails }) => {
  //modal states
  const [modalWidth, setModalWidth] = useState(0);
  const [activeTab, setActiveTab] = useState('1');
  const [cron, setCron] = useState(null);
  const windowSize = useWindowSize();
  const [orbitBuildDetails, setOrbitBuildDetails] = useState(null);
  const [monitoringDetails, setMonitoringDetails] = useState({
    monitoringActive: true,
    monitoringConditions: [],
  });
  const [notificationDetails, setNotificationDetails] = useState({});
  const [entryForm] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedOrbitBuild, setSelectedOrbitBuild] = useState('');

  const applicationReducer = useSelector((state) => state.applicationReducer);

  //validate forms before saving
  const validateForms = async () => {
    let validationError = null;
    let formData = {};

    try {
      formData = await entryForm.validateFields();
    } catch (err) {
      validationError = err;
    }

    return { validationError, formData };
  };

  //save data
  const handleSave = async () => {
    try {
      setConfirmLoading(true);
      //validate data and throw new error

      const data = await validateForms();
      console.log(data);

      if (data.validationError?.errorFields) {
        throw new Error('Validation failed, please check form fields again.');
      }

      const formData = data.formData;

      let notificationChannels = formData.notificationChannels;
      let emails = formData.emails;
      let msTeamsGroups = formData.msTeamsGroups;

      formData.application_id = applicationReducer.application.applicationId;

      // current UTC Time Stamp
      const date = new Date();
      const currentTimeStamp = date.getTime();

      let notifyCondition = formData.notifyCondition;
      let updateInterval = formData.updateInterval;
      let updateIntervalDays = formData.updateIntervalDays;
      let buildStatus = formData.buildStatus;

      //organize notifications
      let notifications = [];
      for (let i = 0; i < notificationChannels.length; i++) {
        if (notificationChannels[i] == 'eMail') {
          notifications.push({ channel: 'eMail', recipients: emails });
        }
        if (notificationChannels[i] == 'msTeams') {
          notifications.push({ channel: 'msTeams', recipients: msTeamsGroups });
        }
      }

      // if (selectedFileMonitoring) {
      //   notifications = selectedSuperFileDetails.metaData.notifications;
      // }

      formData.metaData = {
        lastMonitored: currentTimeStamp,
        buildInfo: selectedOrbitBuild,
        monitoringCondition: {
          notifyCondition,
          updateInterval,
          updateIntervalDays,
          buildStatus,
        },
        notifications,
        monitoringActive: formData.monitoringActive,
      };

      formData.build = selectedOrbitBuild;

      await saveOrbitBuildDetails(formData);
      setConfirmLoading(false);
      //rerender table, useEffect on main superfilemonitoring tracks this to get list of all monitoring
      // setSuccessAddingMonitoring((prev) => prev + 1);
      //set modal not visible, reset form and disabled fields
      setModalVisible(false);
      entryForm.resetFields();
      //setDisabled(false);
      cancelModal();
    } catch (err) {
      setConfirmLoading(false);
      console.log(err.message);
      if (err.message !== 'Validation failed') message.error(err.message);
    }
  };

  function cancelModal() {
    setModalVisible(false);
    setConfirmLoading(false);
    // setDisabled(false);
  }

  // Changes modal size per screen vw
  useEffect(() => {
    const { width } = windowSize.inner;
    if (width > 1500) {
      setModalWidth('40vw');
    } else if (width > 1000) {
      setModalWidth('60vw');
    } else {
      setModalWidth('100vw');
    }
  }, [windowSize]);

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
    <Button key="save" type="primary" onClick={handleSave} loading={confirmLoading}>
      Save
    </Button>
  );
  const btns = {
    0: null,
    1: [nextBtn],
    2: [backBtn, nextBtn],
    3: [backBtn, saveBtn],
  };

  return (
    <Modal
      visible={modalVisible}
      width={modalWidth}
      onCancel={cancelModal}
      maskClosable={false}
      confirmLoading={confirmLoading}
      destroyOnClose
      footer={btns[activeTab]}
      style={{ marginTop: '100px' }}>
      <Form layout="vertical" form={entryForm}>
        <Tabs
          activeKey={activeTab}
          onTabClick={(record) => {
            setActiveTab(record);
          }}>
          <TabPane tab="Build Selection" key="1">
            <BasicTab
              entryForm={entryForm}
              orbitBuildDetails={orbitBuildDetails}
              setOrbitBuildDetails={setOrbitBuildDetails}
              selectedOrbitBuild={selectedOrbitBuild}
              setSelectedOrbitBuild={setSelectedOrbitBuild}
            />
          </TabPane>
          <TabPane tab="Monitoring Parameters" key="2">
            <MonitoringTab
              entryForm={entryForm}
              cron={cron}
              setCron={setCron}
              monitoringDetails={monitoringDetails}
              setMonitoringDetails={setMonitoringDetails}
              orbitBuildList={orbitBuildList}
            />
          </TabPane>
          <TabPane tab="Notifications" key="3">
            <NotificationsTab
              entryForm={entryForm}
              notificationDetails={notificationDetails}
              setNotificationDetails={setNotificationDetails}
            />
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default OrbitMonitoringModal;
