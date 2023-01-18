import React, { useEffect, useState } from 'react';
import { message, Table } from 'antd';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import { Constants } from '../../common/Constants';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState([]);
  const {
    application: { applicationId },
  } = useSelector((item) => item.applicationReducer);
  const location = useLocation();

  //When the component loads - get all notifications
  useEffect(() => {
    const monitoringId = new URLSearchParams(location.search).get('monitoringId');
    getNotifications(monitoringId);
  }, [applicationId, location]);

  //Get list of all file monitoring
  const getNotifications = async (monitoringId) => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/notifications/read/${applicationId}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      console.log(data);
      if (!monitoringId) {
        setNotifications(data);
      } else {
        const filtered = data.filter((item) => item.filemonitoring_id === monitoringId);
        setNotifications(filtered);
      }

      //Set filters Filters
      const tempArr = [];
      data.map((notification) => {
        if (notification['fileMonitoring.name']) {
          const includesObj = tempArr.find((item) => item.text === notification['fileMonitoring.name']);
          if (!includesObj) {
            tempArr.push({ text: notification['fileMonitoring.name'], value: notification['fileMonitoring.name'] });
          }
        }
      });
      setFilters(tempArr);
    } catch (error) {
      message.error('Failed to fetch notifications');
    }
  };

  //Table columns and data
  const columns = [
    {
      title: '',
      render: (_text, _record, index) => {
        return index + 1;
      },
    },
    {
      title: 'Notified at',
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
      title: 'Monitoring name',
      filters: filters,
      render: (record) => {
        return record['fileMonitoring.name'] || '';
      },
    },
    {
      title: 'Notification reason',
      render: (record) => {
        let value = record?.notification_reason?.split('');
        const firstLetter = value[0].toUpperCase();
        value[0] = firstLetter;
        return value.join('');
      },
    },
    {
      title: 'File name',
      dataIndex: 'file_name',
    },
    {
      title: 'Notification channel',
      render: (record) => {
        const notificationChannel = record.notification_channel;
        return notificationChannel === 'eMail' ? 'E-mail' : 'MS-Teams';
      },
    },
    {
      title: 'status',
      render: (record) => {
        let value = record?.status?.split('');
        const firstLetter = value[0].toUpperCase();
        value[0] = firstLetter;
        return value.join('');
      },
    },
    {
      title: 'Updated on',
      render: (record) => {
        let createdAt = new Date(record.updatedAt);
        return (
          createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
          ' @ ' +
          createdAt.toLocaleTimeString('en-US')
        );
      },
    },
    {
      title: 'comment',
      dataIndex: 'comment',
      width: '20%',
    },
  ];

  //JSX
  return (
    <Table
      align="right"
      pagination={{ pageSize: 14 }}
      size="small"
      columns={columns}
      dataSource={notifications}
      rowKey={(record) => record.id}
      verticalAlign="top"
    />
  );
}

export default Notifications;
