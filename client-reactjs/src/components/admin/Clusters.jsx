import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Tooltip, Popconfirm, Divider, Select } from 'antd';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';

import { authHeader } from '../common/AuthHeader.js';
import { applicationActions } from '../../redux/actions/Application';
import Text, { i18n } from '../common/Text';

const Option = Select.Option;

function Clusters() {
  const [clusterWhiteList, setClusterWhiteList] = useState([]); // List of clusters from cluster server/whitelist file
  const clusters = useSelector((state) => state.applicationReducer.clusters); // List of cluster from redux-store. Clusters that are already added to DB
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [addClusterModalVisible, setAddClusterModalVisible] = useState(false);
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  //When component loads
  useEffect(() => {
    getClusterWhiteList();
  }, []);

  // Get clusters whitelist function
  const getClusterWhiteList = async () => {
    try {
      const clusters = await fetch('/api/hpcc/read/getClusterWhitelist', {
        headers: authHeader(),
      });
      const clusterWhiteList = await clusters.json();
      setClusterWhiteList(clusterWhiteList);
    } catch (err) {
      message.error('Failed to fetch cluster white list');
    }
  };

  // When add btn is clicked
  const handleAddClusterBtnClick = () => {
    setAddClusterModalVisible(true);
  };

  // when cancel btn is clicked on the modal
  const handleCancel = () => {
    setAddClusterModalVisible(false);
    setSelectedCluster(null);
    form.resetFields();
  };

  // Add cluster function
  const addCluster = async () => {
    const formData = form.getFieldsValue();

    if (selectedCluster) {
      formData.id = selectedCluster.id;
    }

    try {
      const response = await fetch('/api/hpcc/read/newcluster', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw Error('Failed to save cluster');
      }
      message.success('Successfully added cluster');
      setAddClusterModalVisible(false);
      dispatch(applicationActions.getClusters());
    } catch (err) {
      message.error(err.message);
    }
  };

  // Edit cluster function
  const handleEditCluster = (cluster) => {
    setAddClusterModalVisible(true);
    form.setFieldsValue({ name: cluster.name });
  };
  // Delete cluster function
  const deleteCluster = async (clusterId) => {
    var data = JSON.stringify({ clusterIdsToDelete: clusterId });
    try {
      const response = await fetch('/api/hpcc/read/removecluster', {
        method: 'post',
        headers: authHeader(),
        body: data,
      });

      if (!response.ok) {
        throw Error('Failed to delete cluster');
      }
      message.success('Cluster deleted successfully');
      dispatch(applicationActions.getClusters());
    } catch (err) {
      message.error(err.message);
    }
  };

  // Table Columns
  const clusterTableColumns = [
    {
      title: <Text text="Name" />,
      dataIndex: 'name',
      width: '20%',
      render: (text, record) => <Link to={`/admin/clusters/${record.id}`}>{text}</Link>,
    },
    {
      width: '20%',
      title: 'Thor Host',
      dataIndex: 'thor_host',
    },
    {
      width: '15%',
      title: 'Thor Port',
      dataIndex: 'thor_port',
    },
    {
      width: '20%',
      title: 'Roxie Host',
      dataIndex: 'roxie_host',
    },
    {
      width: '15%',
      title: 'Roxie Port',
      dataIndex: 'roxie_port',
    },
    {
      width: '10%',
      title: <Text text="Action" />,
      dataIndex: '',
      render: (text, record) => (
        <span>
          <Tooltip placement="right" title={<Text text="Edit Cluster" />}>
            <EditOutlined onClick={() => handleEditCluster(record)} />
          </Tooltip>
          <Divider type="vertical" />
          <Popconfirm
            title="Are you sure you want to delete this Cluster?"
            onConfirm={() => deleteCluster(record.id)}
            icon={<QuestionCircleOutlined />}>
            <Tooltip placement="right" title={<Text text="Delete Cluster" />}>
              <DeleteOutlined />
            </Tooltip>
          </Popconfirm>
          <Divider type="vertical" />
        </span>
      ),
    },
  ];

  return (
    <>
      <Button
        onClick={handleAddClusterBtnClick}
        type="primary"
        style={{ margin: '5px', display: 'block', marginLeft: 'auto' }}>
        {<Text text="Add Cluster" />}
      </Button>

      <Table
        columns={clusterTableColumns}
        rowKey={(record) => record.id}
        dataSource={clusters}
        pagination={clusterWhiteList.length > 10 ? { pageSize: 10 } : false}
      />

      <Modal
        visible={addClusterModalVisible}
        onCancel={handleCancel}
        okText={<Text text="Add" />}
        onOk={addCluster}
        cancelText={<Text text="Cancel" />}>
        <Form layout="vertical" form={form}>
          <Form.Item label={<Text text="Host" />} name="name" required>
            <Select placeholder={i18n('Select a Cluster')}>
              {clusterWhiteList.map((cluster) => (
                <Option key={cluster.name} value={cluster.name}>
                  {cluster.name + ' - ' + cluster.thor + ':' + cluster.thor_port}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label={<Text text="Username" />} name="username" required>
            <Input />
          </Form.Item>

          <Form.Item label={<Text text="Password" />} name="password">
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Clusters;
