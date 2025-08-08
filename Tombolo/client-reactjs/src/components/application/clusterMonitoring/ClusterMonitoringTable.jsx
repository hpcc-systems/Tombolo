import React from 'react';
import { Table, Badge, Space, Tooltip, message } from 'antd';
import { EyeOutlined, DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined, BellOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

import { useSelector } from 'react-redux';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import styles from './clusterMonitoring.module.css';

function ClusterMonitoringTable({
  clusterMonitorings,
  setClusterMonitorings,
  applicationId,
  setSelectedMonitoring,
  setVisible,
  setSelectedCluster,
  setNotifyConditions,
  setEngines,
  setSelectedEngines,
  setNotificationDetails,
  isReader,
}) {
  const clusters = useSelector((state) => state.application.clusters);

  //Delete cluster monitoring
  const deleteClusterMonitoring = async (id) => {
    try {
      const payload = {
        method: 'DELETE',
        headers: authHeader(),
      };

      const response = await fetch(`/api/clustermonitoring/${id}`, payload);
      if (!response.ok) return handleError(response);
      const newClusterMonitoringList = clusterMonitorings.filter((monitoring) => monitoring.id !== id);
      setClusterMonitorings(newClusterMonitoringList);
    } catch (err) {
      message.error(err.message);
    }
  };

  // Pause or start cluster monitoring
  const changeClusterMonitoringStatus = async (id) => {
    try {
      const payload = {
        method: 'PUT',
        headers: authHeader(),
      };

      const response = await fetch(`/api/clustermonitoring/clusterMonitoringStatus/${id}`, payload);
      if (!response.ok) return handleError(response);
      const newClusterMonitoringList = clusterMonitorings.map((monitoring) => {
        if (monitoring.id === id) {
          return { ...monitoring, isActive: !monitoring.isActive };
        } else {
          return monitoring;
        }
      });
      setClusterMonitorings(newClusterMonitoringList);
    } catch (err) {
      message.error(err.message);
    }
  };

  // Filter and get  particular cluster monitoring from list
  // When component loads and if there is selected monitoring pass data to form instance
  const viewExistingClusterMonitoring = (monitoringId) => {
    const selectedMonitoringDetails = clusterMonitorings.filter((monitoring) =>
      monitoringId === monitoring.id ? monitoring : null
    )[0];

    const {
      metaData: {
        monitoring_engines,
        monitoringConditions: { monitorEngineSize },
        notifications,
        notifyCondition,
      },
      cluster_id,
    } = selectedMonitoringDetails;

    setNotifyConditions(notifyCondition);

    const engineMaxSizes = {};
    monitorEngineSize.forEach((monitor) => {
      engineMaxSizes[`engineLimit-${monitor.engine}`] = monitor.maxSize;
    });

    const notificationChannels = [];
    const notificationRecipients = {};
    notifications.forEach((notification) => {
      notificationChannels.push(notification.channel);
      notificationRecipients[notification.channel] = notification.recipients;
    });

    const updatedMonitoringDetails = {
      ...selectedMonitoringDetails,
      monitoring_engines,
      notifyCondition: notifyCondition,
      engineSizeLimit: engineMaxSizes,
      notificationChannels,
      emails: notificationRecipients.eMail,
      msTeamsGroups: notificationRecipients.msTeams,
    };

    setSelectedMonitoring(updatedMonitoringDetails);
    setSelectedCluster(cluster_id);
    setEngines(monitoring_engines);
    setSelectedEngines(monitoring_engines);
    setNotificationDetails({ notificationChannel: notificationChannels });
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
        return 'Cluster';
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
              <EyeOutlined onClick={() => viewExistingClusterMonitoring(record.id)} />
            </Tooltip>
          </a>
          {!isReader ? (
            <>
              {record.isActive ? (
                <a>
                  <Tooltip title="Pause Monitoring">
                    <PauseCircleOutlined onClick={() => changeClusterMonitoringStatus(record.id)} />
                  </Tooltip>
                </a>
              ) : (
                <a>
                  <Tooltip title="Resume Monitoring">
                    <PlayCircleOutlined onClick={() => changeClusterMonitoringStatus(record.id)} />
                  </Tooltip>
                </a>
              )}

              <a>
                <Tooltip title="Delete Monitoring">
                  <DeleteOutlined
                    onClick={() => {
                      console.log(record);
                      deleteClusterMonitoring(record.id);
                    }}
                  />
                </Tooltip>
              </a>

              <Tooltip title="Notifications">
                <Link to={`/${applicationId}/notifications?monitoringId=${record.id}`}>
                  <BellOutlined />
                </Link>
              </Tooltip>
            </>
          ) : (
            <Tooltip title="Notifications">
              <Link to={`/${applicationId}/notifications?monitoringId=${record.id}`}>
                <BellOutlined />
              </Link>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Table row class name
  const getRowClassName = (record) => {
    if (!record.isActive) {
      return `${styles.monitoring_table_paused_monitorings}`;
    }
  };

  return (
    <Table
      columns={columns}
      dataSource={clusterMonitorings}
      size={'small'}
      rowClassName={getRowClassName}
      className={styles.cluster_monitoring_table}
      rowKey={(record) => record.id}
    />
  );
}

export default ClusterMonitoringTable;
