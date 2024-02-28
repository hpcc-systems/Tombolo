// Packages
import React from 'react';
import { Modal, Button } from 'antd';

// Local Imports
import NotificationDetails from './NotificationDetails';

function NotificationDetailsModal({
  displayNotificationDetailsModal,
  setDisplayNotificationDetailsModal,
  selectedNotification,
  setSelectedNotification,
}) {
  //Close Modal
  const handleCancel = () => {
    setDisplayNotificationDetailsModal(false);
    setSelectedNotification(null);
  };
  // JSX
  return (
    <Modal
      open={displayNotificationDetailsModal}
      onCancel={handleCancel}
      size="small"
      width="800px"
      maskClosable={false}
      footer={
        <Button size="small" type="primary" onClick={handleCancel}>
          Close
        </Button>
      }>
      <NotificationDetails selectedNotification={selectedNotification} />
    </Modal>
  );
}

export default NotificationDetailsModal;
