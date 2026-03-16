import React from 'react';
import { Modal } from 'antd';

const NotificationChartModal: React.FC<any> = ({ visible, onClose }: any) => (
  <Modal visible={visible} onCancel={onClose} footer={null}>
    <div>Notification chart</div>
  </Modal>
);

export default NotificationChartModal;
