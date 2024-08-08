/* eslint-disable unused-imports/no-unused-vars */
import React from 'react';
import { Modal, Descriptions, Tag, Tooltip } from 'antd';

import { formatDateTime } from '../../common/CommonUtil';
import './clusters.css';

function ClusterDetailsModal({
  displayClusterDetailsModal,
  setDisplayClusterDetailsModal,
  selectedCluster,
  setSelectedCluster,
}) {
  // Handle cancel
  const handleModalCancel = () => {
    setSelectedCluster(null);
    setDisplayClusterDetailsModal(false);
  };

  return (
    <Modal
      open={displayClusterDetailsModal}
      onCancel={handleModalCancel}
      footer={null}
      maskClosable={false}
      width={800}>
      <Descriptions column={1} bordered={true} size="small" className="clusters__details_tiny-description">
        <Descriptions.Item label="Name">{selectedCluster?.name}</Descriptions.Item>
        <Descriptions.Item label="Thor URL">{`${selectedCluster?.thor_host}:${selectedCluster?.thor_port}`}</Descriptions.Item>
        <Descriptions.Item label="Roxie URL">{`${selectedCluster?.roxie_host}:${selectedCluster?.thor_port}`}</Descriptions.Item>
        {selectedCluster?.username && <Descriptions.Item label="User ID">{selectedCluster.username}</Descriptions.Item>}
        <Descriptions.Item label="Admin E-mails">
          {generateTagsForAdminEmails(selectedCluster?.adminEmails || [])}
        </Descriptions.Item>
        {selectedCluster?.createdBy && (
          <Descriptions.Item label="Added By">
            {generateUserString(selectedCluster.createdBy, selectedCluster.createdAt)}
          </Descriptions.Item>
        )}
        {selectedCluster?.updatedBy && (
          <Descriptions.Item label="Last Updated By">
            {generateUserString(selectedCluster.updatedBy, selectedCluster.updatedAt)}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
}

export default ClusterDetailsModal;

//Generate tags
const generateTagsForAdminEmails = (adminEmails) => {
  return adminEmails.map((email, index) => <Tag key={index}>{email}</Tag>);
};

// Generate createdBy and updatedBy string
const generateUserString = (user, date) => {
  const readableDate = formatDateTime(date);
  return (
    <>
      <Tooltip title={user.email}>
        <span style={{ color: 'var(--primary)' }}>{user.name}</span>
      </Tooltip>
      on {readableDate}
    </>
  );
};
