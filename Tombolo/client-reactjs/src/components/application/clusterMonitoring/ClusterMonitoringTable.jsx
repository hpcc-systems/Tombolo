// Library imports
import React from 'react';
import { Table, Space, Tooltip, Popconfirm, Popover, Tag } from 'antd';
import { Link } from 'react-router-dom';
import startCase from 'lodash/startCase';

// Local imports
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
} from '@ant-design/icons';

// Local imports
import { toggleSingleClusterMonitoringActiveStatus, deleteClusterMonitoring } from './clusterMonitoringUtils.js';
import styles from './clusterMonitoring.module.css';
import commonStyles from '../../common/common.module.css';
import { APPROVAL_STATUS } from '@/components/common/Constants';

//Approve button color
const approveButtonColor = (approvalStatus) => {
  if (approvalStatus === APPROVAL_STATUS.PENDING) {
    return 'var(--primary)';
  } else if (approvalStatus === APPROVAL_STATUS.APPROVED) {
    return 'var(--success)';
  } else {
    return 'var(--danger)';
  }
};

function ClusterMonitoringTable({
  clusterMonitoring,
  applicationId,
  setSelectedMonitoring,
  isReader,
  setDisplayViewDetailsModal,
  setDisplayAddEditModal,
  setEditingMonitoring,
  setApproveRejectModal,
  selectedRows,
  setSelectedRows,
  setDuplicatingData,
  setClusterMonitoring,
}) {
  //Actions
  const editClusterMonitoring = (record) => {
    setEditingMonitoring(true);
    setSelectedMonitoring(record);
    setDisplayAddEditModal(true);
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record) => {
    setSelectedMonitoring(record);
    setApproveRejectModal(true);
  };

  // When the copy/duplicate icon is clicked
  const duplicateClusterMonitoring = (record) => {
    setDuplicatingData({ isDuplicating: true, selectedMonitoring: record });
    setSelectedMonitoring(record);
    setDisplayAddEditModal(true);
  };

  // Toggle monitoring status
  const toggleMonitoringStatus = async (record, action) => {
    try {
      // If approval status is not approved, do not allow to start monitoring
      if (record.approvalStatus !== APPROVAL_STATUS.APPROVED && action === 'start') {
        handleError('Monitoring cannot be started as it is not approved.');
        return;
      }
      await toggleSingleClusterMonitoringActiveStatus(record.id);

      setClusterMonitoring((prev) =>
        prev.map((monitoring) =>
          monitoring.id === record.id ? { ...monitoring, isActive: !monitoring.isActive } : monitoring
        )
      );
      handleSuccess(`Monitoring ${record.isActive ? 'paused' : 'started'} successfully.`);
    } catch (error) {
      handleError('Failed to toggle monitoring status');
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await deleteClusterMonitoring(id);
      setClusterMonitoring((prev) => prev.filter((monitoring) => monitoring.id !== id));
      handleSuccess('Monitoring deleted successfully.');
    } catch (error) {
      handleError(error);
    }
  };

  // Filter and get  particular cluster monitoring from list
  // When component loads and if there is selected monitoring pass data to form instance
  const viewDetails = (monitoringId) => {
    setDisplayViewDetailsModal(true);
    const selectedMonitoring = clusterMonitoring.find((monitoring) => monitoring.id === monitoringId);
    setSelectedMonitoring(selectedMonitoring);
  };

  //Columns
  const columns = [
    { title: 'Name', dataIndex: 'monitoringName' },
    {
      title: 'Cluster',
      dataIndex: 'cluster_id',
      render: (_, record) => {
        return (
          <Tooltip title={`${record?.cluster?.thor_host}:${record?.cluster?.thor_port}`}>
            {record?.cluster?.name}
          </Tooltip>
        );
      },
    },
    {
      title: 'Monitoring Type',
      dataIndex: 'clusterMonitoringType',
      render: (type) => type.map((t) => <Tag key={t}>{t}</Tag>),
    },
    { title: 'Active', dataIndex: 'isActive', render: (isActive) => (isActive ? 'Yes' : 'No') },
    { title: 'Approval Status', dataIndex: 'approvalStatus', render: (status) => startCase(status) },

    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View">
            <EyeOutlined onClick={() => viewDetails(record.id)} style={{ color: 'var(--primary)' }} />
          </Tooltip>
          {!isReader ? (
            <>
              <Tooltip title="Edit">
                <EditOutlined
                  style={{ color: 'var(--primary)', marginRight: 15 }}
                  onClick={() => editClusterMonitoring(record)}
                />
              </Tooltip>

              <Popover
                placement="bottom"
                content={
                  <div
                    style={{ display: 'flex', flexDirection: 'column', color: 'var(--primary)', cursor: 'pointer' }}
                    className={styles.clusterMonitoringTable__hidden_actions}>
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
                      onConfirm={() => handleDelete(record.id)}
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
                    <div style={{ color: 'var(--primary)' }} onClick={() => duplicateClusterMonitoring(record)}>
                      <CopyOutlined style={{ marginRight: 15 }} />
                      Duplicate
                    </div>
                  </div>
                }>
                <span style={{ color: 'var(--primary)' }}>
                  More <DownOutlined style={{ fontSize: '10px' }} />
                </span>
              </Popover>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={clusterMonitoring}
      className={styles.cluster_monitoring_table}
      rowKey={(record) => record.id}
      rowSelectedBgColor="var(--danger)"
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
}

export default ClusterMonitoringTable;
