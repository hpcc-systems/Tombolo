import React from 'react';
import { Table, Tooltip, Popconfirm, Popover } from 'antd';
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
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import landingZoneMonitoringService from '@/services/landingZoneMonitoring.service.js';

import styles from './lzMonitoring.module.css';
import commonStyles from '../../common/common.module.css';
import { APPROVAL_STATUS } from '@/components/common/Constants';

//Approve button colors
const approveButtonColor = (approvalStatus) => {
  if (approvalStatus === APPROVAL_STATUS.PENDING) {
    return 'var(--primary)';
  } else if (approvalStatus === APPROVAL_STATUS.APPROVED) {
    return 'var(--success)';
  } else {
    return 'var(--danger)';
  }
};

const LandingZoneMonitoringTable = ({
  setEditingData,
  setLandingZoneMonitoring,
  setSelectedMonitoring,
  setDisplayAddEditModal,
  setDisplayViewDetailsModal,
  setDisplayAddRejectModal,
  setSelectedRows,
  setCopying,
  isReader,
  filteredLzMonitorings,
  searchTerm,
}) => {
  //Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);

  // Columns for the table
  const columns = [
    {
      title: 'Name',
      dataIndex: 'monitoringName',
      key: 'monitoringName',
      render: (text) => {
        return (
          <span
            style={{
              background:
                searchTerm.length > 0 && text.toLocaleLowerCase().includes(searchTerm)
                  ? 'var(--highlight)'
                  : 'transparent',
            }}>
            {text}
          </span>
        );
      },
    },
    {
      title: 'Cluster',
      dataIndex: ['cluster.name', 'cluster.thor_host', 'cluster.thor_port'],
      key: 'type',
      render: (_, record) => {
        const clusterName = record['cluster.name'];
        const url = `${record['cluster.thor_host']}:${record['cluster.thor_port']}`;
        return (
          <Tooltip title={url}>
            <span style={{ color: 'var(--primary)' }}>{clusterName}</span>
          </Tooltip>
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
      title: 'Landing Zone',
      dataIndex: 'metaData.monitoringData.dropzone',
      key: 'dropzone',
    },
    {
      title: 'Directory',
      dataIndex: 'metaData.monitoringData.directory',
      key: 'directory',
    },
    {
      title: 'Created By',
      dataIndex: ['creator.firstName', 'creator.lastName', 'creator.email'],
      key: 'creator',
      render: (_, record) => {
        const fullName = `${record['creator.firstName'] || ''} ${record['creator.lastName'] || ''}`;
        const email = record['creator.email'] || '';
        return (
          <Tooltip title={email}>
            <span style={{ color: 'var(--primary)' }}>{fullName}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'active',
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
      render: (_, record) => (
        <>
          <Tooltip title="View  Details">
            <EyeOutlined className={styles.icons} onClick={() => viewMonitoringDetails(record)} />
          </Tooltip>
          {!isReader ? (
            <>
              <Tooltip title="Edit">
                <EditOutlined className={styles.icons} onClick={() => editLandingZoneMonitoring(record)} />
              </Tooltip>

              <Popover
                placement="bottom"
                content={
                  <div className={styles.lzMonitoringTable__hidden_actions}>
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
                          className={styles.icons}
                        />
                        Pause
                      </div>
                    ) : (
                      <div onClick={() => toggleMonitoringStatus(record)}>
                        <PlayCircleOutlined
                          disabled={record.approvalStatus !== APPROVAL_STATUS.APPROVED}
                          className={styles.icons}
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
                      onConfirm={() => handleLzMonitoringDeletion(record)}
                      okText="Continue"
                      okButtonProps={{ danger: true }}
                      cancelText="Close"
                      cancelButtonProps={{ type: 'primary', ghost: true }}
                      style={{ width: '500px !important' }}>
                      <DeleteOutlined style={{ marginRight: 15 }} />
                      Delete
                    </Popconfirm>
                    <Link to={`/${applicationId}/dashboard/notifications`}>
                      <BellOutlined style={{ marginRight: 15 }} />
                      Notifications
                    </Link>
                    <div style={{ color: 'var(--primary)' }} onClick={() => copyMonitoring(record)}>
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
          ) : (
            <Link
              to={`/${applicationId}/dashboard/notifications?monitoringId=124&monitoringType=landingZoneMonitoring`}>
              <BellOutlined style={{ marginRight: 15 }} />
            </Link>
          )}
        </>
      ),
    },
  ];

  // When eye icon is clicked, display the monitoring details modal
  const viewMonitoringDetails = (record) => {
    setSelectedMonitoring(record);
    setDisplayViewDetailsModal(true);
  };

  // When edit icon is clicked, display the add landing zone monitoring modal and set the selected monitoring
  const editLandingZoneMonitoring = (record) => {
    setEditingData({ isEditing: true, selectedMonitoring: record });

    setSelectedMonitoring(record);
    setDisplayAddEditModal(true);
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record) => {
    setSelectedMonitoring(record);
    setDisplayAddRejectModal(true);
  };

  const handleLzMonitoringDeletion = async (record) => {
    try {
      await landingZoneMonitoringService.delete(record.id);
      setLandingZoneMonitoring((prev) => prev.filter((lz) => lz.id !== record.id));
      handleSuccess('Landing zone monitoring deleted successfully');
    } catch (err) {
      handleError('Failed to delete landing zone monitoring');
    }
  };

  // When copy/duplicate icon is clicked
  const copyMonitoring = (record) => {
    setCopying(true);
    setSelectedMonitoring(record);
    setDisplayAddEditModal(true);
  };

  // Start or pause monitoring
  const toggleMonitoringStatus = async (record) => {
    try {
      if (record.approvalStatus !== APPROVAL_STATUS.APPROVED) {
        handleError('Monitoring must be in approved state before it can be started');
        return;
      }

      // await toggleLzMonitoringStatus({ ids: [record.id], isActive: !record.isActive });
      await landingZoneMonitoringService.toggle([record.id], !record.isActive);
      setLandingZoneMonitoring((prev) =>
        prev.map((lz) => (lz.id === record.id ? { ...lz, isActive: !lz.isActive } : lz))
      );

      handleSuccess('Monitoring status toggled successfully');
    } catch (err) {
      handleError('Failed to toggle monitoring status');
    }
  };
  return (
    <Table
      dataSource={filteredLzMonitorings}
      columns={columns}
      rowKey="id"
      size="small"
      // bordered
      rowSelection={{
        type: 'checkbox',
        onChange: (_selectedRowKeys, selectedRowsData) => {
          setSelectedRows(selectedRowsData);
        },
      }}
      pagination={{ pageSize: 20 }}
      rowClassName={(record) => (record?.isActive ? commonStyles.table_active_row : commonStyles.table_inactive_row)}
    />
  );
};

export default LandingZoneMonitoringTable;
