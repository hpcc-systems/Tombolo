import React, { useState, useEffect } from 'react';
import { Tooltip, Space, Table, Switch, Modal, Form } from 'antd';
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
  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  useEffect(() => {
    if (applicationId) getPlugins();
  }, [applicationId]);

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
        console.log(data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const editPlugin = async (id) => {
    console.log(id);
    console.log(setConfirmLoading);
    console.log(entryForm);
    setModalVisible(true);
  };

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
            <EditOutlined onClick={() => editPlugin(record.id)} />
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
      />
    </>
  );
};

export default Plugins;
