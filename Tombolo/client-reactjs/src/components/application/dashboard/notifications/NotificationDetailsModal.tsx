import React from 'react';
import { Modal, Button, Card } from 'antd';

import NotificationDetails from './NotificationDetails';

interface Props {
  displayNotificationDetailsModal: boolean;
  setDisplayNotificationDetailsModal: (v: boolean) => void;
  selectedNotification: any;
  setSelectedNotification: (n: any) => void;
  monitorings: any[];
  domains: any[];
  productCategories: any[];
  setSelectedNotificationsIds: (ids: any[]) => void;
  setDisplayUpdateModal: (v: boolean) => void;
}

const NotificationDetailsModal: React.FC<Props> = ({
  displayNotificationDetailsModal,
  setDisplayNotificationDetailsModal,
  selectedNotification,
  setSelectedNotification,
  monitorings,
  domains,
  productCategories,
  setSelectedNotificationsIds,
  setDisplayUpdateModal,
}) => {
  const editNotification = (selectedNotification: any) => {
    setDisplayNotificationDetailsModal(false);
    setSelectedNotificationsIds([selectedNotification.id]);
    setDisplayUpdateModal(true);
  };

  const handleCancel = () => {
    setDisplayNotificationDetailsModal(false);
    setSelectedNotification(null);
  };

  return (
    <Modal
      open={displayNotificationDetailsModal}
      onCancel={handleCancel}
      width={1280}
      maskClosable={false}
      footer={[
        <Button key="1" size="small" type="primary" onClick={() => editNotification(selectedNotification)}>
          Edit
        </Button>,
        <Button key="2" size="small" type="primary" ghost onClick={handleCancel}>
          Close
        </Button>,
      ]}>
      <Card size="small" style={{ marginTop: '20px', padding: '0px' }}>
        <NotificationDetails selectedNotification={selectedNotification} />
      </Card>
    </Modal>
  );
};

export default NotificationDetailsModal;
