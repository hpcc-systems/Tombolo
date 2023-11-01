import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Button, Tabs, Form, message, Spin } from 'antd';
import BasicTab from './BasicTab';
import MonitoringTab from './MonitoringTab';
import NotificationsTab from './NotificationsTab';
import useWindowSize from '../../../hooks/useWindowSize';
import { authHeader, handleError } from '../../common/AuthHeader.js';

const { TabPane } = Tabs;

const OrbitMonitoringModal = ({
  modalVisible,
  orbitBuildList,
  setModalVisible,
  saveOrbitBuildDetails,
  selectedOrbitBuild,
  setSelectedOrbitBuild,
  editing,
  setEditing,
  getOrbitMonitoring,
}) => {
  //modal states
  const [modalWidth, setModalWidth] = useState(0);
  const [activeTab, setActiveTab] = useState('1');
  const [cron, setCron] = useState(null);
  const windowSize = useWindowSize();
  const [orbitBuildDetails, setOrbitBuildDetails] = useState(null);
  const [monitoringDetails, setMonitoringDetails] = useState({
    isActive: true,
    monitoringConditions: [],
  });
  const [selectedOrbitBuildDetails, setSelectedOrbitBuildDetails] = useState(null);
  const [notificationDetails, setNotificationDetails] = useState({});
  const [entryForm] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [fetchingOrbitDetails, setFetchingOrbitDetails] = useState(false);

  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  useEffect(() => {
    if (!editing) {
      return;
    }
    if (!selectedOrbitBuildDetails) {
      getOrbitBuildDetails(selectedOrbitBuild);
    }

    //if details have been gotten, set field values
    if (selectedOrbitBuildDetails) {
      //grab and restructure notification channels to set into fields
      let notificationChannels = [];
      let emails;
      let msTeams;

      if (selectedOrbitBuildDetails.metaData && selectedOrbitBuildDetails.metaData.notifications) {
        for (let i = 0; i < selectedOrbitBuildDetails.metaData.notifications.length; i++) {
          if (selectedOrbitBuildDetails.metaData.notifications[i].channel === 'eMail') {
            emails = selectedOrbitBuildDetails.metaData.notifications[i].recipients;
            notificationChannels.push('eMail');
          }

          if (selectedOrbitBuildDetails.metaData.notifications[i].channel === 'msTeams') {
            msTeams = selectedOrbitBuildDetails.metaData.notifications[i].recipients;
            notificationChannels.push('msTeams');
          }
        }
      }

      if (selectedOrbitBuildDetails.metaData) {
        const {
          name,
          cron,
          isActive,
          build,
          metaData: {
            monitoringCondition: { notifyCondition, updateInterval, updateIntervalDays, buildStatus, deleted },
          },
        } = selectedOrbitBuildDetails;

        entryForm.setFieldsValue({
          name: name,
          monitorName: name,
          cron: cron,
          build: build,
          isActive: isActive,
          notificationChannels: notificationChannels,
          notifyCondition: notifyCondition,
          updateInterval: updateInterval,
          updateIntervalDays: updateIntervalDays,
          buildStatus: buildStatus,
          deleted: deleted,
          emails: emails,
          msTeamsGroups: msTeams,
        });

        setSelectedOrbitBuild(build);

        //set states to have fields appear that are necessary
        setCron(cron);
        setMonitoringDetails({
          ...monitoringDetails,
          monitoringConditions: notifyCondition,
        });
        setNotificationDetails({ ...notificationDetails, notificationChannel: notificationChannels });
      }
    }
  }, [selectedOrbitBuildDetails, selectedOrbitBuild]);

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

      if (data.validationError?.errorFields) {
        throw new Error('Validation failed, please check form fields again.');
      }

      const formData = data.formData;

      let notificationChannels = formData.notificationChannels;
      let emails = formData.emails;
      let msTeamsGroups = formData.msTeamsGroups;

      formData.application_id = applicationId;

      // current UTC Time Stamp
      const date = new Date();
      const currentTimeStamp = date.getTime();

      let notifyCondition = formData.notifyCondition;
      let updateInterval = formData.updateInterval;
      let updateIntervalDays = formData.updateIntervalDays;
      let buildStatus = formData.buildStatus;
      let deleted = formData.deleted;

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

      // if (selectedOrbitBuild) {
      //   notifications = selectedOrbitBuildDetails.metaData.notifications;
      // }

      formData.metaData = {
        lastMonitored: currentTimeStamp,
        monitoringCondition: {
          notifyCondition,
          updateInterval,
          updateIntervalDays,
          buildStatus,
          deleted,
        },
        notifications,
        isActive: formData.isActive,
      };

      await saveOrbitBuildDetails(formData);
      cancelModal();
    } catch (err) {
      setConfirmLoading(false);
      console.log(err.message);
      if (err.message !== 'Validation failed') message.error(err.message);
    }
  };

  const cancelModal = async () => {
    await setOrbitBuildDetails(null);
    await setSelectedOrbitBuild(null);
    await setSelectedOrbitBuildDetails(null);
    entryForm.resetFields();
    await setEditing(null);
    await setModalVisible(false);
    await setActiveTab('1');
    await setConfirmLoading(false);
    await getOrbitMonitoring(applicationId);
  };

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

  // Get details of a file monitoring -----------------------------------------------
  const getOrbitBuildDetails = async (id) => {
    try {
      const payload = { method: 'GET', header: authHeader() };
      setFetchingOrbitDetails(true);
      const response = await fetch(`/api/orbit/${id}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      setActiveTab('2');
      setOrbitBuildDetails(data);

      //if selected monitoring, store selected file monitoring in different state for later
      if (selectedOrbitBuild) {
        await setSelectedOrbitBuildDetails(data);
      }
    } catch (err) {
      setFetchingOrbitDetails(false);
    } finally {
      setFetchingOrbitDetails(false);
    }
  };

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
      {fetchingOrbitDetails ? (
        <div style={{ textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
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
                editing={editing}
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
      )}
    </Modal>
  );
};

export default OrbitMonitoringModal;
