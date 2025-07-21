// Packages
import React from 'react';
import { Modal, Button, Card } from 'antd';

// Local Imports
import NotificationDetails from './NotificationDetails';

function NotificationDetailsModal({
  displayNotificationDetailsModal,
  setDisplayNotificationDetailsModal,
  selectedNotification,
  setSelectedNotification,
  monitorings,
  domains,
  productCategories,
  setSelectedNotificationsIds,
  setDisplayUpdateModal,
}) {
  // When Edit icon is clicked
  const editNotification = (selectedNotification) => {
    setDisplayNotificationDetailsModal(false);
    setSelectedNotificationsIds([selectedNotification.id]);
    setDisplayUpdateModal(true);
  };

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
      <Card size="small " style={{ marginTop: '20px', padding: '0px' }}>
        <NotificationDetails
          selectedNotification={selectedNotification}
          monitorings={monitorings}
          domains={domains}
          productCategories={productCategories}
        />
      </Card>
    </Modal>
  );
}

export default NotificationDetailsModal;
