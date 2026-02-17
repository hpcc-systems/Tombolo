import { useState } from 'react';
import { Table, Space, Popconfirm, Button, Tooltip } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  FileTextOutlined,
} from '@ant-design/icons';
import { useHistory } from 'react-router-dom';

import clustersService from '@/services/clusters.service';
import { formatDateTime } from '../../common/CommonUtil';
import { handleSuccess, handleError } from '@/components/common/handleResponse';
import styles from './clusters.module.css';

import type { ClusterUI } from '@tombolo/shared';
import type { ColumnsType } from 'antd/es/table';
import type { FC } from 'react';

interface ClustersTableProps {
  clusters: ClusterUI[];
  setClusters: (c: ClusterUI[] | ((prev: ClusterUI[]) => ClusterUI[])) => void;
  setDisplayClusterDetailsModal: (v: boolean) => void;
  setSelectedCluster: (c: ClusterUI | null) => void;
  setDisplayEditClusterModal: (v: boolean) => void;
}

const ClustersTable: FC<ClustersTableProps> = ({
  clusters,
  setClusters,
  setDisplayClusterDetailsModal,
  setSelectedCluster,
  setDisplayEditClusterModal,
}) => {
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const history = useHistory();

  const handleDeleteCluster = async (id: string) => {
    try {
      await clustersService.delete(id);
      handleSuccess('Cluster deleted successfully');
      setClusters((clusters: ClusterUI[]) => clusters.filter(cluster => cluster.id !== id));
    } catch (e) {
      handleError('Failed to delete cluster');
    }
  };

  const handleViewClusterDetails = (record: ClusterUI) => {
    setSelectedCluster(record);
    setDisplayClusterDetailsModal(true);
  };

  const handleEditClusterDetails = (record: ClusterUI) => {
    setSelectedCluster(record);
    setDisplayEditClusterModal(true);
  };

  const handleViewClusterLogs = (record: ClusterUI) => {
    history.push(`/admin/clusters/logs?clusterID=${record.id}&clusterName=${encodeURIComponent(record.name)}`);
  };

  const handleTestConnection = async (record: ClusterUI) => {
    try {
      setTestingConnection(record.id);
      await clustersService.pingExisting({ clusterId: record.id });
    } catch (e) {
      handleError('Failed to establish connection with cluster');
    } finally {
      setTestingConnection(null);
    }

    try {
      const updatedCluster = await clustersService.getOne(record.id);
      setClusters((clusters: ClusterUI[]) =>
        clusters.map(cluster => (cluster.id === record.id ? updatedCluster : cluster))
      );
    } catch (err) {
      handleError('Failed to get updated cluster');
    }
  };

  const columns: ColumnsType<ClusterUI> = [
    { title: 'Name', dataIndex: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (_text, record) => {
        const text = (_text as any) || (record as any).status;
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
    { title: 'Thor host', dataIndex: 'thor_host' },
    { title: 'Thor port', dataIndex: 'thor_port' },
    { title: 'Roxie host', dataIndex: 'roxie_host' },
    { title: 'Roxie port', dataIndex: 'roxie_port' },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_text, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <EyeOutlined onClick={() => handleViewClusterDetails(record)} />
          </Tooltip>
          <Tooltip title="Edit Cluster">
            <EditOutlined onClick={() => handleEditClusterDetails(record)} />
          </Tooltip>
          <Tooltip title="View Logs">
            <FileTextOutlined onClick={() => handleViewClusterLogs(record)} />
          </Tooltip>
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
            disabled={testingConnection === record.id}>
            Test Connection
          </Button>
        </Space>
      ),
    },
  ];

  return <Table columns={columns} dataSource={clusters} size="small" rowKey={record => record.id} />;
};

export default ClustersTable;
