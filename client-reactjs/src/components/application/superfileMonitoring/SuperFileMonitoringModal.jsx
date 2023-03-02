import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Form, Tabs, Button, message, Spin } from 'antd';
import useWindowSize from '../../../hooks/useWindowSize';
import NotificationTab from './NotificationTab';
import BasicTab from './BasicTab';
import MonitoringTab from './MonitoringTab';
import { authHeader, handleError } from '../../common/AuthHeader.js';

const { TabPane } = Tabs;

const SuperFileMonitoringModal = ({
  modalVisible,
  setModalVisible,
  saveFileMonitoringDetails,
  setSuccessAddingMonitoring,
  selectedFileMonitoring,
  superfileMonitoringList,
}) => {
  //adjust modal width and visibility and tabs
  const [modalWidth, setModalWidth] = useState(0);
  const [activeTab, setActiveTab] = useState('1');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [fetchingFileMonitoringDetails, setFetchingFileMonitoringDetails] = useState(false);

  //data field states
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [superFileName, setSuperFileName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [superFileDetails, setSuperFileDetails] = useState(null);
  const [selectedSuperFileDetails, setSelectedSuperFileDetails] = useState(null);
  const [notificationDetails, setNotificationDetails] = useState({});
  const [cron, setCron] = useState(null);

  //extra states needed for data verification and entry

  const [monitoringDetails, setMonitoringDetails] = useState({
    monitoringActive: true,
    monitoringConditions: [],
  });
  const applicationReducer = useSelector((state) => state.applicationReducer);

  const [entryForm] = Form.useForm();
  const windowSize = useWindowSize();
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

  useEffect(() => {
    if (superFileName === null) {
      entryForm.setFieldsValue(displayName, selectedCluster, superFileName);
    }
  }, [superFileName]);

  // Fetch details and fill if view btn is clicked -----------------------------------
  useEffect(() => {
    if (selectedFileMonitoring === null) {
      // setHasEditPermission(true);
      return;
    }
    if (!superFileDetails) {
      getFileMonitoringDetails(selectedFileMonitoring);
    }

    //if superFileDetails have been gotten, set field values
    if (selectedSuperFileDetails) {
      let notificationChannels;
      let emails;
      let msTeams;

      if (selectedSuperFileDetails.metaData && selectedSuperFileDetails.metaData.notifications) {
        for (let i = 0; i < selectedSuperFileDetails.metaData.notifications.length; i++) {
          if (selectedSuperFileDetails.metaData.notifications[i].channel === 'eMail') {
            emails = selectedSuperFileDetails.metaData.notifications[i].recipients;
            notificationChannels = 'eMail';
          }

          if (selectedSuperFileDetails.metaData.notifications[i].channel === 'msTeams') {
            msTeams = selectedSuperFileDetails.metaData.notifications[i].recipients;
            notificationChannels += ' msTeams';
          }
        }
      }

      if (selectedSuperFileDetails.metaData) {
        //format date for placement
        // let updateIntervalInitialDate = new Date(selectedSuperFileDetails.metaData.fileInfo.modified);
        // let year = updateIntervalInitialDate.getFullYear();
        // let month = String(updateIntervalInitialDate.getMonth()).padStart(2, '0');
        // let day = String(updateIntervalInitialDate.getDate()).padStart(2, '0');
        // // let formattedDate = `${year}-${month}-${day}`;

        entryForm.setFieldsValue({
          cluster_id: selectedSuperFileDetails.metaData.fileInfo.Cluster,
          fileName: selectedSuperFileDetails.metaData.fileInfo.Name,
          monitorName: selectedSuperFileDetails.name,
          cron: selectedSuperFileDetails.cron,
          monitoringActive: selectedSuperFileDetails.monitoringActive,
          notificationChannels: notificationChannels,
          notifyCondition: selectedSuperFileDetails.metaData.monitoringCondition.notifyCondition,
          updateInterval: selectedSuperFileDetails.metaData.monitoringCondition.updateInterval,
          updateIntervalDays: selectedSuperFileDetails.metaData.monitoringCondition.updateIntervalDays,
          updateIntervalInitialDate: null,
          emails: emails,
          msTeamsGroups: msTeams,
        });

        setSelectedCluster(selectedSuperFileDetails.metaData.fileInfo.Cluster);
        setDisplayName(selectedSuperFileDetails.name);
        setCron(cron);
        setMonitoringDetails({
          ...monitoringDetails,
          monitoringConditions: selectedSuperFileDetails.metaData.monitoringCondition.notifyCondition,
        });
        setNotificationDetails({ ...notificationDetails, notificationChannel: notificationChannels });
      }
    }
  }, [selectedSuperFileDetails, selectedFileMonitoring]);

  // Get details of a file monitoring -----------------------------------------------
  const getFileMonitoringDetails = async (id) => {
    try {
      const payload = { method: 'GET', header: authHeader() };
      setFetchingFileMonitoringDetails(true);
      const response = await fetch(`/api/superfilemonitoring/read/${id}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();

      setActiveTab('1');
      setSuperFileDetails(data);

      //if selected file monitoring, store selected file monitoring in different state
      if (selectedFileMonitoring) {
        setSelectedSuperFileDetails(data);
      }
    } catch (err) {
      setFetchingFileMonitoringDetails(false);
    } finally {
      setFetchingFileMonitoringDetails(false);
    }
  };

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

      formData.application_id = applicationReducer.application.applicationId;

      // current UTC Time Stamp
      const date = new Date();
      const currentTimeStamp = date.getTime();

      let notifyCondition = formData.notifyCondition;
      let minimumSubFileCount = formData.minimumSubFileCount;
      let maximumSubFileCount = formData.maximumSubFileCount;
      let minimumFileSize = formData.minimumFileSize;
      let maximumFileSize = formData.maximumFileSize;
      let updateInterval = formData.updateInterval;
      let updateIntervalDays = formData.updateIntervalDays;
      let updateIntervalInitialDate = new Date(formData.updateIntervalInitialDate).getTime();

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

      if (selectedFileMonitoring) {
        notifications = selectedSuperFileDetails.metaData.notifications;
      }

      formData.metaData = {
        lastMonitored: currentTimeStamp,
        fileInfo: superFileDetails,
        monitoringCondition: {
          notifyCondition,
          minimumSubFileCount,
          maximumSubFileCount,
          minimumFileSize: minimumFileSize * 1000,
          maximumFileSize: maximumFileSize * 1000,
          updateInterval,
          updateIntervalDays,
          updateIntervalInitialDate,
        },
        notifications,
        monitoringActive: formData.monitoringActive,
      };

      delete formData.notifyCondition;
      delete formData.minimumFileSize;
      delete formData.maximumFileSize;
      delete formData.notificationChannels;
      delete formData.emails;
      delete formData.msTeamsGroups;

      console.log(formData);

      await saveFileMonitoringDetails(formData);
      setConfirmLoading(false);
      //rerender table, useEffect on main superfilemonitoring tracks this to get list of all monitoring
      setSuccessAddingMonitoring((prev) => prev + 1);
      //set modal not visible
      setModalVisible(false);
      entryForm.resetFields();
    } catch (err) {
      setConfirmLoading(false);
      console.log(err.message);
      if (err.message !== 'Validation failed') message.error(err.message);
    }
  };

  function cancelFileMonitoringModal() {
    //figure out why we have to call set state like this instead of just setModalVisible(false)
    setModalVisible(false);
    // setModalVisible(false);
    setConfirmLoading(false);

    //unused fields
    setSuperFileName;
  }

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
    <>
      <Modal
        visible={modalVisible}
        width={modalWidth}
        onCancel={cancelFileMonitoringModal}
        maskClosable={false}
        confirmLoading={confirmLoading}
        destroyOnClose
        footer={btns[activeTab]}
        style={{ marginTop: '100px' }}>
        {fetchingFileMonitoringDetails ? (
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
              <TabPane tab="File Selection" key="1">
                <BasicTab
                  selectedCluster={selectedCluster}
                  setSelectedCluster={setSelectedCluster}
                  superFileDetails={superFileDetails}
                  setSuperFileDetails={setSuperFileDetails}
                  form={entryForm}
                />
              </TabPane>
              <TabPane tab="Monitoring" key="2">
                <MonitoringTab
                  monitoringDetails={monitoringDetails}
                  setMonitoringDetails={setMonitoringDetails}
                  selectedFileMonitoringDetails={superFileDetails}
                  setDisplayName={setDisplayName}
                  displayName={displayName}
                  entryForm={entryForm}
                  cron={cron}
                  setCron={setCron}
                  superfileMonitoringList={superfileMonitoringList}
                  selectedFileMonitoring={selectedFileMonitoring}
                />
              </TabPane>
              <TabPane tab="Notifications" key="3">
                <NotificationTab
                  setNotificationDetails={setNotificationDetails}
                  notificationDetails={notificationDetails}
                  selectedFileMonitoringDetails={superFileDetails}
                />
              </TabPane>
            </Tabs>
          </Form>
        )}
      </Modal>
    </>
  );
};

export default SuperFileMonitoringModal;
