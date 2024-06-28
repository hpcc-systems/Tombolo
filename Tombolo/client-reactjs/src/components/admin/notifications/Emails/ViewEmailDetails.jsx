import React from 'react';
import { Modal, Descriptions, Tooltip } from 'antd';
import { Constants } from '../../../common/Constants';

function VewGroupDetails({ showGroupsDetailModal, setShowGroupsDetailModal, selectedGroup }) {
  return (
    <Modal
      open={showGroupsDetailModal}
      width={800}
      maskClosable={false}
      footer={null}
      onCancel={() => setShowGroupsDetailModal(false)}>
      {selectedGroup && (
        <Descriptions title="Email Details" bordered column={1} size="small">
          <Descriptions.Item label="Name">{selectedGroup.name}</Descriptions.Item>
          <Descriptions.Item label="Emails">
            <Tooltip title={selectedGroup.emails.emails}>
              {selectedGroup.emails.emails.map((email) => (
                <span key={email}>{email}, </span>
              ))}
            </Tooltip>
          </Descriptions.Item>
          <Descriptions.Item label="Created By">{selectedGroup.createdBy}</Descriptions.Item>
          <Descriptions.Item label="Approval Status">
            {selectedGroup.approved ? 'Approved' : 'Not Approved'}
          </Descriptions.Item>
          <Descriptions.Item label="Approved By">{selectedGroup.approvedBy}</Descriptions.Item>
          <Descriptions.Item label="Last Modified By">{selectedGroup.lastModifiedBy}</Descriptions.Item>
          <Descriptions.Item label="Created On">
            {new Date(selectedGroup.createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
              ' @ ' +
              new Date(selectedGroup.createdAt).toLocaleTimeString('en-US')}
          </Descriptions.Item>
          <Descriptions.Item label="Last Modified On">
            {new Date(selectedGroup.updatedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
              ' @ ' +
              new Date(selectedGroup.updatedAt).toLocaleTimeString('en-US')}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}

export default VewGroupDetails;
