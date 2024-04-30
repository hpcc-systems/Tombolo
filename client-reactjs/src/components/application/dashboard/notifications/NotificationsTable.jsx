// Packages
import React from 'react';
import { Table, Tooltip, Popconfirm, Space, Button, message } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

//Local Imports
import { DateWithTooltip } from '../../../common/CommonUtil';
import { deleteNotification } from './notificationUtil';

function SentNotificationsTable({
  sentNotifications,
  setSentNotifications,
  selectedNotificationsIds,
  setSelectedNotificationsIds,
  setSelectedNotification,
  setDisplayNotificationDetailsModal,
  setDisplayUpdateModal,
  searchTerm,
  monitorings,
}) {
  // When row(s) are selected
  const rowSelection = {
    selectedNotificationsIds,
    onChange: setSelectedNotificationsIds,
  };

  // when eye icon is clicked
  const viewNotification = (record) => {
    setSelectedNotification(record);
    setDisplayNotificationDetailsModal(true);
  };

  // When Edit icon is clicked
  const editNotification = (record) => {
    setSelectedNotificationsIds([record.id]);
    setDisplayUpdateModal(true);
  };

  // Delete notification
  const deleteSingleNotification = async (id) => {
    try {
      await deleteNotification(id);
      setSentNotifications(sentNotifications.filter((item) => item.id !== id));
    } catch (err) {
      message.error('failed to delete notification. Please try again.');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'searchableNotificationId',
      width: '18%',
      ellipsis: true,
      render: (searchableNotificationId) => {
        return (
          <Tooltip title={searchableNotificationId}>
            {/* if searchableNotification id to lowercase includes search term highlight it */}
            <span
              style={{
                background:
                  searchTerm.length > 0 && searchableNotificationId.toLocaleLowerCase().includes(searchTerm)
                    ? 'var(--highlight)'
                    : 'transparent',
              }}>
              {searchableNotificationId}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Origin',
      dataIndex: 'notificationOrigin',
      width: '10%',
      ellipsis: true,
      render: (notificationOrigin) => {
        const originName = monitorings.find((m) => m.id === notificationOrigin)?.name || notificationOrigin;
        return <Tooltip title={originName}>{originName}</Tooltip>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '8%',
      render: (status) => {
        return <Tooltip title={status}>{status}</Tooltip>;
      },
    },
    {
      title: 'Channel',
      dataIndex: 'notificationChannel',
      width: '9%',
      render: (notificationChannel) => {
        return <Tooltip title={notificationChannel}>{notificationChannel}</Tooltip>;
      },
    },

    {
      title: 'Title',
      dataIndex: 'notificationTitle',
      width: '30%',
      ellipsis: true,
      render: (notificationTitle) => {
        return <Tooltip title={notificationTitle}>{notificationTitle}</Tooltip>;
      },
    },
    // {
    //   title: 'Recipients',
    //   dataIndex: 'recipients',
    //   width: '10%',
    //   ellipsis: true,
    //   render: (recipients) => (
    //     <Tooltip
    //       title={recipients?.intended.map((recipient, index) => (
    //         <div key={index}>{`${recipient}, `}</div>
    //       ))}>
    //       {recipients?.intended.map((recipient, index) => (
    //         <div key={index}>{`${recipient}, `}</div>
    //       ))}
    //     </Tooltip>
    //   ),
    // },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      width: '15%',
      render: (createdAt) => {
        return DateWithTooltip(createdAt);
      },
    },
    {
      title: 'Modified By',
      dataIndex: 'updatedBy',
      width: '15%',
      render: (updatedBy) => {
        return (
          <Tooltip title={updatedBy?.email}>
            <span
              style={{
                background:
                  searchTerm.length > 0 && updatedBy?.name.toLocaleLowerCase().includes(searchTerm)
                    ? 'var(--highlight)'
                    : 'transparent',
              }}>
              {' '}
              {updatedBy?.name}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      width: '10%',
      render: (text, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              size="small"
              type="link"
              icon={<EyeOutlined />}
              onClick={() => viewNotification(record)}
              disabled={
                selectedNotificationsIds.length > 1 ||
                (selectedNotificationsIds.length == 1 && selectedNotificationsIds[0] !== record.id)
              }
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              type="link"
              icon={<EditOutlined />}
              onClick={() => editNotification(record)}
              disabled={
                selectedNotificationsIds.length > 1 ||
                (selectedNotificationsIds.length == 1 && selectedNotificationsIds[0] !== record.id)
              }
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure delete this notification?"
            onConfirm={() => deleteSingleNotification(record.id)}
            okText="Yes"
            okButtonProps={{ type: 'primary', danger: true }}
            cancelText="No">
            <Tooltip title="Delete">
              <Button
                size="small"
                type="link"
                icon={<DeleteOutlined />}
                disabled={
                  selectedNotificationsIds.length > 1 ||
                  (selectedNotificationsIds.length == 1 && selectedNotificationsIds[0] !== record.id)
                }
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      size="small"
      pagination={{ pageSize: 18 }}
      rowSelection={rowSelection}
      columns={columns}
      dataSource={sentNotifications}
      rowKey={(record) => record.id}
    />
  );
}

export default SentNotificationsTable;
