import React from 'react';
import { Table, Space, Tooltip, Badge, message } from 'antd';
import { EyeOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, BellOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { Link } from 'react-router-dom';

function SuperFileMonitoringTable({
  setModalVisible,
  superfileMonitoringList,
  setSuperFileMonitoringList,
  applicationId,
  setSelectedFileMonitoring,
}) {
  // Delete record
  const deleteSuperFileMonitoring = async ({ id, name }) => {
    try {
      const payload = {
        method: 'DELETE',
        headers: authHeader(),
      };

      const response = await fetch(`/api/superfilemonitoring/read/${id}/${name}`, payload);
      if (!response.ok) return handleError(response);
      const newSuperFileMonitoringList = superfileMonitoringList.filter((superfile) => superfile.id != id);
      setSuperFileMonitoringList(newSuperFileMonitoringList);
    } catch (err) {
      message.error('Failed to delete superfile monitoring ', err.message);
    }
  };

  const changeFileMonitoringStatus = async (id) => {
    try {
      const payload = {
        method: 'PUT',
        headers: authHeader(),
      };

      const response = await fetch(`/api/superfilemonitoring/read/superfileMonitoringStatus/${id}`, payload);
      if (!response.ok) return handleError(response);
      const updatedMonitoringList = superfileMonitoringList.map((record) =>
        record.id === id ? { ...record, monitoringActive: !record.monitoringActive } : record
      );
      setSuperFileMonitoringList(updatedMonitoringList);
    } catch (err) {
      message.error('Failed to update file monitoring status');
    }
  };

  // View existing file monitoring  ------------------------------------------------------------------
  const viewExistingFileMonitoring = (id) => {
    setModalVisible(true);
    setSelectedFileMonitoring(id);
  };
  const columns = [
    {
      title: 'Status',
      render: (_, record) => (
        <>
          <Badge
            color={record.monitoringActive ? 'green' : 'gray'}
            text={record.monitoringActive ? 'Active' : 'Paused'}
          />
        </>
      ),
    },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Cluster', dataIndex: 'cluster' },
    { title: 'Schedule', dataIndex: 'cron' },
    { title: 'SuperFile Name', dataIndex: 'superfile_name' },
    { title: 'Subfile Count', dataIndex: 'subfiles' },
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
                  deleteSuperFileMonitoring({ id: record.id, name: record.name });
                }}
              />
            </Tooltip>
          </a>

          <a>
            <Tooltip title="Notifications">
              <Link to={`/${applicationId}/notifications?monitoringId=${record.id}`}>
                <BellOutlined />
              </Link>
            </Tooltip>
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table size="small" columns={columns} dataSource={superfileMonitoringList} rowKey={(record) => record.id} />
    </>
  );
}

export default SuperFileMonitoringTable;
