import React from 'react';
import { Table, Space, Tooltip, Badge, message } from 'antd';
import { DeleteOutlined, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../common/AuthHeader.js';

const OrbitMonitoringTable = ({
  orbitBuildList,
  setOrbitBuildList,
  setSelectedOrbitBuild,
  setModalVisible,
  setEditing,
}) => {
  // Delete record
  const deleteOrbitBuildMonitoring = async ({ id, name }) => {
    try {
      const payload = {
        method: 'DELETE',
        headers: authHeader(),
      };

      const response = await fetch(`/api/orbit/delete/${id}/${name}`, payload);
      console.log(response);
      if (!response.ok) return handleError(response);

      const newOrbitBuildMonitoringList = orbitBuildList.filter((OrbitBuild) => OrbitBuild.id != id);
      setOrbitBuildList(newOrbitBuildMonitoringList);
    } catch (err) {
      message.error('Failed to delete Orbit Build monitoring ', err.message);
    }
  };

  // View existing orbit monitoring  ------------------------------------------------------------------
  const viewExistingOrbitBuildMonitoring = (id) => {
    setEditing(id);
    setModalVisible(true);
    setSelectedOrbitBuild(id);
  };

  const changeOrbitBuildMonitoringStatus = async (id) => {
    try {
      const payload = {
        method: 'PUT',
        headers: authHeader(),
      };

      const response = await fetch(`/api/orbit/toggleStatus/${id}`, payload);
      if (!response.ok) return handleError(response);
      const updatedMonitoringList = orbitBuildList.map((record) =>
        record.id === id ? { ...record, isActive: !record.isActive } : record
      );
      setOrbitBuildList(updatedMonitoringList);
    } catch (err) {
      message.error('Failed to update file monitoring status');
    }
  };

  const columns2 = [
    {
      title: 'Status',
      render: (_, record) => (
        <>
          <Badge color={record.isActive ? 'green' : 'gray'} text={record.isActive ? 'Active' : 'Paused'} />
        </>
      ),
    },
    { title: 'Name', dataIndex: 'name' },
    { title: 'Build', dataIndex: 'build' },

    { title: 'Cron', dataIndex: 'cron' },
    { title: 'Severity Code', dataIndex: 'severityCode' },
    {
      title: 'Delete',
      dataIndex: 'delete',
      render: (_, record) => (
        <Space size="middle">
          <a>
            <Tooltip title="View">
              <EyeOutlined onClick={() => viewExistingOrbitBuildMonitoring(record.id)} />
            </Tooltip>
          </a>
          {record.isActive ? (
            <a>
              <Tooltip title="Pause Monitoring">
                <PauseCircleOutlined onClick={() => changeOrbitBuildMonitoringStatus(record.id)} />
              </Tooltip>
            </a>
          ) : (
            <a>
              <Tooltip title="Resume Monitoring">
                <PlayCircleOutlined onClick={() => changeOrbitBuildMonitoringStatus(record.id)} />
              </Tooltip>
            </a>
          )}
          <a>
            <Tooltip title="Delete Monitoring">
              <DeleteOutlined
                onClick={() => {
                  deleteOrbitBuildMonitoring({ id: record.id, name: record.name });
                }}
              />
            </Tooltip>
          </a>
        </Space>
      ),
    },
  ];
  return (
    <>
      <Table
        size="large"
        pagination={false}
        columns={columns2}
        dataSource={orbitBuildList}
        rowKey={(record) => record.id}
      />
    </>
  );
};

export default OrbitMonitoringTable;
