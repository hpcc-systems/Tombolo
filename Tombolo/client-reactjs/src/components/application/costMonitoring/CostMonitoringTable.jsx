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

import { handleDeleteCostMonitoring, toggleCostMonitoringStatus } from './costMonitoringUtils';

//Approve button color
const approveButtonColor = (approvalStatus) => {
  if (approvalStatus === 'Pending') {
    return 'var(--primary)';
  } else if (approvalStatus === 'Approved') {
    return 'var(--success)';
  } else {
    return 'var(--danger)';
  }
};

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
  filteringCosts,
  isReader,
  clusters,
  searchTerm,
}) => {
  // States
  const [unreachableClusters, setUnreachableClusters] = useState([]);

  //Redux
  const {
    applicationReducer: {
      application: { applicationId },
    },
  } = useSelector((state) => state);

  // Cluster that is not able to establish connection
  useEffect(() => {
    if (clusters.length > 0) {
      const ids = clusters.filter((c) => c.reachabilityInfo && c.reachabilityInfo.reachable === false).map((c) => c.id);
      setUnreachableClusters(ids);
    }
  }, [clusters]);

  // Helper function to get cluster names from cluster IDs
  const getClusterNames = (clusterIds) => {
    if (!clusterIds || clusterIds.length === 0) return 'N/A';

    const clusterNames = clusterIds.map((clusterId) => {
      const cluster = clusters.find((c) => c.id === clusterId);
      return cluster ? cluster.name : clusterId;
    });

    return clusterNames.join(', ');
  };

  // Helper function to get users from metadata
  const getUsers = (metaData) => {
    if (!metaData || !metaData.users) return 'N/A';
    return Array.isArray(metaData.users) ? metaData.users.join(', ') : metaData.users;
  };

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
      title: 'Clusters',
      dataIndex: 'clusterIds',
      key: 'clusterIds',
      render: (clusterIds) => {
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
      render: (metaData) => {
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
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (createdBy) => {
        const { name, email, id } = createdBy;
        return (
          <Tooltip
            title={
              <>
                <div>ID : {id}</div>
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
                      className="costMonitoringTable__hidden_actions">
                      <div title="Approve" onClick={() => evaluateMonitoring(record)}>
                        <CheckCircleFilled
                          style={{ color: approveButtonColor(record.approvalStatus), marginRight: 15 }}
                        />{' '}
                        Approve / Reject
                      </div>

                      {record.isActive ? (
                        <div onClick={() => toggleMonitoringStatus(record, false)}>
                          <PauseCircleOutlined
                            disabled={record.approvalStatus !== 'Approved'}
                            style={{ color: 'var(--primary)', marginRight: 15 }}
                          />
                          Pause
                        </div>
                      ) : (
                        <div onClick={() => toggleMonitoringStatus(record, true)}>
                          <PlayCircleOutlined
                            disabled={record.approvalStatus !== 'Approved'}
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
                        onConfirm={() =>
                          handleDeleteCostMonitoring({ id: record.id, costMonitorings, setCostMonitorings })
                        }
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

  // When eye icon is clicked, display the monitoring details modal
  const viewMonitoringDetails = (record) => {
    setSelectedMonitoring(record);
    setDisplayMonitoringDetailsModal(true);
  };

  // When edit icon is clicked, display the add cost monitoring modal and set the selected monitoring
  const editCostMonitoring = (record) => {
    setEditingData({ isEditing: true, selectedMonitoring: record.id });
    setSelectedMonitoring(record);
    setDisplayAddCostMonitoringModal(true);
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
    setDisplayAddCostMonitoringModal(true);
  };

  // Start or pause monitoring
  const toggleMonitoringStatus = async (record, status) => {
    try {
      if (record.approvalStatus !== 'Approved') {
        message.error('Monitoring must be in approved state before it can be started');
        return;
      }

      const updatedData = await toggleCostMonitoringStatus([record.id], status);
      const updatedMonitoringIds = updatedData.map((monitoring) => monitoring.id);

      setCostMonitorings((prev) =>
        prev.map((monitoring) =>
          updatedMonitoringIds.includes(monitoring.id)
            ? updatedData.find((updated) => updated.id === monitoring.id)
            : monitoring
        )
      );
    } catch (err) {
      message.error('Failed to toggle monitoring status');
    }
  };

  return (
    <Table
      dataSource={costMonitorings}
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
        let className = record?.isActive
          ? 'costMonitoringTable__active-monitoring'
          : 'costMonitoringTable__inactive-monitoring';
        const idsOfSelectedRows = selectedRows.map((row) => row.id);
        if (idsOfSelectedRows.includes(record.id)) {
          className += ' costMonitoringTable__selected-row';
        }
        return className;
      }}
    />
  );
};

export default CostMonitoringTable;
