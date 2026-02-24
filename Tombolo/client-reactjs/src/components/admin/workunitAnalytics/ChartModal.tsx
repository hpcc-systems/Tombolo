import React from 'react';
import { Modal } from 'antd';

const ChartModal: React.FC<any> = ({ visible, onClose }: any) => {
  return (
    <Modal visible={visible} onCancel={onClose} footer={null}>
      <div>Chart placeholder</div>
    </Modal>
  );
};

export default ChartModal;
