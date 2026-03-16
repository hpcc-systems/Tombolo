import React, { useEffect, useState } from 'react';
import { Table, Tooltip, Popconfirm, Popover, Tag } from 'antd';
import { handleError, handleSuccess } from '@/components/common/handleResponse';
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
  DashboardOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import jobMonitoringService from '@/services/jobMonitoring.service';

import styles from './jobMonitoring.module.css';
import commonStyles from '../../common/common.module.css';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import { ColumnsType } from 'antd/es/table';
import { JobMonitoringDTO } from '@tombolo/shared';
import type { DomainOption, ProductCategoryOption, ProductCategory } from './types';

interface Props {
  setEditingData: (v: any) => void;
  setDuplicatingData: (v: any) => void;
  jobMonitorings: JobMonitoringDTO[];
  setJobMonitorings: (v: JobMonitoringDTO[] | ((p: JobMonitoringDTO[]) => JobMonitoringDTO[])) => void;
  setSelectedMonitoring: (v: any) => void;
  setDisplayAddJobMonitoringModal: (v: boolean) => void;
  setDisplayMonitoringDetailsModal: (v: boolean) => void;
  setDisplayAddRejectModal: (v: boolean) => void;
  setSelectedRows: (v: any[]) => void;
  selectedRows: any[];
  domains: DomainOption[];
  productCategories: ProductCategoryOption[];
  allProductCategories: ProductCategory[];
  filteringJobs: boolean;
  isReader: boolean;
  clusters: any[];
  searchTerm: string;
  applicationId?: string;
}

// Approve button color
const approveButtonColor = (approvalStatus?: string) => {
  if (approvalStatus === APPROVAL_STATUS.PENDING) {
    return 'var(--primary)';
  } else if (approvalStatus === APPROVAL_STATUS.APPROVED) {
    return 'var(--success)';
  } else {
    return 'var(--danger)';
  }
};

const JobMonitoringTable: React.FC<Props> = ({
  setEditingData,
  setDuplicatingData,
  jobMonitorings,
  setJobMonitorings,
  setSelectedMonitoring,
  setDisplayAddJobMonitoringModal,
  setDisplayMonitoringDetailsModal,
  setDisplayAddRejectModal,
  setSelectedRows,
  selectedRows,
  domains,
  productCategories,
  allProductCategories,
  filteringJobs,
  isReader,
  clusters,
  searchTerm,
}) => {
  const [unreachableClusters, setUnreachableClusters] = useState<Array<string | number>>([]);

  // Redux
  const applicationId = useSelector((state: any) => state.application.application.applicationId);
  const integrations = useSelector((state: any) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration: any) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  useEffect(() => {
    if (clusters && clusters.length > 0) {
      const ids = clusters
        .filter((c: any) => c.reachabilityInfo && c.reachabilityInfo.reachable === false)
        .map((c: any) => c.id);
      setUnreachableClusters(ids);
    }
  }, [clusters]);

  const columns: ColumnsType<JobMonitoringDTO> = [
    {
      title: 'Monitoring Name',
      dataIndex: 'monitoringName',
      key: 'monitoringName',
      render: (text: any) => (
        <span
          style={{
            background:
              searchTerm.length > 0 && text?.toLocaleLowerCase().includes(searchTerm)
                ? 'var(--highlight)'
                : 'transparent',
          }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Job Name/Pattern',
      dataIndex: 'jobName',
      key: 'jobName',
      render: (text: any) => (
        <span
          style={{
            background:
              searchTerm.length > 0 && text?.toLocaleLowerCase().includes(searchTerm)
                ? 'var(--highlight)'
                : 'transparent',
          }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'creator',
      key: 'createdBy',
      render: (creator: any) => {
        const { firstName, lastName, email } = creator || {};
        return (
          <Tooltip title={<div> {email}</div>}>
            <span style={{ color: 'var(--primary' }}>{`${firstName || ''} ${lastName || ''}`}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (_, record) => (record.isActive ? 'Yes' : 'No'),
    },
    {
      title: 'Approval status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
        selectedRows.length > 1 ? null : (
          <>
            <Tooltip title="View  Details">
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
                    onClick={() => editJobMonitoring(record)}
                  />
                </Tooltip>

                <Popover
                  placement="bottom"
                  content={
                    <div className={styles.jobMonitoringTable__hidden_actions}>
                      <div title="Approve" onClick={() => evaluateMonitoring(record)}>
                        <CheckCircleFilled
                          style={{ color: approveButtonColor(record.approvalStatus), marginRight: 15 }}
                        />{' '}
                        Approve / Reject
                      </div>

                      {record.isActive ? (
                        <div onClick={() => toggleMonitoringStatus(record)}>
                          <PauseCircleOutlined
                            disabled={record.approvalStatus !== APPROVAL_STATUS.APPROVED}
                            className={styles.pause_play_icon}
                          />
                          Pause
                        </div>
                      ) : (
                        <div onClick={() => toggleMonitoringStatus(record)}>
                          <PlayCircleOutlined
                            disabled={record.approvalStatus !== APPROVAL_STATUS.APPROVED}
                            className={styles.pause_play_icon}
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
                        onConfirm={async () => {
                          try {
                            await jobMonitoringService.delete({ id: record.id });
                            const filteredJobMonitorings = jobMonitorings.filter(item => item.id !== record.id);
                            setJobMonitorings(filteredJobMonitorings);
                            handleSuccess('Job monitoring deleted successfully');
                          } catch (err: any) {
                            handleError(err.message || 'Failed to delete job monitoring');
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
                        to={`/${applicationId}/dashboard/notifications?monitoringId=124&monitoringType=jobMonitoring`}>
                        <BellOutlined style={{ marginRight: 15 }} />
                        Notifications
                      </Link>
                      <div style={{ color: 'var(--primary)' }} onClick={() => duplicateJobMonitoring(record)}>
                        <CopyOutlined style={{ marginRight: 15 }} />
                        Duplicate
                      </div>
                      <div onClick={() => routeToTimeSeriesAnalysis(record)}>
                        <DashboardOutlined style={{ marginRight: 15 }} />
                        Time Series Analysis
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
      key: 'clusterStatus',
      width: 80,
      render: (_, record) =>
        unreachableClusters.includes(record.clusterId) ? (
          <Tag color="black">
            <WarningFilled style={{ color: 'yellow', fontSize: '0.8rem', marginRight: '5px' }} />
            Cluster not reachable
          </Tag>
        ) : null,
    },
  ];

  // If ASR integration on add couple asr specific columns
  if (asrIntegration) {
    columns.splice(4, 0, {
      title: 'Domain',
      render: (record: any) => {
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
      render: (record: any) => {
        const productId = record?.metaData?.asrSpecificMetaData?.productCategory || '';
        let productName = allProductCategories.filter(d => d.id === productId)[0]?.name;
        const productShortCode = allProductCategories.filter(d => d.id === productId)[0]?.shortCode;
        if (productName) {
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
      render: (text: any) => (
        <Tooltip title={text}>
          <span>{text?.length > 100 ? `${text.slice(0, 100)}...` : text}</span>
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
  const viewMonitoringDetails = (record: any) => {
    setSelectedMonitoring(record);
    setDisplayMonitoringDetailsModal(true);
  };

  // When edit icon is clicked, display the add job monitoring modal and set the selected monitoring
  const editJobMonitoring = (record: any) => {
    setEditingData({ isEditing: true, selectedMonitoring: record });

    setSelectedMonitoring(record);
    setDisplayAddJobMonitoringModal(true);
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record: any) => {
    setSelectedMonitoring(record);
    setDisplayAddRejectModal(true);
  };

  // When copy/duplicate icon is clicked
  const duplicateJobMonitoring = (record: any) => {
    setDuplicatingData({ isDuplicating: true, selectedMonitoring: record });

    setSelectedMonitoring(record);
    setDisplayAddJobMonitoringModal(true);
  };

  // Start or pause monitoring
  const toggleMonitoringStatus = async (record: JobMonitoringDTO) => {
    try {
      const approvalStatus = record?.approvalStatus?.toLowerCase();
      if (approvalStatus !== 'approved') {
        handleError('Monitoring must be in approved state before it can be started');
        return;
      }

      // service expects a boolean `action` indicating target `isActive` state
      const response: any = await jobMonitoringService.toggle({ ids: [record.id], action: !record.isActive });
      const updatedData = response.updatedJobMonitorings;
      const updatedMonitoringIds = updatedData.map((monitoring: any) => monitoring.id);

      setJobMonitorings((prev: JobMonitoringDTO[]) =>
        prev.map(monitoring =>
          updatedMonitoringIds.includes(monitoring.id)
            ? updatedData.find((updated: any) => updated.id === monitoring.id)
            : monitoring
        )
      );
    } catch (_err) {
      handleError('Failed to toggle monitoring status');
    }
  };

  // Take to time series analysis page
  const routeToTimeSeriesAnalysis = (record: any) => {
    window.open(`/${applicationId}/jobMonitoring/timeSeriesAnalysis?id=${record.id}`, '_blank');
  };

  return (
    <Table
      dataSource={jobMonitorings}
      loading={filteringJobs}
      columns={columns}
      rowKey="id"
      size="small"
      rowSelection={{
        type: 'checkbox',
        onChange: (_selectedRowKeys, selectedRowsData) => {
          setSelectedRows(selectedRowsData as any[]);
        },
      }}
      pagination={{ pageSize: 20 }}
      rowClassName={(record: any) => {
        let className = record?.isActive ? commonStyles.table_active_row : commonStyles.table_inactive_row;
        return className;
      }}
    />
  );
};

export default JobMonitoringTable;
