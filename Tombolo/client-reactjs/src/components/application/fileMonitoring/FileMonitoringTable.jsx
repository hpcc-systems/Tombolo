import React from 'react';
import { Table, Space, Tooltip, Badge, message } from 'antd';
import { EyeOutlined, DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined, BellOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { Constants } from '../../common/Constants.js';
import { Link } from 'react-router-dom';

function FileMonitoringTable({
  fileMonitoringList,
  setFileMonitoringList,
  setIsModalVisible,
  setSelectedFileMonitoring,
  applicationId,
  isReader,
}) {
  // Delete file monitoring -----------------------------------------------------------------
  const deleteFileMonitoring = async ({ id, name }) => {
    try {
      const payload = {
        method: 'DELETE',
        headers: authHeader(),
      };

      const response = await fetch(`/api/filemonitoring/read/${id}/${name}`, payload);
      if (!response.ok) return handleError(response);
      const newFileMonitoringList = fileMonitoringList.filter((fileMonitoring) => fileMonitoring.id != id);
      setFileMonitoringList(newFileMonitoringList);
    } catch (err) {
      message.error('Failed to delete file monitoring ', err.message);
    }
  };
  // Update file monitoring status ----------------------------------------------------------------
  const changeFileMonitoringStatus = async (id) => {
    try {
      const payload = {
        method: 'PUT',
        headers: authHeader(),
      };

      const response = await fetch(`/api/filemonitoring/read/fileMonitoringStatus/${id}`, payload);
      if (!response.ok) return handleError(response);
      const updatedMonitoringList = fileMonitoringList.map((record) =>
        record.id === id ? { ...record, monitoringActive: !record.monitoringActive } : record
      );
      setFileMonitoringList(updatedMonitoringList);
    } catch (err) {
      message.error('Failed to update file monitoring status');
    }
  };
  // View existing file monitoring  ------------------------------------------------------------------
  const viewExistingFileMonitoring = (id) => {
    setIsModalVisible(true);
    setSelectedFileMonitoring(id);
  };
  // File Monitoring Table columns  ------------------------------------------------------------------
  const columns = [
    {
      title: 'Status',
      render: (_, record) => (
        <>
          <Badge
            color={record.monitoringActive ? 'green' : 'red'}
            text={record.monitoringActive ? 'Active' : 'Paused'}
          />
        </>
      ),
    },
    { title: 'Display Name', dataIndex: 'displayName' },
    { title: 'Cluster', dataIndex: 'cluster' },
    { title: 'Directory / File Name', dataIndex: 'fileName' },
    { title: 'Schedule', dataIndex: 'cron' },
    {
      title: 'Monitoring Created',
      render: (record) => {
        let createdAt = new Date(record.monitoringStarted);
        return (
          createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
          ' @ ' +
          createdAt.toLocaleTimeString('en-US')
        );
      },
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <a>
            <Tooltip title="View">
              <EyeOutlined onClick={() => viewExistingFileMonitoring(record.id)} />
            </Tooltip>
          </a>
          {!isReader && (
            <>
              {record.monitoringActive ? (
                <a>
                  <Tooltip title="Pause Monitoring">
                    <PauseCircleOutlined onClick={() => changeFileMonitoringStatus(record.id)} />
                  </Tooltip>
                </a>
              ) : (
                <a>
                  <Tooltip title="Resume Monitoring">
                    <PlayCircleOutlined onClick={() => changeFileMonitoringStatus(record.id)} />
                  </Tooltip>
                </a>
              )}

              <a>
                <Tooltip title="Delete Monitoring">
                  <DeleteOutlined
                    onClick={() => {
                      console.log(record);
                      deleteFileMonitoring({ id: record.id, name: record.displayName });
                    }}
                  />
                </Tooltip>
              </a>
            </>
          )}

          <Tooltip title="Notifications">
            <Link to={`/${applicationId}/notifications?monitoringId=${record.id}`}>
              <BellOutlined />
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Table row class name
  const getRowClassName = (record) => {
    if (!record.monitoringActive) {
      return 'monitoring_table_paused_monitorings clusterMonitoring_table_rows';
    }
  };

  return (
    <Table
      size="small"
      columns={columns}
      dataSource={fileMonitoringList}
      rowKey={(record) => record.id}
      rowClassName={getRowClassName}
      className="cluster_monitoring_table"
    />
  );
}

export default FileMonitoringTable;
