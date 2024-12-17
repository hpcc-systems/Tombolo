import React from 'react';
import { Table, Tooltip, Popconfirm, message, Popover } from 'antd';
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

import { handleDeleteDirectoryMonitoring, toggleDirectoryMonitoringStatus } from './Utils';

//Approve button colorzx
const approveButtonColor = (approvalStatus) => {
  if (approvalStatus === 'Pending') {
    return 'var(--primary)';
  } else if (approvalStatus === 'Approved') {
    return 'var(--success)';
  } else {
    return 'var(--danger)';
  }
};

const DirectoryMonitoringTable = ({
  setEditingData,
  directoryMonitorings,
  setDirectoryMonitorings,
  setSelectedMonitoring,
  setDisplayAddEditModal,
  setDisplayViewDetailsModal,
  setDisplayAddRejectModal,
  setSelectedRows,
  setCopying,
  isReader,
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
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
      title: 'Directory',
      dataIndex: 'directory',
      key: 'directory',
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
      dataIndex: 'active',
      key: 'active',
      render: (_, record) => (record.active ? 'Yes' : 'No'),
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
          {!isReader ? (
            <>
              <Tooltip title="Edit">
                <EditOutlined
                  style={{ color: 'var(--primary)', marginRight: 15 }}
                  onClick={() => editDirectoryMonitoring(record)}
                />
              </Tooltip>

              <Popover
                placement="bottom"
                content={
                  <div
                    style={{ display: 'flex', flexDirection: 'column', color: 'var(--primary)', cursor: 'pointer' }}
                    className="jobMonitoringTable__hidden_actions">
                    <div title="Approve" onClick={() => evaluateMonitoring(record)}>
                      <CheckCircleFilled
                        style={{ color: approveButtonColor(record.approvalStatus), marginRight: 15 }}
                      />{' '}
                      Approve / Reject
                    </div>

                    {record.active ? (
                      <div onClick={() => toggleMonitoringStatus(record)}>
                        <PauseCircleOutlined
                          disabled={record.approvalStatus !== 'Approved'}
                          style={{ color: 'var(--primary)', marginRight: 15 }}
                        />
                        Pause
                      </div>
                    ) : (
                      <div onClick={() => toggleMonitoringStatus(record)}>
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
                        handleDeleteDirectoryMonitoring({
                          id: record.id,
                          directoryMonitorings,
                          setDirectoryMonitorings,
                        })
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
                      to={`/${applicationId}/dashboard/notifications?monitoringId=124&monitoringType=directoryMonitoring`}>
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
            <Link to={`/${applicationId}/dashboard/notifications?monitoringId=124&monitoringType=directoryMonitoring`}>
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

  // When edit icon is clicked, display the add directory monitoring modal and set the selected monitoring
  const editDirectoryMonitoring = (record) => {
    setEditingData({ isEditing: true, selectedMonitoring: record });

    setSelectedMonitoring(record);
    setDisplayAddEditModal(true);
  };

  // Approve or reject monitoring
  const evaluateMonitoring = (record) => {
    setSelectedMonitoring(record);
    setDisplayAddRejectModal(true);
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
      if (!record.approved) {
        message.error('Monitoring must be in approved state before it can be started');
        return;
      }
      const updatedData = await toggleDirectoryMonitoringStatus({ id: record.id });
      setDirectoryMonitorings((prev) =>
        prev.map((monitoring) => (monitoring.id === record.id ? updatedData : monitoring))
      );
    } catch (err) {
      message.error('Failed to toggle monitoring status');
    }
  };
  return (
    <Table
      dataSource={directoryMonitorings}
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
        record?.active ? 'jobMonitoringTable__active-monitoring' : 'jobMonitoringTable__inactive-monitoring'
      }
    />
  );
};

export default DirectoryMonitoringTable;