import React, { useState, useEffect } from 'react';
import { Tooltip, Space, Table, Switch, Modal, Form, Input, Button, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import BreadCrumbs from '../common/BreadCrumbs';
import { authHeader } from '../common/AuthHeader.js';
import { useSelector } from 'react-redux';
import useWindowSize from '../../hooks/useWindowSize';

const Plugins = () => {
  const [plugins, setPlugins] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalWidth, setModalWidth] = useState(0);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState({});
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
  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  useEffect(() => {
    if (applicationId) getPlugins();
  }, [applicationId]);

  useEffect(() => {
    console.log(notifications);
  });

  const getPlugins = async () => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };
      const response = await fetch(`/api/plugins/get/${applicationId}`, payload);

      const data = await response.json();
      if (data) {
        setPlugins(data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const editPlugin = async (record) => {
    await setModalVisible(true);
    await setSelectedPlugin(record);
    await setNotifications(record.metaData);
  };

  const handleSave = async () => {
    setConfirmLoading(true);

    const payload = {
      method: 'PUT',
      header: authHeader(),
      body: JSON.stringify(notifications),
    };
    const response = await fetch(`/api/plugins/update/${applicationId}/${selectedPlugin.name}`, payload);

    if (response.ok) {
      getPlugins();
      setConfirmLoading(false);
      setModalVisible(false);
      notificationForm.resetFields();
      message.success('Successfully updated Plugin');
    } else {
      message.success('An Error Occured, Plugin not updated');
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

  const togglePlugin = async (name) => {
    try {
      const payload = {
        method: 'PUT',
        header: authHeader(),
      };
      const response = await fetch(`/api/plugins/toggle/${applicationId}/${name}`, payload);

      if (response.ok) {
        getPlugins();
      }
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
              <Switch checked={record.active} onChange={() => togglePlugin(record.name)} />
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
            <EditOutlined onClick={() => editPlugin(record)} />
          </Tooltip>
        </a>
      ),
    },
  ];

  return (
    <>
      <BreadCrumbs />
      <br />
      <Table size="small" columns={columns} dataSource={plugins} rowKey={(record) => record.id} />
      <Modal
        visible={modalVisible}
        width={modalWidth}
        onCancel={cancelModal}
        maskClosable={false}
        confirmLoading={confirmLoading}
        destroyOnClose
        footer={saveBtn}
        title="Plugin Settings">
        <Form layout="vertical" form={notificationForm} initialValues={{ monitoringActive: true }}>
          <h3>Megaphone Alert Contacts</h3>
          <Form.Item
            label="Emails"
            style={{ width: '100%' }}
            name="notificationEmails"
            initialValue={selectedPlugin.metaData?.notificationEmails}
            validateTrigger={['onChange', 'onBlur']}>
            <Input onChange={(e) => setNotifications({ ...notifications, notificationEmails: e.target.value })}></Input>
          </Form.Item>
          <Form.Item
            label="Webhooks"
            style={{ width: '100%' }}
            name="notificationWebhooks"
            initialValue={selectedPlugin.metaData?.notificationWebhooks}
            validateTrigger={['onChange', 'onBlur']}>
            <Input
              onChange={(e) => setNotifications({ ...notifications, notificationWebhooks: e.target.value })}></Input>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Plugins;
