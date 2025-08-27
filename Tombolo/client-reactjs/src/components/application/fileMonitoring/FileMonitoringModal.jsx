import React, { useEffect, useState } from 'react';
import { message, Modal, Tabs, Form, Badge, Button, Spin } from 'antd';
import { useSelector } from 'react-redux';

import useWindowSize from '../../../hooks/useWindowSize';
import BasicTab from './BasicTab';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import NotificationTab from './NotificationTab';
import MonitoringTab from './MonitoringTab';
// import { hasEditPermission } from '../../common/AuthUtil';

const { TabPane } = Tabs;

function FileMonitoringModal({
  visible,
  setModalVisibility,
  setSuccessAddingMonitoring,
  fileMonitoringList,
  selectedFileMonitoring,
  setSelectedFileMonitoring,
  isReader,
}) {
  const [modalWidth, setModalWidth] = useState(0);
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tabsWithError, setTabsWithError] = useState([]);
  const [activeTab, setActiveTab] = useState('1');
  const [monitoringAssetType, setMonitoringAssetType] = useState(null);
  const [fetchingFileMonitoringDetails, setFetchingFileMonitoringDetails] = useState(false);
  const [selectedFileMonitoringDetails, setSelectedFileMonitoringDetails] = useState(null);

  //TODO  Try getting rid of below three states -------------------------------------
  const [monitoringDetails, setMonitoringDetails] = useState({
    monitoringActive: true,
    monitoringConditions: [],
  });
  const [notificationDetails, setNotificationDetails] = useState({});
  const [selectedFileDetails, setSelectedFileDetails] = useState(null);
  const windowSize = useWindowSize();
  const [basicTabForm] = Form.useForm();
  const [monitoringTabForm] = Form.useForm();
  const [notificationTabForm] = Form.useForm();

  // ---------------------------------------------------------------------------------
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

  // Fetch details and fill if view btn is clicked -----------------------------------
  useEffect(() => {
    if (selectedFileMonitoring === null) {
      // setHasEditPermission(true);
      return;
    }
    setActiveTab('0');
    getFileMonitoringDetails(selectedFileMonitoring);
  }, [selectedFileMonitoring]);

  // Get details of a file monitoring -----------------------------------------------
  const getFileMonitoringDetails = async (id) => {
    try {
      const payload = { method: 'GET', headers: authHeader() };
      setFetchingFileMonitoringDetails(true);
      const response = await fetch(`/api/filemonitoring/read/${id}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      setActiveTab('1');
      setSelectedFileMonitoringDetails(data);
    } catch (err) {
      message.error('Unable to fetch file monitoring details');
      setFetchingFileMonitoringDetails(false);
    } finally {
      setFetchingFileMonitoringDetails(false);
    }
  };

  //Save file monitoring [ saves file monitoring to file monitoring table]
  const saveFileMonitoringDetails = async (monitoringDetails) => {
    try {
      const payload = {
        method: selectedFileMonitoringDetails ? 'PUT' : 'POST',
        headers: authHeader(),
        body: JSON.stringify({ ...monitoringDetails }),
      };

      const response = await fetch('/api/filemonitoring/read/', payload);
      if (!response.ok) handleError(response);
      resetFormFields();
      setModalVisibility(false);
      setSuccessAddingMonitoring((prev) => prev + 1);
      message.success('Successfully saved file monitoring data');
    } catch (error) {
      console.log(error);
      message.error('Failed to save file monitoring');
    }
  };
  // Validate all forms -----------------------------------------------------------------
  const validateForms = async () => {
    let validationError = null;
    let formData = {};
    setTabsWithError(() => []);

    try {
      const basicData = await basicTabForm.validateFields();
      formData = { ...formData, ...basicData };
    } catch (err) {
      setTabsWithError((tabsWithError) => [...tabsWithError, 'basicTab']);
      validationError = err;
    }

    try {
      const monitoringData = await monitoringTabForm.validateFields();
      formData = { ...formData, ...monitoringData };
    } catch (err) {
      setTabsWithError((tabsWithError) => [...tabsWithError, 'monitoringTab']);
      validationError = err;
    }

    try {
      const notificationData = await notificationTabForm.validateFields();
      formData = { ...formData, ...notificationData };
    } catch (err) {
      setTabsWithError((tabsWithError) => [...tabsWithError, 'notificationTab']);
      validationError = err;
    }
    return { validationError, formData };
  };

  // -------------------------------------------------------------------------------------
  // reset all form fields
  const resetFormFields = () => {
    basicTabForm.resetFields();
    monitoringTabForm.resetFields();
    notificationTabForm.resetFields();
    setTabsWithError([]);
  };

  //When save button on modal is clicked --------------------------------------------------
  const handleSave = async () => {
    try {
      const data = await validateForms();
      if (data.validationError?.errorFields) {
        throw new Error('Validation failed');
      }
      const { formData } = data;
      if (selectedFileMonitoringDetails) {
        formData.id = selectedFileMonitoringDetails.id;
      }
      formData.application_id = applicationId;

      const {
        monitoringAssetType,
        landingZone,
        machine,
        dirToMonitor,
        fileName,
        notifyCondition,
        expectedFileMoveTime,
        notificationChannels,
        emails,
        msTeamsGroups,
        minimumFileSize,
        maximumFileSize,
      } = formData;

      //Some of this form data will be nested inside metaData, so remove them from parent formData obj to reduce noise
      delete formData.notifyCondition;
      delete formData.minimumFileSize;
      delete formData.maximumFileSize;
      delete formData.notificationChannels;
      delete formData.emails;
      delete formData.msTeamsGroups;

      //organize notifications
      const notifications = [];
      for (let i = 0; i < notificationChannels.length; i++) {
        if (notificationChannels[i] == 'eMail') {
          notifications.push({ channel: 'eMail', recipients: emails });
        }
        if (notificationChannels[i] == 'msTeams') {
          notifications.push({ channel: 'msTeams', recipients: msTeamsGroups });
        }
      }

      // current UTC Time Stamp
      const date = new Date();
      const currentTimeStamp = date.getTime();

      if (monitoringAssetType === 'landingZoneFile') {
        //move some data to metaData object
        formData.metaData = {
          lastMonitored: currentTimeStamp,
          currentlyMonitoring: [],
          fileInfo: {
            landingZone,
            machine,
            dirToMonitor,
            fileName,
          },
          monitoringCondition: {
            notifyCondition,
            expectedFileMoveTime,
            minimumFileSize,
            maximumFileSize,
          },
          notifications,
        };
        await saveFileMonitoringDetails(formData);
      }

      if (monitoringAssetType === 'logicalFiles') {
        //move some data to metaData object
        formData.metaData = {
          lastMonitored: currentTimeStamp,
          currentlyMonitoring: [],
          fileInfo: selectedFileDetails,
          monitoringCondition: {
            notifyCondition,
            expectedFileMoveTime,
            minimumFileSize: parseInt(minimumFileSize),
            maximumFileSize: parseInt(maximumFileSize),
          },
          notifications,
        };
        await saveFileMonitoringDetails(formData);
      }
    } catch (err) {
      console.log(err.message);
      if (err.message != 'Validation failed') message.error(err.message);
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
    <Button key="save" type="primary" onClick={handleSave} disabled={isReader}>
      Save
    </Button>
  );
  const btns = {
    0: null,
    1: [nextBtn],
    2: [backBtn, nextBtn],
    3: [backBtn, saveBtn],
  };

  // on cancel/modal close -------------------------------------------------------------
  const cancelFileMonitoringModal = () => {
    resetFormFields();
    setSelectedFileMonitoring(null);
    setFetchingFileMonitoringDetails(false);
    setSelectedFileMonitoringDetails(null);
    setModalVisibility(false);
  };

  // JSX -----------------------------------------------------------------------------
  return (
    <Modal
      open={visible}
      maskClosable={false}
      width={modalWidth}
      onCancel={cancelFileMonitoringModal}
      footer={btns[activeTab]}
      destroyOnClose>
      {fetchingFileMonitoringDetails ? (
        <div style={{ textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <Tabs
          type="card"
          activeKey={activeTab}
          onTabClick={(record) => {
            setActiveTab(record);
          }}>
          <TabPane
            tab={
              <span>
                Basic
                {tabsWithError.includes('basicTab') ? <Badge color="#ff4d4f" style={{ marginLeft: '5px' }} /> : null}
              </span>
            }
            key="1"
            forceRender>
            <BasicTab
              selectedCluster={selectedCluster}
              setSelectedCluster={setSelectedCluster}
              setSelectedFile={setSelectedFile}
              selectedFile={selectedFile}
              basicTabForm={basicTabForm}
              selectedFileDetails={selectedFileDetails}
              setSelectedFileDetails={setSelectedFileDetails}
              monitoringAssetType={monitoringAssetType}
              setMonitoringAssetType={setMonitoringAssetType}
              selectedFileMonitoringDetails={selectedFileMonitoringDetails}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                Monitoring
                {tabsWithError.includes('monitoringTab') ? (
                  <Badge color="#ff4d4f" style={{ marginLeft: '5px' }} />
                ) : null}
              </span>
            }
            key="2"
            forceRender
            label>
            <MonitoringTab
              monitoringDetails={monitoringDetails}
              setMonitoringDetails={setMonitoringDetails}
              fileMonitoringList={fileMonitoringList}
              monitoringTabForm={monitoringTabForm}
              monitoringAssetType={monitoringAssetType}
              selectedFileMonitoringDetails={selectedFileMonitoringDetails}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                Notification
                {tabsWithError.includes('notificationTab') ? (
                  <Badge color="#ff4d4f" style={{ marginLeft: '5px' }} />
                ) : null}
              </span>
            }
            key="3"
            forceRender>
            <NotificationTab
              setNotificationDetails={setNotificationDetails}
              notificationDetails={notificationDetails}
              notificationTabForm={notificationTabForm}
              selectedFileMonitoringDetails={selectedFileMonitoringDetails}
            />
          </TabPane>
        </Tabs>
      )}
    </Modal>
  );
}

export default FileMonitoringModal;
