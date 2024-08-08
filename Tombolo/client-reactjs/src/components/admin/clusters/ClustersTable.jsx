import React from 'react';
import { Table, Space, message, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import { deleteCluster } from './clusterUtils';

function ClustersTable({
  clusters,
  setClusters,
  setDisplayClusterDetailsModal,
  setSelectedCluster,
  setDisplayEditClusterModal,
}) {
  //Columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Thor host',
      dataIndex: 'thor_host',
    },
    {
      title: 'Thor port',
      dataIndex: 'thor_port',
    },
    {
      title: 'Roxie host',
      dataIndex: 'roxie_host',
    },
    {
      title: 'Roxie port',
      dataIndex: 'roxie_port',
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_text, record) => (
        <Space size="middle">
          <EyeOutlined onClick={() => handleViewClusterDetails(record)} />
          <EditOutlined onClick={() => handleEditClusterDetails(record)} />
          <Popconfirm
            overlayStyle={{ width: 400 }}
            okButtonProps={{ danger: true }}
            okText="Yes"
            cancelButtonProps={{ type: 'primary', ghost: true }}
            onConfirm={() => handleDeleteCluster(record.id)}
            title="Are you sure you want to delete this cluster? This action will permanently remove all cluster details and any recorded usage history.">
            <DeleteOutlined />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Handle delete cluster
  const handleDeleteCluster = async (id) => {
    try {
      await deleteCluster(id);
      message.success('Cluster deleted successfully');
      setClusters((clusters) => clusters.filter((cluster) => cluster.id !== id));
    } catch (e) {
      message.error('Failed to delete cluster');
    }
  };

  // Handle view cluster details
  const handleViewClusterDetails = (record) => {
    setSelectedCluster(record);
    setDisplayClusterDetailsModal(true);
  };

  // Handle edit cluster details
  const handleEditClusterDetails = (record) => {
    setSelectedCluster(record);
    setDisplayEditClusterModal(true);
  };
  return <Table columns={columns} dataSource={clusters} size="small" rowKey={(record) => record.id} />;
}

export default ClustersTable;
