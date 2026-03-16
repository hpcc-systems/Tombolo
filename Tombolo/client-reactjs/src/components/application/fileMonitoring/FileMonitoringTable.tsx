// Imports from libraries
import React, { useState, useEffect } from 'react';
import { Table, Tooltip, Popconfirm, Popover, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  BellOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  DownOutlined,
  WarningFilled,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Local imports
import { handleError, handleSuccess } from '@/components/common/handleResponse';
import fileMonitoringService from '@/services/fileMonitoring.service';
import styles from './fileMonitoring.module.css';
import commonStyles from '../../common/common.module.css';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import type { FileMonitoringDTO } from '@tombolo/shared';

//Approve button color
const approveButtonColor = (approvalStatus: string) => {
  if (approvalStatus === APPROVAL_STATUS.PENDING) {
    return 'var(--primary)';
  } else if (approvalStatus === APPROVAL_STATUS.APPROVED) {
    return 'var(--success)';
  } else {
    return 'var(--danger)';
  }
};

interface Cluster {
  id: string;
  name: string;
  thor_host?: string;
  thor_port?: string;
  reachabilityInfo?: {
    reachable: boolean;
  };
  [key: string]: any;
}

interface EditingData {
  isEditing: boolean;
  selectedMonitoring: string;
}

interface DuplicatingData {
  isDuplicating: boolean;
  selectedMonitoring: FileMonitoringDTO;
}

interface Domain {
  value: string;
  label: string;
}

interface ProductCategory {
  id: string;
  name: string;
  shortCode: string;
}

interface FileMonitoringTableProps {
  fileMonitoring: FileMonitoringDTO[];
  setFileMonitoring: React.Dispatch<React.SetStateAction<FileMonitoringDTO[]>>;
  setDisplayMonitoringDetailsModal: (display: boolean) => void;
  setSelectedMonitoring: (monitoring: FileMonitoringDTO | null) => void;
  setDisplayAddFileMonitoringModal: (display: boolean) => void;
  setEditingData: (data: EditingData) => void;
  setDuplicatingData: (data: DuplicatingData) => void;
  setDisplayAddRejectModal: (display: boolean) => void;
  setSelectedRows: (rows: FileMonitoringDTO[]) => void;
  selectedRows: FileMonitoringDTO[];
  domains: Domain[];
  allProductCategories: ProductCategory[];
  filteringCosts?: boolean;
  isReader: boolean;
  clusters: Cluster[];
  searchTerm: string;
}

const FileMonitoringTable = ({
  fileMonitoring,
  setFileMonitoring,
  setDisplayMonitoringDetailsModal,
  setSelectedMonitoring,
  setDisplayAddFileMonitoringModal,
  setEditingData,
  setDuplicatingData,
  setDisplayAddRejectModal,
  setSelectedRows,
  selectedRows,
  domains,
  allProductCategories,
  filteringCosts,
  isReader,
  clusters,
  searchTerm,
}: FileMonitoringTableProps) => {
  // States
  const [unreachableClusters, setUnreachableClusters] = useState<string[]>([]);

  //Redux
  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration: any) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  // Cluster that is not able to establish connection
  useEffect(() => {
    if (clusters.length > 0) {
      const ids = clusters.filter(c => c.reachabilityInfo && c.reachabilityInfo.reachable === false).map(c => c.id);
      setUnreachableClusters(ids);
    }
  }, [clusters]);

  // Columns for the table
  const columns: ColumnsType<FileMonitoringDTO> = [
    {
      title: 'Monitoring Name',
      dataIndex: 'monitoringName',
      key: 'monitoringName',
      render: (text: string) => {
        return (
          <span
            style={{
              background:
                searchTerm.length > 0 && text.toLowerCase().includes(searchTerm.toLowerCase())
                  ? 'var(--highlight)'
                  : 'transparent',
            }}>
            {text}
          </span>
        );
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text.length > 100 ? `${text.slice(0, 100)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Cluster',
      dataIndex: 'cluster',
      key: 'clusterIds',
      render: (cluster: Cluster) => {
        return (
          <Tooltip title={`${cluster?.thor_host}:${cluster?.thor_port}`}>
            <span style={{ color: 'var(--primary)' }}>{cluster?.name}</span>
          </Tooltip>
        );
      },
    },

    {
      title: 'Created By',
      dataIndex: 'creator',
      key: 'creator',
      render: (creator: any) => {
        const { firstName, lastName, email } = creator;
        const name = `${firstName} ${lastName}`;
        return (
          <Tooltip
            title={
              <>
                <div>E-mail: {email}</div>
              </>
            }>
            <span style={{ color: 'var(--primary)' }}>{name}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (_: any, record: FileMonitoringDTO) => (record.isActive ? 'Yes' : 'No'),
    },
    {
      title: 'Approval Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: FileMonitoringDTO) =>
        selectedRows.length > 1 ? null : (
          <>
            <Tooltip title="View Details">
              <EyeOutlined
                style={{ color: 'var(--primary)', marginRight: 15 }}
                onClick={() => viewMonitoringDetails(record)}
              />
            </Tooltip>
            {!isReader ? (
              <>
                <Tooltip title="Edit">
                  <EditOutlined
                    style={{ color: 'var(--primary)', marginRight: 15 }}
                    onClick={() => editCostMonitoring(record)}
                  />
                </Tooltip>

                <Popover
                  placement="bottom"
                  content={
                    <div
                      style={{ display: 'flex', flexDirection: 'column', color: 'var(--primary)', cursor: 'pointer' }}
                      className={styles.monitoringTable__hidden_actions}>
                      <div title="Approve" onClick={() => evaluateMonitoring(record)}>
                        <CheckCircleFilled
                          style={{ color: approveButtonColor(record.approvalStatus), marginRight: 15 }}
                        />{' '}
                        Approve / Reject
                      </div>

                      {record.isActive ? (
                        <div onClick={() => toggleMonitoringStatus(record, 'pause')}>
                          <PauseCircleOutlined
                            disabled={record.approvalStatus !== APPROVAL_STATUS.APPROVED}
                            style={{ color: 'var(--primary)', marginRight: 15 }}
                          />
                          Pause
                        </div>
                      ) : (
                        <div onClick={() => toggleMonitoringStatus(record, 'start')}>
                          <PlayCircleOutlined
                            disabled={record.approvalStatus !== APPROVAL_STATUS.APPROVED}
                            style={{ color: 'var(--primary)', marginRight: 15 }}
                          />
                          Start
                        </div>
                      )}

                      <Popconfirm
                        title={
                          <>
                            <div style={{ fontWeight: 'bold' }}>{`Delete ${record.monitoringName}`} </div>
                            <div style={{ maxWidth: 400 }}>
                              This action will delete all related data including notifications generated by this
                              monitoring. If you would like to keep the data, you can deactivate the monitoring instead.
                            </div>
                          </>
                        }
                        onConfirm={() => deleteFileMonitoring(record.id)}
                        okText="Continue"
                        okButtonProps={{ danger: true }}
                        cancelText="Close"
                        cancelButtonProps={{ type: 'primary', ghost: true }}
                        style={{ width: '500px !important' }}>
                        <DeleteOutlined style={{ marginRight: 15 }} />
                        Delete
                      </Popconfirm>
                      <Link
                        to={`/${applicationId}/dashboard/notifications?monitoringId=${record.id}&monitoringType=fileMonitoring`}>
                        <BellOutlined style={{ marginRight: 15 }} />
                        Notifications
                      </Link>
                      <div style={{ color: 'var(--primary)' }} onClick={() => duplicateCostMonitoring(record)}>
                        <CopyOutlined style={{ marginRight: 15 }} />
                        Duplicate
                      </div>
                    </div>
                  }>
                  <span style={{ color: 'var(--secondary)' }} className={styles.monitoringTable__hidden_actions}>
                    More <DownOutlined style={{ fontSize: '10px' }} />
                  </span>
                </Popover>
              </>
            ) : null}
          </>
        ),
    },
    {
      key: 'warning',
      width: 80,
      render: (_: any, record: FileMonitoringDTO) => {
        // Check if the cluster is unreachable
        const hasUnreachableCluster = record.clusterId ? unreachableClusters.includes(record.clusterId) : false;

        return hasUnreachableCluster ? (
          <Tag color="black">
            <WarningFilled style={{ color: 'yellow', fontSize: '0.8rem', marginRight: '5px' }} />
            Cluster not reachable
          </Tag>
        ) : null;
      },
    },
  ];

  // If ASR integration on add couple asr specific columns
  if (asrIntegration) {
    columns.splice(4, 0, {
      title: 'Domain',
      render: (record: FileMonitoringDTO) => {
        const domain = record?.metaData?.asrSpecificMetaData?.domain || '';
        const domainName = domains.filter(d => d.value === domain)[0]?.label;
        if (domainName) {
          return domainName;
        } else {
          return domain;
        }
      },
    });
    columns.splice(5, 0, {
      title: 'Product',
      render: (record: FileMonitoringDTO) => {
        const productId = record?.metaData?.asrSpecificMetaData?.productCategory || '';
        let productName = allProductCategories.filter(d => d.id === productId)[0]?.name;
        const productShortCode = allProductCategories.filter(d => d.id === productId)[0]?.shortCode;
        if (productName) {
          // Truncate product name to 25 chars if it is too long
          if (productName.length > 20) {
            productName = `${productName.substring(0, 20)} ...`;
          }

          return <Tooltip title={productName}>{`${productName} ( ${productShortCode} )`}</Tooltip>;
        } else {
          return productId;
        }
      },
    });
  }

  // If no ASR integration
  if (!asrIntegration) {
    columns.splice(4, 0, {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text.length > 100 ? `${text.slice(0, 100)}...` : text}</span>
        </Tooltip>
      ),
    });

    columns.splice(5, 0, {
      title: 'Monitoring Scope',
      dataIndex: 'monitoringScope',
      key: 'monitoringScope',
    });
  }

  // When eye icon is clicked, display the monitoring details modal
  const viewMonitoringDetails = (record: FileMonitoringDTO) => {
    try {
      // Ensure record is a valid object
      if (!record || typeof record !== 'object') {
        handleError('Invalid monitoring data');
        return;
      }

      setSelectedMonitoring(record);
      setDisplayMonitoringDetailsModal(true);
    } catch (error) {
      console.error('Error in viewMonitoringDetails:', error);
      handleError('Failed to view monitoring details');
    }
  };

  // When edit icon is clicked, display the add cost monitoring modal and set the selected monitoring
  const editCostMonitoring = (record: FileMonitoringDTO) => {
    setEditingData({ isEditing: true, selectedMonitoring: record.id });
    setSelectedMonitoring(record);
    setDisplayAddFileMonitoringModal(true);
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record: FileMonitoringDTO) => {
    setSelectedMonitoring(record);
    setDisplayAddRejectModal(true);
  };

  // When the copy/duplicate icon is clicked
  const duplicateCostMonitoring = (record: FileMonitoringDTO) => {
    setDuplicatingData({ isDuplicating: true, selectedMonitoring: record });
    setSelectedMonitoring(record);
    setDisplayAddFileMonitoringModal(true);
  };

  // Delete file monitoring
  const deleteFileMonitoring = async (id: string) => {
    try {
      await fileMonitoringService.delete([id]);
      setFileMonitoring(prev => prev.filter(monitoring => monitoring.id !== id));
      handleSuccess('File monitoring deleted successfully');
    } catch {
      handleError('Failed to delete file monitoring');
    }
  };

  // Pause or start monitoring
  const toggleMonitoringStatus = async (record: FileMonitoringDTO, status: 'start' | 'pause') => {
    try {
      const lowercaseStatus = record.approvalStatus.toLowerCase();
      if (lowercaseStatus !== APPROVAL_STATUS.APPROVED) {
        handleError('Monitoring must be in approved state before it can be started');
        return;
      }

      const updatedData = await fileMonitoringService.toggle({ ids: [record.id], action: status as any });
      const updatedMonitoringIds = updatedData.map((monitoring: FileMonitoringDTO) => monitoring.id);

      setFileMonitoring(prev =>
        prev.map(monitoring =>
          updatedMonitoringIds.includes(monitoring.id)
            ? updatedData.find((updated: FileMonitoringDTO) => updated.id === monitoring.id)!
            : monitoring
        )
      );
      handleSuccess(`Monitoring ${status === 'start' ? 'started' : 'paused'} successfully`);
    } catch {
      handleError('Failed to toggle monitoring status');
    }
  };

  return (
    <Table
      dataSource={fileMonitoring}
      loading={filteringCosts}
      columns={columns}
      rowKey="id"
      size="small"
      rowSelection={{
        type: 'checkbox',
        onChange: (_selectedRowKeys: any, selectedRowsData: FileMonitoringDTO[]) => {
          setSelectedRows(selectedRowsData);
        },
      }}
      pagination={{ pageSize: 20 }}
      rowClassName={(record: FileMonitoringDTO) => {
        let className = record?.isActive ? commonStyles.table_active_row : commonStyles.table_inactive_row;

        const idsOfSelectedRows = selectedRows.map(row => row.id);
        if (idsOfSelectedRows.includes(record.id)) {
          className += styles.clusterMonitoringTable__selected_row;
        }
        return className;
      }}
    />
  );
};

export default FileMonitoringTable;
