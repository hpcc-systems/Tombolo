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
  allProductCategories,
  filteringJobs,
  clusters,
}) => {
  // States
  const [unreachableClusters, setUnreachableClusters] = useState([]);
  //Redux
  const {
    applicationReducer: {
      application: { applicationId },
      integrations,
    },
  } = useSelector((state) => state);

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
      render: (_, record) =>
        selectedRows.length > 1 ? null : (
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

            <Popover
              placement="bottom"
              content={
                <div
                  style={{ display: 'flex', flexDirection: 'column', color: 'var(--primary)', cursor: 'pointer' }}
                  className="jobMonitoringTable__hidden_actions">
                  <div title="Approve" onClick={() => evaluateMonitoring(record)}>
                    <CheckCircleFilled style={{ color: approveButtonColor(record.approvalStatus), marginRight: 15 }} />{' '}
                    Approve / Reject
                  </div>

                  {record.isActive ? (
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
                          This action will delete all related data including notifications generated by this monitoring.
                          If you would like to keep the data, you can deactivate the monitoring instead.
                        </div>
                      </>
                    }
                    onConfirm={() => handleDeleteJobMonitoring({ id: record.id, jobMonitorings, setJobMonitorings })}
                    okText="Continue"
                    okButtonProps={{ danger: true }}
                    cancelText="Close"
                    cancelButtonProps={{ type: 'primary', ghost: true }}
                    style={{ width: '500px !important' }}>
                    <DeleteOutlined style={{ marginRight: 15 }} />
                    Delete
                  </Popconfirm>
                  <Link to={`/${applicationId}/dashboard/notifications?monitoringId=124&monitoringType=jobMonitoring`}>
                    <BellOutlined style={{ marginRight: 15 }} />
                    Notifications
                  </Link>
                  <div style={{ color: 'var(--primary)' }} onClick={() => duplicateJobMonitoring(record)}>
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
        ),
    },
    {
      key: (_, record) => record.id,
      width: 80,
      render: (_, record) => {
        return unreachableClusters.includes(record.clusterId) ? (
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

  // When copy/duplicate icon is clicked
  const duplicateJobMonitoring = (record) => {
    setDuplicatingData({ isDuplicating: true, selectedMonitoring: record });

    setSelectedMonitoring(record);
    setDisplayAddJobMonitoringModal(true);
  };

  // Start or pause monitoring
  const toggleMonitoringStatus = async (record) => {
    try {
      if (record.approvalStatus !== 'Approved') {
        message.error('Monitoring must be in approved state before it can be started');
        return;
      }

      const updatedData = await toggleJobMonitoringStatus({ ids: [record.id] });
      const updatedMonitoringIds = updatedData.map((monitoring) => monitoring.id);

      setJobMonitorings((prev) =>
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
      dataSource={jobMonitorings}
      loading={filteringJobs}
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
          ? 'jobMonitoringTable__active-monitoring'
          : 'jobMonitoringTable__inactive-monitoring';
        const idsOfSelectedRows = selectedRows.map((row) => row.id);
        if (idsOfSelectedRows.includes(record.id)) {
          className += ' jobMonitoringTable__selected-row';
        }
        return className;
      }}
    />
  );
};

export default JobMonitoringTable;
