//Package Imports
import React, { useState, useEffect } from 'react';
import { Tooltip, Space, Table, Switch, Modal, Button, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';

// Local Imports
import BreadCrumbs from '../../common/BreadCrumbs.js';
import { authHeader } from '../../common/AuthHeader.js';
import { applicationActions } from '../../../redux/actions/Application.js';
import useWindowSize from '../../../hooks/useWindowSize.js';
import ASRForm from './IntegrationForms/ASRForm.js';

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalWidth, setModalWidth] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState({});
  const [notifications, setNotifications] = useState({});
  const [active, setActive] = useState(false);

  const windowSize = useWindowSize();

  // Changes modal size per screen vw
  useEffect(() => {
    const { width } = windowSize.inner;
    if (width > 1500) {
      setModalWidth('40vw');
    } else if (width > 1000) {
      integrations;
      setModalWidth('60vw');
    } else {
      setModalWidth('100vw');
    }
  }, [windowSize]);

  const dispatch = useDispatch();
  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  useEffect(() => {
    if (applicationId) getIntegrations();
  }, [applicationId]);

  const getIntegrations = async () => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };
      const response = await fetch(`/api/integrations/get/${applicationId}`, payload);

      const data = await response.json();

      if (data) {
        setIntegrations(data);
      }
      dispatch(applicationActions.getIntegrations(applicationId));
    } catch (err) {
      console.log(err);
    }
  };

  const editIntegration = async (record) => {
    await setModalVisible(true);
    await setSelectedIntegration(record);
    await setNotifications(record.metaData);
    await setActive(record.config?.megaphoneActive);
  };

  const handleSave = async () => {
    setConfirmLoading(true);

    const body = { notifications, active: { megaphoneActive: active } };

    const payload = {
      method: 'PUT',
      header: authHeader(),
      body: JSON.stringify(body),
    };

    const response = await fetch(`/api/integrations/update/${applicationId}/${selectedIntegration.name}`, payload);

    if (response.ok) {
      getIntegrations();
      setConfirmLoading(false);
      setModalVisible(false);
      dispatch(applicationActions.getIntegrations(applicationId));

      message.success('Successfully updated Integration');
    } else {
      message.success('An Error Occured, Integration not updated');
    }
  };

  const saveBtn = (
    <Button key="save" type="primary" onClick={handleSave} loading={confirmLoading}>
      Save
    </Button>
  );
  const cancelModal = async () => {
    setModalVisible(false);
  };

  const toggleIntegration = async (name) => {
    try {
      const payload = {
        method: 'PUT',
        header: authHeader(),
      };
      const response = await fetch(`/api/integrations/toggle/${applicationId}/${name}`, payload);

      if (response.ok) {
        getIntegrations();
      }
      dispatch(applicationActions.getIntegrations(applicationId));
    } catch (err) {
      console.log(err);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Description', dataIndex: 'description' },
    {
      title: 'Activate',
      dataIndex: 'activate',
      render: (_, record) => (
        <Space size="middle">
          <a>
            <Tooltip title="Active">
              <Switch checked={record.active} onChange={() => toggleIntegration(record.name)} />
            </Tooltip>
          </a>
        </Space>
      ),
    },
    {
      title: 'Edit',
      dataIndex: 'edit',
      render: (_, record) => (
        <a>
          <Tooltip title="Edit">
            <EditOutlined onClick={() => editIntegration(record)} />
          </Tooltip>
        </a>
      ),
    },
  ];

  return (
    <>
      <BreadCrumbs />
      <br />
      <Table size="small" columns={columns} dataSource={integrations} rowKey={(record) => record.id} />
      <Modal
        visible={modalVisible}
        width={modalWidth}
        onCancel={cancelModal}
        maskClosable={false}
        confirmLoading={confirmLoading}
        destroyOnClose
        footer={saveBtn}
        title="Integration Settings">
        {selectedIntegration?.name === 'ASR' && (
          <>
            <ASRForm
              setActive={setActive}
              setNotifications={setNotifications}
              selectedIntegration={selectedIntegration}
              notifications={notifications}
              handleSave={handleSave}
            />
          </>
        )}
      </Modal>
    </>
  );
};

export default Integrations;
