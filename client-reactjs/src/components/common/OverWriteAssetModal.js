import { Alert, Button, Modal } from 'antd';
import React from 'react';

const OverwriteAssetModal = ({ show, incomingName, existingName, acceptExisting, acceptIncoming, cancel }) => {
  return (
    <Modal
      destroyOnClose
      visible={show}
      title="Asset already exists"
      closable={false}
      footer={[
        <Button key="existing" type="primary" onClick={acceptExisting}>
          Accept existing
        </Button>,
        <Button key="incoming" onClick={acceptIncoming}>
          Accept incoming
        </Button>,
        <Button key="cancel" onClick={cancel}>
          Cancel
        </Button>,
      ]}>
      <Alert
        showIcon
        type="warning"
        message="Asset Settings conflict"
        description={
          <>
            <ul>
              <li>Incoming Asset: {incomingName}</li>
              <li>Existing Asset: {existingName}</li>
            </ul>
            <p>Asset settings will be overwritten, please select which settings to accept?</p>
          </>
        }
      />
    </Modal>
  );
};

export default OverwriteAssetModal;
