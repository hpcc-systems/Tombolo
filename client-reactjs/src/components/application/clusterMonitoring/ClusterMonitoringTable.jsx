import React from 'react';
import { Table, Badge, Space, Tooltip } from 'antd';
import { EyeOutlined, DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined, BellOutlined } from '@ant-design/icons';

import { useSelector } from 'react-redux';

import { Constants } from '../../common/Constants.js';

function ClusterMonitoringTable({ clusterMonitorings }) {
  const { clusters } = useSelector((state) => state.applicationReducer);
  //Columns
  const columns = [
    {
      title: 'Status',
      render: (_, record) => (
        <>
          <Badge color={record.isActive ? 'green' : 'gray'} text={record.isActive ? 'Active' : 'Paused'} />
        </>
      ),
    },
    { title: 'Display Name', dataIndex: 'name' },
    {
      title: 'Monitoring type',
      render: (record) => {
        return record.monitoringAssetType === 'landingZoneFile' ? ' Landing Zone' : 'Logical FIle';
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
        return (
          createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
          ' @ ' +
          createdAt.toLocaleTimeString('en-US')
        );
      },
    },
    {
      title: 'Last Monitored',
      dataIndex: 'metaData',
      render: (record) => {
        let lastMonitored = new Date(parseInt(record.lastMonitored));
        console.log(lastMonitored);
        return lastMonitored.toLocaleString();
      },
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <a>
            <Tooltip title="View">
              <EyeOutlined
              //   onClick={() => viewExistingFileMonitoring(record.id)}
              />
            </Tooltip>
          </a>
          {record.isActive ? (
            <a>
              <Tooltip title="Pause Monitoring">
                <PauseCircleOutlined
                // onClick={() => changeFileMonitoringStatus(record.id)}
                />
              </Tooltip>
            </a>
          ) : (
            <a>
              <Tooltip title="Resume Monitoring">
                <PlayCircleOutlined
                // onClick={() => changeFileMonitoringStatus(record.id)}
                />
              </Tooltip>
            </a>
          )}

          <a>
            <Tooltip title="Delete Monitoring">
              <DeleteOutlined
              // onClick={() => {
              //   console.log(record);
              //   deleteFileMonitoring({ id: record.id, name: record.displayName });
              // }}
              />
            </Tooltip>
          </a>

          <Tooltip title="Notifications">
            {/* <Link to={`/${applicationId}/notifications?monitoringId=${record.id}`}> */}
            <BellOutlined />
            {/* </Link> */}
          </Tooltip>
        </Space>
      ),
    },
  ];

  return <Table columns={columns} dataSource={clusterMonitorings} size={'small'} />;
}

export default ClusterMonitoringTable;
