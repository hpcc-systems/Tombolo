import React, { useState, useEffect } from 'react';
import { Tooltip, Space, Table, Switch, Modal, Form, Input, Button, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import BreadCrumbs from '../common/BreadCrumbs.js';
import { authHeader } from '../common/AuthHeader.js';
import { useSelector, useDispatch } from 'react-redux';
import { applicationActions } from '../../redux/actions/Application.js';
import useWindowSize from '../../hooks/useWindowSize.js';

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalWidth, setModalWidth] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState({});
  const [notifications, setNotifications] = useState({});
  const [notificationForm] = Form.useForm();
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
  };

  const handleSave = async () => {
    setConfirmLoading(true);

    const payload = {
      method: 'PUT',
      header: authHeader(),
      body: JSON.stringify(notifications),
    };
    const response = await fetch(`/api/integrations/update/${applicationId}/${selectedIntegration.name}`, payload);

    if (response.ok) {
      getIntegrations();
      setConfirmLoading(false);
      setModalVisible(false);
      dispatch(applicationActions.getIntegrations(applicationId));

      notificationForm.resetFields();
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
        <Form layout="vertical" form={notificationForm} initialValues={{ monitoringActive: true }}>
          <h3>Megaphone Notification Settings</h3>
          <Form.Item name="megaphone" label="Active">
            <Switch defaultChecked></Switch>
          </Form.Item>
          <Form.Item
            label="Notification Emails"
            style={{ width: '100%' }}
            name="notificationEmails"
            initialValue={selectedIntegration.metaData?.notificationEmails}
            validateTrigger={['onChange', 'onBlur']}>
            <Input onChange={(e) => setNotifications({ ...notifications, notificationEmails: e.target.value })}></Input>
          </Form.Item>
          <Form.Item
            label="Notification Webhooks"
            style={{ width: '100%' }}
            name="notificationWebhooks"
            initialValue={selectedIntegration.metaData?.notificationWebhooks}
            validateTrigger={['onChange', 'onBlur']}>
            <Input
              onChange={(e) => setNotifications({ ...notifications, notificationWebhooks: e.target.value })}></Input>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Integrations;
