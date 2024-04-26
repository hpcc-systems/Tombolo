import React from 'react';
import { Table, Tooltip, Popconfirm, message } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  BellOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { handleDeleteJobMonitoring, toggleJobMonitoringStatus } from './jobMonitoringUtils';

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

const JobMonitoringTable = ({
  setEditingData,
  jobMonitorings,
  setJobMonitorings,
  setSelectedMonitoring,
  setDisplayAddJobMonitoringModal,
  setDisplayMonitoringDetailsModal,
  setDisplayAddRejectModal,
  setSelectedRows,
}) => {
  //Redux
  const {
    applicationReducer: {
      application: { applicationId },
    },
  } = useSelector((state) => state);

  // Columns for the table
  const columns = [
    {
      title: 'Monitoring Name',
      dataIndex: 'monitoringName',
      key: 'monitoringName',
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
      title: 'Monitoring Scope',
      dataIndex: 'monitoringScope',
      key: 'monitoringScope',
    },
    {
      title: 'Job Name/Pattern',
      dataIndex: 'jobName',
      key: 'jobName',
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (text) => {
        const { name, email, id } = JSON.parse(text);
        return (
          <Tooltip
            title={
              <>
                <div>ID : {id}</div>
                <div>E-mail: {email}</div>
              </>
            }>
            <span style={{ color: 'var(--primary' }}>{name}</span>
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
      render: (_, record) => (
        <>
          <Tooltip title="View  Details">
            <EyeOutlined
              style={{ color: 'var(--primary)', marginRight: 15 }}
              onClick={() => viewMonitoringDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <EditOutlined
              style={{ color: 'var(--primary)', marginRight: 15 }}
              onClick={() => editJobMonitoring(record)}
            />
          </Tooltip>

          <Tooltip title="Approve">
            <CheckCircleFilled
              style={{ color: approveButtonColor(record.approvalStatus), marginRight: 15 }}
              onClick={() => evaluateMonitoring(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Pause' : 'Start'}>
            {record.isActive ? (
              <PauseCircleOutlined
                disabled={record.approvalStatus !== 'Approved'}
                onClick={() => toggleMonitoringStatus(record)}
                style={{ color: 'var(--primary)', marginRight: 15 }}
              />
            ) : (
              <PlayCircleOutlined
                disabled={record.approvalStatus !== 'Approved'}
                onClick={() => toggleMonitoringStatus(record)}
                style={{ color: 'var(--primary)', marginRight: 15 }}
              />
            )}
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title={
                <>
                  <div style={{ fontWeight: 'bold' }}>{`Delete ${record.monitoringName}`} </div>
                  <div style={{ maxWidth: 400 }}>
                    This action will delete all related data including notifications generated by this monitoring. If
                    you would like to keep the data, you can deactivate the monitoring instead.
                  </div>
                </>
              }
              onConfirm={() => handleDeleteJobMonitoring({ id: record.id, jobMonitorings, setJobMonitorings })}
              okText="Continue"
              okButtonProps={{ danger: true }}
              cancelText="Close"
              cancelButtonProps={{ type: 'primary', ghost: true }}
              style={{ width: '500px !important' }}>
              <DeleteOutlined style={{ color: 'var(--primary)', marginRight: 15 }} />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="Notifications">
            <Link to={`/${applicationId}/dashboard/notifications?monitoringId=124&monitoringType=jobMonitoring`}>
              <BellOutlined style={{ color: 'var(--primary)', marginRight: 15 }} />
            </Link>
          </Tooltip>
        </>
      ),
    },
  ];

  // When eye icon is clicked, display the monitoring details modal
  const viewMonitoringDetails = (record) => {
    setSelectedMonitoring(record);
    setDisplayMonitoringDetailsModal(true);
  };

  // When edit icon is clicked, display the add job monitoring modal and set the selected monitoring
  const editJobMonitoring = (record) => {
    setEditingData({ isEditing: true, selectedMonitoring: record });

    setSelectedMonitoring(record);
    setDisplayAddJobMonitoringModal(true);
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record) => {
    setSelectedMonitoring(record);
    setDisplayAddRejectModal(true);
  };

  // Start or pause monitoring
  const toggleMonitoringStatus = async (record) => {
    try {
      if (record.approvalStatus !== 'Approved') {
        message.error('Monitoring must be in approved state before it can be started');
        return;
      }
      const updatedData = await toggleJobMonitoringStatus({ id: record.id });
      setJobMonitorings((prev) => prev.map((monitoring) => (monitoring.id === record.id ? updatedData : monitoring)));
    } catch (err) {
      message.error('Failed to toggle monitoring status');
    }
  };
  return (
    <Table
      dataSource={jobMonitorings}
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
      rowClassName={(record) =>
        record.isActive ? 'jobMonitoringTable__active-monitoring' : 'jobMonitoringTable__inactive-monitoring'
      }
    />
  );
};

export default JobMonitoringTable;
