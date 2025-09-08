import React, { useState, useEffect } from 'react';
import { Table, Tooltip, Popconfirm, message, Popover, Tag } from 'antd';
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

import { handleDeleteFileMonitoring, toggleFileMonitoringStatus } from './fileMonitoringUtils';

import styles from './fileMonitoring.module.css';
import commonStyles from '../../common/common.module.css';

//Approve button color
const approveButtonColor = (approvalStatus) => {
  if (approvalStatus === 'pending') {
    return 'var(--primary)';
  } else if (approvalStatus === 'approved') {
    return 'var(--success)';
  } else {
    return 'var(--danger)';
  }
};

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
}) => {
  // States
  const [unreachableClusters, setUnreachableClusters] = useState([]);

  //Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const integrations = useSelector((state) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  // Cluster that is not able to establish connection
  useEffect(() => {
    if (clusters.length > 0) {
      const ids = clusters.filter((c) => c.reachabilityInfo && c.reachabilityInfo.reachable === false).map((c) => c.id);
      setUnreachableClusters(ids);
    }
  }, [clusters]);

  // Columns for the table
  const columns = [
    {
      title: 'Monitoring Name',
      dataIndex: 'monitoringName',
      key: 'monitoringName',
      render: (text) => {
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
      render: (text) => (
        <Tooltip title={text}>
          <span>{text.length > 100 ? `${text.slice(0, 100)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Cluster',
      dataIndex: 'cluster',
      key: 'clusterIds',
      render: (cluster) => {
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
      render: (creator) => {
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
      render: (_, record) => (record.isActive ? 'Yes' : 'No'),
    },
    {
      title: 'Approval Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
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
                            disabled={record.approvalStatus !== 'approved'}
                            style={{ color: 'var(--primary)', marginRight: 15 }}
                          />
                          Pause
                        </div>
                      ) : (
                        <div onClick={() => toggleMonitoringStatus(record, 'start')}>
                          <PlayCircleOutlined
                            disabled={record.approvalStatus !== 'approved'}
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
      key: (_, record) => record.id,
      width: 80,
      render: (_, record) => {
        // Check if any of the clusters in clusterIds are unreachable
        const hasUnreachableCluster = record.clusterIds?.some((clusterId) => unreachableClusters.includes(clusterId));

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
      render: (record) => {
        const domain = record?.metaData?.asrSpecificMetaData?.domain || '';
        const domainName = domains.filter((d) => d.value === domain)[0]?.label;
        if (domainName) {
          return domainName;
        } else {
          return domain;
        }
      },
    });
    columns.splice(5, 0, {
      title: 'Product',
      render: (record) => {
        const productId = record?.metaData?.asrSpecificMetaData?.productCategory || '';
        let productName = allProductCategories.filter((d) => d.id === productId)[0]?.name;
        const productShortCode = allProductCategories.filter((d) => d.id === productId)[0]?.shortCode;
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
      render: (text) => (
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
  const viewMonitoringDetails = (record) => {
    try {
      // Ensure record is a valid object
      if (!record || typeof record !== 'object') {
        message.error('Invalid monitoring data');
        return;
      }

      setSelectedMonitoring(record);
      setDisplayMonitoringDetailsModal(true);
    } catch (error) {
      console.error('Error in viewMonitoringDetails:', error);
      message.error('Failed to view monitoring details');
    }
    // setSelectedMonitoring(record);
    // setDisplayMonitoringDetailsModal(true);
  };

  // When edit icon is clicked, display the add cost monitoring modal and set the selected monitoring
  const editCostMonitoring = (record) => {
    setEditingData({ isEditing: true, selectedMonitoring: record.id });
    setSelectedMonitoring(record);
    setDisplayAddFileMonitoringModal(true);
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record) => {
    setSelectedMonitoring(record);
    setDisplayAddRejectModal(true);
  };

  // When the copy/duplicate icon is clicked
  const duplicateCostMonitoring = (record) => {
    setDuplicatingData({ isDuplicating: true, selectedMonitoring: record });
    setSelectedMonitoring(record);
    setDisplayAddFileMonitoringModal(true);
  };

  // Delete file monitoring
  const deleteFileMonitoring = async (id) => {
    try {
      await handleDeleteFileMonitoring([id]);
      setFileMonitoring((prev) => prev.filter((monitoring) => monitoring.id !== id));
      message.success('File monitoring deleted successfully');
    } catch (err) {
      message.error('Failed to delete file monitoring');
    }
  };

  // Pause or start monitoring
  const toggleMonitoringStatus = async (record, status) => {
    try {
      const lowercaseStatus = record.approvalStatus.toLowerCase();
      if (lowercaseStatus !== 'approved') {
        message.error('Monitoring must be in approved state before it can be started');
        return;
      }

      const activate = status === 'start' ? true : false;

      const updatedData = await toggleFileMonitoringStatus([record.id], activate);

      const updatedMonitoringIds = updatedData.map((monitoring) => monitoring.id);

      setFileMonitoring((prev) =>
        prev.map((monitoring) =>
          updatedMonitoringIds.includes(monitoring.id)
            ? updatedData.find((updated) => updated.id === monitoring.id)
            : monitoring
        )
      );
      message.success(`Monitoring ${status === 'start' ? 'started' : 'paused'} successfully`);
    } catch (err) {
      message.error('Failed to toggle monitoring status');
    }
  };

  return (
    <Table
      dataSource={fileMonitoring}
      loading={filteringCosts}
      columns={columns}
      rowKey="id"
      rowSelectedBgColor="var(--danger)"
      size="small"
      rowSelection={{
        type: 'checkbox',
        onChange: (_selectedRowKeys, selectedRowsData) => {
          setSelectedRows(selectedRowsData);
        },
      }}
      pagination={{ pageSize: 20 }}
      rowClassName={(record) => {
        let className = record?.isActive ? commonStyles.table_active_row : commonStyles.table_inactive_row;

        const idsOfSelectedRows = selectedRows.map((row) => row.id);
        if (idsOfSelectedRows.includes(record.id)) {
          className += styles.clusterMonitoringTable__selected_row;
        }
        return className;
      }}
    />
  );
};

export default FileMonitoringTable;
