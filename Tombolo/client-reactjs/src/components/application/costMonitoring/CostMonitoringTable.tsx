import React, { useState, useEffect } from 'react';
import { Table, Tooltip, Popconfirm, Popover, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import startCase from 'lodash/startCase';
import { handleError } from '@/components/common/handleResponse';
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

import costMonitoringService from '@/services/costMonitoring.service';
import { handleSuccess } from '@/components/common/handleResponse';

import styles from './costMonitoring.module.css';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import type { CostMonitoringDTO } from '@tombolo/shared';

//Approve button color
const approveButtonColor = (approvalStatus: string): string => {
  if (approvalStatus === APPROVAL_STATUS.PENDING) {
    return 'var(--primary)';
  } else if (approvalStatus === APPROVAL_STATUS.APPROVED) {
    return 'var(--success)';
  } else {
    return 'var(--danger)';
  }
};

interface Domain {
  value: string;
  label: string;
}

interface ProductCategory {
  id: string;
  name: string;
  value?: string;
  label?: string;
  shortCode?: string;
}

interface Cluster {
  id: string;
  name: string;
  currencyCode?: string;
  reachabilityInfo?: { reachable: boolean };
}

interface EditingData {
  isEditing: boolean;
  selectedMonitoring?: string;
}

interface DuplicatingData {
  isDuplicating: boolean;
  selectedMonitoring?: CostMonitoringDTO;
}

interface CostMonitoringTableProps {
  setEditingData: (data: EditingData) => void;
  setDuplicatingData: (data: DuplicatingData) => void;
  costMonitorings: CostMonitoringDTO[];
  setCostMonitorings: React.Dispatch<React.SetStateAction<CostMonitoringDTO[]>>;
  setSelectedMonitoring: (monitoring: CostMonitoringDTO | null) => void;
  setDisplayAddCostMonitoringModal: (display: boolean) => void;
  setDisplayMonitoringDetailsModal: (display: boolean) => void;
  setDisplayAddRejectModal: (display: boolean) => void;
  setSelectedRows: (rows: CostMonitoringDTO[]) => void;
  selectedRows: CostMonitoringDTO[];
  domains: Domain[];
  allProductCategories: ProductCategory[];
  filteringCosts: boolean;
  isReader: boolean;
  clusters: Cluster[];
  searchTerm: string;
}

const CostMonitoringTable = ({
  setEditingData,
  setDuplicatingData,
  costMonitorings,
  setCostMonitorings,
  setSelectedMonitoring,
  setDisplayAddCostMonitoringModal,
  setDisplayMonitoringDetailsModal,
  setDisplayAddRejectModal,
  setSelectedRows,
  selectedRows,
  domains,
  allProductCategories,
  filteringCosts,
  isReader,
  clusters,
  searchTerm,
}: CostMonitoringTableProps) => {
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

  // Helper function to get cluster names from cluster IDs
  const getClusterNames = (clusterIds: string[] | null | undefined): string => {
    if (!clusterIds || clusterIds.length === 0) return 'N/A';

    const clusterNames = clusterIds.map(clusterId => {
      const cluster = clusters.find(c => c.id === clusterId);
      return cluster ? cluster.name : clusterId;
    });

    return clusterNames.join(', ');
  };

  // Helper function to get users from metadata
  const getUsers = (metaData: any): string => {
    if (!metaData || !metaData.users) return 'N/A';
    return Array.isArray(metaData.users) ? metaData.users.join(', ') : metaData.users;
  };

  // Columns for the table
  const columns: ColumnsType<CostMonitoringDTO> = [
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
          <span>{text && text.length > 100 ? `${text.slice(0, 100)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Clusters',
      dataIndex: 'clusterIds',
      key: 'clusterIds',
      render: (clusterIds: string[]) => {
        const clusterNames = getClusterNames(clusterIds);
        return (
          <Tooltip title={clusterNames}>
            <span>{clusterNames.length > 50 ? `${clusterNames.slice(0, 50)}...` : clusterNames}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Users',
      dataIndex: 'metaData',
      key: 'users',
      render: (metaData: any) => {
        const users = getUsers(metaData);
        return (
          <Tooltip title={users}>
            <span>{users.length > 50 ? `${users.slice(0, 50)}...` : users}</span>
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
      render: (_: any, record: CostMonitoringDTO) => (record.isActive ? 'Yes' : 'No'),
    },
    {
      title: 'Approval Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (approvalStatus: string) => startCase(approvalStatus) || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CostMonitoringDTO) =>
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
                      className={styles.costMonitoringTable__hidden_actions}>
                      <div title="Approve" onClick={() => evaluateMonitoring(record)}>
                        <CheckCircleFilled
                          style={{ color: approveButtonColor(record.approvalStatus), marginRight: 15 }}
                        />{' '}
                        Approve / Reject
                      </div>

                      {record.isActive ? (
                        <div onClick={() => toggleMonitoringStatus(record, 'pause')}>
                          <PauseCircleOutlined style={{ color: 'var(--primary)', marginRight: 15 }} />
                          Pause
                        </div>
                      ) : (
                        <div onClick={() => toggleMonitoringStatus(record, 'start')}>
                          <PlayCircleOutlined style={{ color: 'var(--primary)', marginRight: 15 }} />
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
                        onConfirm={async () => {
                          try {
                            await costMonitoringService.delete({ id: record.id });
                            const filteredCostMonitorings = costMonitorings.filter(item => item.id !== record.id);
                            setCostMonitorings(filteredCostMonitorings);
                            handleSuccess('Cost monitoring deleted successfully');
                          } catch (err: any) {
                            handleError(err?.message || 'Failed to delete cost monitoring');
                          }
                        }}
                        okText="Continue"
                        okButtonProps={{ danger: true }}
                        cancelText="Close"
                        cancelButtonProps={{ type: 'primary', ghost: true }}
                        style={{ width: '500px !important' }}>
                        <DeleteOutlined style={{ marginRight: 15 }} />
                        Delete
                      </Popconfirm>
                      <Link
                        to={`/${applicationId}/dashboard/notifications?monitoringId=${record.id}&monitoringType=costMonitoring`}>
                        <BellOutlined style={{ marginRight: 15 }} />
                        Notifications
                      </Link>
                      <div style={{ color: 'var(--primary)' }} onClick={() => duplicateCostMonitoring(record)}>
                        <CopyOutlined style={{ marginRight: 15 }} />
                        Duplicate
                      </div>
                    </div>
                  }>
                  <span style={{ color: 'var(--secondary)' }}>
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
      render: (_: any, record: CostMonitoringDTO) => {
        // Check if any of the clusters in clusterIds are unreachable
        const hasUnreachableCluster = record.clusterIds?.some(clusterId => unreachableClusters.includes(clusterId));

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
      render: (_: any, record: CostMonitoringDTO) => {
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
      render: (_: any, record: CostMonitoringDTO) => {
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
          <span>{text && text.length > 100 ? `${text.slice(0, 100)}...` : text}</span>
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
  const viewMonitoringDetails = (record: CostMonitoringDTO) => {
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
  const editCostMonitoring = (record: CostMonitoringDTO) => {
    setEditingData({ isEditing: true, selectedMonitoring: record.id });
    setSelectedMonitoring(record);
    setDisplayAddCostMonitoringModal(true);
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record: CostMonitoringDTO) => {
    setSelectedMonitoring(record);
    setDisplayAddRejectModal(true);
  };

  // When the copy/duplicate icon is clicked
  const duplicateCostMonitoring = (record: CostMonitoringDTO) => {
    setDuplicatingData({ isDuplicating: true, selectedMonitoring: record });
    setSelectedMonitoring(record);
    setDisplayAddCostMonitoringModal(true);
  };

  /**
   * Toggles the status (start/pause) of a cost monitoring
   * @param record - The cost monitoring record to toggle
   * @param status - The desired status ('start' or 'pause')
   */
  const toggleMonitoringStatus = async (record: CostMonitoringDTO, status: 'start' | 'pause') => {
    try {
      // Only approved monitorings can be toggled
      if (record.approvalStatus !== APPROVAL_STATUS.APPROVED) {
        handleError('Monitoring must be in approved state before it can be started');
        return;
      }

      const response = await costMonitoringService.toggle({ ids: [record.id], action: status as any });
      const updatedData = response.updatedCostMonitorings;
      const updatedMonitoringIds = updatedData.map((monitoring: CostMonitoringDTO) => monitoring.id);

      setCostMonitorings(prev =>
        prev.map(monitoring =>
          updatedMonitoringIds.includes(monitoring.id)
            ? updatedData.find((updated: CostMonitoringDTO) => updated.id === monitoring.id)
            : monitoring
        )
      );
    } catch {
      handleError('Failed to toggle monitoring status');
    }
  };

  return (
    <Table
      dataSource={costMonitorings}
      loading={filteringCosts}
      columns={columns}
      rowKey="id"
      size="small"
      rowSelection={{
        type: 'checkbox',
        onChange: (_selectedRowKeys: React.Key[], selectedRowsData: CostMonitoringDTO[]) => {
          setSelectedRows(selectedRowsData);
        },
      }}
      pagination={{ pageSize: 20 }}
      rowClassName={record => {
        let className = record?.isActive
          ? styles.costMonitoringTable__active_monitoring
          : styles.costMonitoringTable__inactive_monitoring;
        const idsOfSelectedRows = selectedRows.map(row => row.id);
        if (idsOfSelectedRows.includes(record.id)) {
          className += ' ' + styles.costMonitoringTable__selected_row;
        }
        return className;
      }}
    />
  );
};

export default CostMonitoringTable;
