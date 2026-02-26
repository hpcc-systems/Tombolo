import React, { Dispatch, SetStateAction } from 'react';
import { Table, Tooltip, Popconfirm, Space, Button } from 'antd';
import { handleError } from '@/components/common/handleResponse';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import { DateWithTooltip } from '../../../common/CommonUtil';
import notificationsService from '@/services/notifications.service';

interface Props {
  sentNotifications: any[];
  setSentNotifications: Dispatch<SetStateAction<any[]>>;
  filters?: any;
  selectedNotificationsIds: any[];
  setSelectedNotificationsIds: (ids: any[]) => void;
  setSelectedNotification: (n: any) => void;
  setDisplayNotificationDetailsModal: (v: boolean) => void;
  setDisplayUpdateModal: (v: boolean) => void;
  searchTerm: string;
  monitorings: any[];
  isReader: boolean;
}

const SentNotificationsTable: React.FC<Props> = ({
  sentNotifications,
  setSentNotifications,
  selectedNotificationsIds,
  setSelectedNotificationsIds,
  setSelectedNotification,
  setDisplayNotificationDetailsModal,
  setDisplayUpdateModal,
  searchTerm,
  monitorings,
  isReader,
}) => {
  const rowSelection = {
    selectedNotificationsIds,
    onChange: setSelectedNotificationsIds,
  };

  const viewNotification = (record: any) => {
    setSelectedNotification(record);
    setDisplayNotificationDetailsModal(true);
  };

  const editNotification = (record: any) => {
    setSelectedNotificationsIds([record.id]);
    setDisplayUpdateModal(true);
    setSelectedNotification(record);
  };

  const deleteSingleNotification = async (id: any) => {
    try {
      await notificationsService.deleteNotification(id);
      setSentNotifications(sentNotifications.filter(item => item.id !== id));
    } catch (err) {
      handleError('failed to delete notification. Please try again.');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'searchableNotificationId',
      width: '18%',
      ellipsis: true,
      render: (searchableNotificationId: string) => (
        <Tooltip title={searchableNotificationId}>
          <span
            style={{
              background:
                searchTerm.length > 0 && searchableNotificationId?.toLocaleLowerCase().includes(searchTerm)
                  ? 'var(--highlight)'
                  : 'transparent',
            }}>
            {searchableNotificationId}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Origin',
      dataIndex: 'notificationOrigin',
      width: '10%',
      ellipsis: true,
      render: (notificationOrigin: any) => {
        const originName = monitorings.find(m => m.id === notificationOrigin)?.name || notificationOrigin;
        return <Tooltip title={originName}>{originName}</Tooltip>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: '8%',
      render: (status: string) => <Tooltip title={status}>{status}</Tooltip>,
    },
    {
      title: 'Channel',
      dataIndex: 'notificationChannel',
      width: '9%',
      render: (notificationChannel: string) => <Tooltip title={notificationChannel}>{notificationChannel}</Tooltip>,
    },
    {
      title: 'Title',
      dataIndex: 'notificationTitle',
      width: '30%',
      ellipsis: true,
      render: (notificationTitle: string) => <Tooltip title={notificationTitle}>{notificationTitle}</Tooltip>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      width: '15%',
      render: (createdAt: any) => DateWithTooltip(createdAt),
    },
    {
      title: 'Modified By',
      dataIndex: 'updatedBy',
      width: '15%',
      render: (updatedBy: any) => (
        <Tooltip title={updatedBy?.email}>
          <span
            style={{
              background:
                searchTerm.length > 0 && updatedBy?.name?.toLocaleLowerCase().includes(searchTerm)
                  ? 'var(--highlight)'
                  : 'transparent',
            }}>
            {updatedBy?.name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      width: '10%',
      render: (_: any, record: any) => (
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
          {!isReader && (
            <>
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
            </>
          )}
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
      rowKey={record => record.id}
    />
  );
};

export default SentNotificationsTable;
