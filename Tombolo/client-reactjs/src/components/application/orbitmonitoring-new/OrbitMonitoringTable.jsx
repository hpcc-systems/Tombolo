// Library imports
import React from 'react';
import { Table, Space, Tooltip, Popconfirm, Popover, Tag, Button } from 'antd';
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
import orbitProfileMonitoringService from '@/services/orbitProfileMonitoring.service';
import styles from './orbitMonitoring.module.css';
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

function OrbitMonitoringTable({
  orbitMonitoringData,
  onEdit,
  onCopy,
  onDelete,
  onToggleStatus,
  loading,
  setDisplayViewDetailsModal,
  setSelectedMonitoring,
  isReader,
  selectedRows,
  setSelectedRows,
  applicationId,
  setApproveRejectModal
}) {
  //Actions
  const editOrbitMonitoring = (record) => {
    if (onEdit) {
      onEdit(record);
    }
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record) => {
    setSelectedMonitoring(record);
    if (setApproveRejectModal) {
      setApproveRejectModal(true);
    }
  };

  // When the copy/duplicate icon is clicked
  const duplicateOrbitMonitoring = (record) => {
    if (onCopy) {
      onCopy(record);
    }
  };

  // Toggle monitoring status
  const toggleMonitoringStatus = async (record, action) => {
    if (onToggleStatus) {
      onToggleStatus(record, action);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (onDelete) {
      onDelete(id);
    }
  };

  // Filter and get particular orbit monitoring from list
  // When component loads and if there is selected monitoring pass data to form instance
  const viewDetails = (monitoringId) => {
    setDisplayViewDetailsModal(true);
    const selectedMonitoring = orbitMonitoringData.find((monitoring) => monitoring.id === monitoringId);
    setSelectedMonitoring(selectedMonitoring);
  };

  //Columns
  const columns = [
    { 
      title: 'Name', 
      dataIndex: 'name',
      render: (name) => name || 'N/A'
    },
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
      title: 'Build Name',
      dataIndex: 'metaData',
      render: (_, record) => record.metaData?.asrSpecificMetaData?.buildName || 'N/A',
    },
    { title: 'Active', dataIndex: 'isActive', render: (isActive) => (isActive ? 'Yes' : 'No') },
    { title: 'Approval Status', dataIndex: 'approvalStatus', render: (status) => startCase(status) },
    {
      title: 'Created by',
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
                  onClick={() => editOrbitMonitoring(record)}
                />
              </Tooltip>

              <Popover
                placement="bottom"
                content={
                  <div
                    style={{ display: 'flex', flexDirection: 'column', color: 'var(--primary)', cursor: 'pointer' }}
                    className={styles.orbitMonitoringTable__hidden_actions}>
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
                      to={`/${applicationId}/dashboard/notifications?monitoringId=${record.id}&monitoringType=orbitMonitoring`}>
                      <BellOutlined style={{ marginRight: 15 }} />
                      Notifications
                    </Link>
                    <div style={{ color: 'var(--primary)' }} onClick={() => duplicateOrbitMonitoring(record)}>
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
        </Space>
      ),
    },
  ];

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={orbitMonitoringData}
      loading={loading}
      className={styles.orbit_monitoring_table}
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
          className += styles.orbitMonitoringTable__selected_row;
        }
        return className;
      }}
    />
  );
}

export default OrbitMonitoringTable;