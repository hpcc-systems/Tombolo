import React, { useState } from 'react';
import { Table, Space, Popconfirm, Button, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';

import { deleteCluster, pingExistingCluster, getCluster } from './clusterUtils';
import { formatDateTime } from '../../common/CommonUtil';
import { handleSuccess, handleError } from '@/components/common/handleResponse';
import styles from './clusters.module.css';

function ClustersTable({
  clusters,
  setClusters,
  setDisplayClusterDetailsModal,
  setSelectedCluster,
  setDisplayEditClusterModal,
}) {
  // States
  const [testingConnection, setTestingConnection] = useState(null);

  //Columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      status: 'Status',
      dataIndex: 'status',
      render: (text, record) => {
        if (testingConnection === record.id) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div>{text}</div>
              <span className={styles.Clusters__statusText}>Testing ...</span>
            </div>
          );
        } else if (record.reachabilityInfo && record.reachabilityInfo.reachable === false) {
          return (
            <Tooltip
              overlayClassName={styles.clustersTable__toolTip_reachabilityStatus}
              title={
                <div>
                  <div>Last Reachable : {formatDateTime(record.reachabilityInfo?.lastReachableAt)}</div>
                  <div>Issue: {record.reachabilityInfo?.unReachableMessage}</div>
                </div>
              }>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div>{text}</div>
                <CloseCircleFilled style={{ color: 'red', fontSize: '1.2rem' }} />
                <span className={styles.Clusters__statusText}>Unreachable</span>
              </div>
            </Tooltip>
          );
        } else {
          return (
            <Tooltip
              title={<div>Last Reachable : {formatDateTime(record.reachabilityInfo?.lastReachableAt)}</div>}
              overlayClassName={styles.clustersTable__toolTip_reachabilityStatus}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div>{text}</div>
                <>
                  <CheckCircleFilled style={{ color: 'green', fontSize: '1.2rem' }} />
                  <span className={styles.Clusters__statusText}>Reachable</span>
                </>
              </div>
            </Tooltip>
          );
        }
      },
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
          <Button
            type="primary"
            size="small"
            onClick={() => handleTestConnection(record)}
            disabled={testingConnection === record.id ? true : false}>
            Test Connection
          </Button>
        </Space>
      ),
    },
  ];

  // Handle delete cluster
  const handleDeleteCluster = async (id) => {
    try {
      await deleteCluster(id);
      handleSuccess('Cluster deleted successfully');
      setClusters((clusters) => clusters.filter((cluster) => cluster.id !== id));
    } catch (e) {
      handleError('Failed to delete cluster');
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

  // Handle test connection
  const handleTestConnection = async (record) => {
    try {
      setTestingConnection(record.id);
      await pingExistingCluster({ clusterId: record.id });
    } catch (e) {
      handleError('Failed to establish connection with cluster');
    } finally {
      setTestingConnection(false);
    }

    // Get updated cluster and set it
    try {
      const updatedCluster = await getCluster(record.id);
      setClusters((clusters) => clusters.map((cluster) => (cluster.id === record.id ? updatedCluster : cluster)));
    } catch (err) {
      handleError('Failed to get updated cluster');
    }
  };

  return <Table columns={columns} dataSource={clusters} size="small" rowKey={(record) => record.id} />;
}

export default ClustersTable;
