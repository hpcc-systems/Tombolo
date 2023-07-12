import React from 'react';
import { Table, Badge, Space, Tooltip, message } from 'antd';
import { EyeOutlined, DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined, BellOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

import { useSelector } from 'react-redux';
import { authHeader, handleError } from '../../common/AuthHeader.js';

function JobMonitoringTable({
  jobMonitorings,
  setJobMonitorings,
  applicationId,
  setSelectedMonitoring,
  setVisible,
  setSelectedCluster,
  setNotificationDetails,
  setMonitoringScope,
  setNotifyConditions,
}) {
  const { clusters } = useSelector((state) => state.applicationReducer);

  //Delete job monitoring
  const deleteJobMonitoring = async (id) => {
    try {
      const payload = {
        method: 'DELETE',
        header: authHeader(),
      };

      const response = await fetch(`/api/jobmonitoring/${id}`, payload);
      if (!response.ok) return handleError(response);
      const newJobMonitoringList = jobMonitorings.filter((monitoring) => monitoring.id !== id);
      setJobMonitorings(newJobMonitoringList);
    } catch (err) {
      message.error(err.message);
    }
  };

  // Pause or start job monitoring
  const changeJobMonitoringStatus = async (id) => {
    try {
      const payload = {
        method: 'PUT',
        header: authHeader(),
      };

      const response = await fetch(`/api/jobmonitoring/jobMonitoringStatus/${id}`, payload);
      if (!response.ok) return handleError(response);
      const newJobMonitoringList = jobMonitorings.map((monitoring) => {
        if (monitoring.id === id) {
          return { ...monitoring, isActive: !monitoring.isActive };
        } else {
          return monitoring;
        }
      });
      setJobMonitorings(newJobMonitoringList);
    } catch (err) {
      message.error(err.message);
    }
  };

  // Filter and get  particular job monitoring from list
  // When component loads and if there is selected monitoring pass data to form instance
  const viewExistingJobMonitoring = (monitoringId) => {
    const selectedMonitoringDetails = jobMonitorings.filter((monitoring) =>
      monitoringId === monitoring.id ? monitoring : null
    )[0];

    const {
      metaData: {
        notifications,
        monitoringScope,
        notificationConditions,
        jobName,
        costLimits,
        // costLimits: { maxCompileCost, maxExecutionCost, maxFileAccessCost, maxTotalCost },
      },
      cluster_id,
    } = selectedMonitoringDetails;

    const notificationChannels = [];
    const notificationRecipients = {};
    notifications.forEach((notification) => {
      notificationChannels.push(notification.channel);
      notificationRecipients[notification.channel] = notification.recipients;
    });

    const updatedMonitoringDetails = {
      ...selectedMonitoringDetails,
      notificationChannels,
      emails: notificationRecipients.eMail,
      msTeamsGroups: notificationRecipients.msTeams,
      monitoringScope,
      notificationConditions,
      jobName,
      maxCompileCost: costLimits?.maxCompileCost,
      maxExecutionCost: costLimits?.maxExecutionCost,
      maxFileAccessCost: costLimits?.maxFileAccessCost,
      maxTotalCost: costLimits?.maxTotalCost,
    };

    setSelectedMonitoring(updatedMonitoringDetails);
    setNotifyConditions(notificationConditions);
    setSelectedCluster(cluster_id);
    setNotificationDetails({ notificationChannel: notificationChannels });
    setMonitoringScope(monitoringScope);
    setVisible(true);
  };

  //Columns
  const columns = [
    {
      title: 'Status',
      render: (_, record) => (
        <>
          <Badge color={record.isActive ? 'green' : 'red'} text={record.isActive ? 'Active' : 'Paused'} />
        </>
      ),
    },
    { title: 'Display Name', dataIndex: 'name' },
    {
      title: 'Monitoring type',
      render: () => {
        return 'Job';
      },
    },
    {
      title: 'Cluster',
      dataIndex: 'cluster_id',
      render: (record) => {
        if (!clusters) {
          return record.cluster_id;
        } else {
          const cluster = clusters.find((cluster) => cluster.id === record);
          if (cluster) return cluster.name;
        }
      },
    },
    { title: 'Schedule', dataIndex: 'cron' },
    {
      title: 'Monitoring Created',
      render: (record) => {
        let createdAt = new Date(record.createdAt);
        return createdAt.toLocaleString();
      },
    },
    {
      title: 'Last Monitored',
      dataIndex: 'metaData',
      render: (record) => {
        let last_monitored = 'NA';
        if (record?.last_monitored) {
          last_monitored = new Date(record.last_monitored);
          last_monitored = last_monitored.toLocaleString();
        }
        return last_monitored;
      },
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <a>
            <Tooltip title="View">
              <EyeOutlined onClick={() => viewExistingJobMonitoring(record.id)} />
            </Tooltip>
          </a>
          {record.isActive ? (
            <a>
              <Tooltip title="Pause Monitoring">
                <PauseCircleOutlined onClick={() => changeJobMonitoringStatus(record.id)} />
              </Tooltip>
            </a>
          ) : (
            <a>
              <Tooltip title="Resume Monitoring">
                <PlayCircleOutlined onClick={() => changeJobMonitoringStatus(record.id)} />
              </Tooltip>
            </a>
          )}

          <a>
            <Tooltip title="Delete Monitoring">
              <DeleteOutlined
                onClick={() => {
                  deleteJobMonitoring(record.id);
                }}
              />
            </Tooltip>
          </a>

          <Tooltip title="Notifications">
            <Link to={`/${applicationId}/dashboard/notifications?monitoringId=${record.id}`}>
              <BellOutlined />
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Table row class name
  const getRowClassName = (record) => {
    if (!record.isActive) {
      return 'monitoring_table_paused_monitorings clusterMonitoring_table_rows';
    }
  };

  return (
    <Table
      columns={columns}
      dataSource={jobMonitorings}
      size={'small'}
      rowClassName={getRowClassName}
      className="cluster_monitoring_table"
      rowKey={(record) => record.id}
    />
  );
}

export default JobMonitoringTable;
