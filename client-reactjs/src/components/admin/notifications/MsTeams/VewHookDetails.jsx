import React from 'react';
import { Modal, Descriptions } from 'antd';
import { Constants } from '../../../common/Constants';

function VewHookDetails({ showHooksDetailModal, setShowHooksDetailModal, selectedHook }) {
  return (
    <Modal
      open={showHooksDetailModal}
      maskClosable={false}
      footer={null}
      onCancel={() => setShowHooksDetailModal(false)}>
      {selectedHook && (
        <Descriptions title="Hook Details" bordered column={1} size="small">
          <Descriptions.Item label="Name">{selectedHook.name}</Descriptions.Item>
          <Descriptions.Item label="URL">{selectedHook.url}</Descriptions.Item>
          <Descriptions.Item label="Created By">{selectedHook.createdBy}</Descriptions.Item>
          <Descriptions.Item label="Approval Status">
            {selectedHook.approved ? 'Approved' : 'Not Approved'}
          </Descriptions.Item>
          <Descriptions.Item label="Approved By">{selectedHook.approvedBy}</Descriptions.Item>
          <Descriptions.Item label="Last Modified By">{selectedHook.lastModifiedBy}</Descriptions.Item>
          <Descriptions.Item label="Created On">
            {new Date(selectedHook.createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
              ' @ ' +
              new Date(selectedHook.createdAt).toLocaleTimeString('en-US')}
          </Descriptions.Item>
          <Descriptions.Item label="Last Modified On">
            {new Date(selectedHook.updatedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
              ' @ ' +
              new Date(selectedHook.updatedAt).toLocaleTimeString('en-US')}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}

export default VewHookDetails;
