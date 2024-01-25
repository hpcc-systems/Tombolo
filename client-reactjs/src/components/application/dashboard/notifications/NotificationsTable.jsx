/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { message, Table, Modal, Button, Descriptions, Tabs } from 'antd';
import { useLocation } from 'react-router-dom';

import { authHeader, handleError } from '../../../common/AuthHeader.js';
import { camelToTitleCase, formatDateTime } from '../../../common/CommonUtil.js';

function NotificationsTable({ applicationId, setSelectedNotificationForBulkAction, updatedNotificationInDb }) {
  const [notifications, setNotifications] = useState([]);
  const [viewNotificationDetails, setViewNotificationDetails] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filters, setFilters] = useState({
    statusFilters: [],
    monitoringTypeFilters: [],
    notificationReasonFilters: [],
    notificationChannelFilters: [],
  });
  const location = useLocation();

  // Selected notification - complete details
  const selectedNotificationDetails = [
    {
      key: 'Monitoring Type',
      value: camelToTitleCase(selectedNotification?.monitoring_type),
    },
    {
      key: 'Monitoring Name',
      value: `${
        selectedNotification?.['fileMonitoring.name'] ||
        selectedNotification?.['clusterMonitoring.name'] ||
        selectedNotification?.['jobMonitoring.name']
      }`,
    },
    { key: 'Notified at', value: formatDateTime(selectedNotification?.createdAt) },
    { key: 'Updated at', value: formatDateTime(selectedNotification?.updatedAt) },
    { key: 'Notification reason', value: selectedNotification?.notification_reason },
    { key: 'Status', value: camelToTitleCase(selectedNotification?.status) },
    {
      key: 'Comment',
      value: selectedNotification?.comment,
    },
  ];

  // Update filters when notifications change
  useEffect(() => {
    if (notifications.length > 0) {
      const uniqueStatuses = new Set(notifications.map((notification) => notification.status));
      const newStatusFilters = Array.from(uniqueStatuses).map((status) => ({
        text: camelToTitleCase(status),
        value: status,
      }));
      setFilters((prev) => ({ ...prev, statusFilters: newStatusFilters }));

      const uniqueMonitoringTypes = new Set(notifications.map((notification) => notification.monitoring_type));
      const newMonitoringTypeFilters = Array.from(uniqueMonitoringTypes).map((type) => ({
        text: camelToTitleCase(type),
        value: type,
      }));
      setFilters((prev) => ({ ...prev, monitoringTypeFilters: newMonitoringTypeFilters }));

      const uniqueNotificationReasons = new Set(notifications.map((notification) => notification.notification_reason));
      const newNotificationReasonFilters = Array.from(uniqueNotificationReasons).map((reason) => ({
        text: camelToTitleCase(reason),
        value: reason,
      }));
      setFilters((prev) => ({ ...prev, notificationReasonFilters: newNotificationReasonFilters }));

      const uniqueNotificationChannels = new Set(
        notifications.map((notification) => notification.notification_channel)
      );
      const newNotificationChannelFilters = Array.from(uniqueNotificationChannels).map((channel) => ({
        text: camelToTitleCase(channel),
        value: channel,
      }));
      setFilters((prev) => ({ ...prev, notificationChannelFilters: newNotificationChannelFilters }));
    }
  }, [notifications]);

  //When the component loads - get all notifications
  useEffect(() => {
    const monitoringId = new URLSearchParams(location.search).get('monitoringId');
    getNotifications(monitoringId);
  }, [applicationId, location, updatedNotificationInDb]);

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

      if (!monitoringId) {
        setNotifications(data);
      } else {
        const filtered = data.filter((item) => item.monitoring_id === monitoringId);
        setNotifications(filtered);
      }
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
        return <a>{formatDateTime(record.createdAt)}</a>;
      },
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      onCell: (record) => {
        return {
          onClick: () => {
            setSelectedNotification(record);
            setViewNotificationDetails(true);
          },
        };
      },
    },
    {
      title: 'Monitoring Type',
      render: (record) => {
        return camelToTitleCase(record.monitoring_type);
      },
      sorter: (a, b) => a.monitoring_type.localeCompare(b.monitoring_type),
      filters: filters.monitoringTypeFilters,
      onFilter: (value, record) => record.monitoring_type === value,
    },
    {
      title: 'Monitoring name',
      render: (record) => {
        return record?.['fileMonitoring.name'] || record?.['clusterMonitoring.name'] || record?.['jobMonitoring.name'];
      },
    },
    {
      title: 'Notification reason',
      render: (record) => {
        return camelToTitleCase(record.notification_reason);
      },
      sorter: (a, b) => a.notification_reason.localeCompare(b.notification_reason),
      filters: filters.notificationReasonFilters,
      onFilter: (value, record) => record.notification_reason === value,
    },
    {
      title: 'Notification channel',
      render: (record) => {
        return camelToTitleCase(record.notification_channel);
      },
      filters: filters.notificationChannelFilters,
      onFilter: (value, record) => record.notification_channel === value,
    },
    {
      title: 'status',
      render: (record) => {
        return camelToTitleCase(record.status);
      },
      filters: filters.statusFilters,
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Updated on',
      render: (record) => {
        return formatDateTime(record.updatedAt);
      },
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      defaultSortOrder: 'descend',
    },
    {
      title: 'comment',
      dataIndex: 'comment',
      width: '20%',
      render: (text) => {
        const comment = text ? text : '';
        return (
          <span>
            {comment.slice(0, 65)}
            {comment.length > 65 ? (
              <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: 'px' }}>...</span>
            ) : (
              ''
            )}
            {/* {`${comment.slice(0, 80)}${comment.length > 80 ? ' ...' : ''}`} */}
          </span>
        );
      },
      onClick: () => alert('Howdy'),
    },
  ];

  // Row selection
  const rowSelection = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setSelectedNotificationForBulkAction(selectedRows);
    },
  };

  //JSX
  return (
    <>
      <Table
        align="right"
        pagination={{ pageSize: 14 }}
        size="small"
        columns={columns}
        dataSource={notifications}
        rowKey={(record) => record.id}
        verticalAlign="top"
        rowSelection={rowSelection}
        onRow={(record) => {
          return {
            onClick: () => {
              console.log(record);
              setSelectedNotification(record);
              setViewNotificationDetails(true);
            },
          };
        }}
      />
      <Modal
        title={selectedNotification?.['fileMonitoring.name'] || selectedNotification?.['clusterMonitoring.name'] || ''}
        width={850}
        open={viewNotificationDetails}
        onCancel={() => setViewNotificationDetails(false)}
        maskClosable={false}
        footer={
          <Button type="primary" onClick={() => setViewNotificationDetails(false)}>
            Close
          </Button>
        }>
        <Tabs>
          <Tabs.TabPane tab="Metadata" key="1">
            <Descriptions bordered column={1} size="small">
              {selectedNotificationDetails.map((item) => (
                <Descriptions.Item label={item.key} key={item.key}>
                  {item.value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Notification" key="2">
            <div
              dangerouslySetInnerHTML={{ __html: selectedNotification?.metaData?.notificationBody || '' }}
              className="sentNotificationBody"
            />
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </>
  );
}

export default NotificationsTable;
