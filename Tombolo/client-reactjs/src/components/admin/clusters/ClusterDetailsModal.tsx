import React from 'react';
import { Modal, Descriptions, Tag, Tooltip } from 'antd';
import { formatDateTime } from '../../common/CommonUtil';
import styles from './clusters.module.css';
import currencyCodeToSymbol from '@/components/common/currencyCodeToSymbol';
import type { ClusterUI } from '@tombolo/shared';

interface ClusterDetailsModalProps {
  displayClusterDetailsModal: boolean;
  setDisplayClusterDetailsModal: (v: boolean) => void;
  selectedCluster: ClusterUI | null;
  setSelectedCluster: (c: ClusterUI | null) => void;
}

const ClusterDetailsModal: React.FC<ClusterDetailsModalProps> = ({
  displayClusterDetailsModal,
  setDisplayClusterDetailsModal,
  selectedCluster,
  setSelectedCluster,
}) => {
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
      <Descriptions column={1} bordered={true} size="small" className={styles.clusters__details_tiny_description}>
        <Descriptions.Item label="Name">{selectedCluster?.name}</Descriptions.Item>
        <Descriptions.Item label="Containerized">{selectedCluster?.containerized ? 'Yes' : 'No'}</Descriptions.Item>
        <Descriptions.Item label="Currency Code">
          {currencyCodeToSymbol(selectedCluster?.currencyCode)} {selectedCluster?.currencyCode}
        </Descriptions.Item>
        <Descriptions.Item label="Thor URL">{`${selectedCluster?.thor_host}:${selectedCluster?.thor_port}`}</Descriptions.Item>
        <Descriptions.Item label="Roxie URL">{`${selectedCluster?.roxie_host}:${selectedCluster?.thor_port}`}</Descriptions.Item>
        {selectedCluster?.username && <Descriptions.Item label="User ID">{selectedCluster.username}</Descriptions.Item>}
        <Descriptions.Item label="Admin E-mails">
          {generateTagsForAdminEmails(selectedCluster?.adminEmails || [])}
        </Descriptions.Item>
        {selectedCluster?.createdBy && (
          <Descriptions.Item label="Added By">
            {generateUserString({ name: selectedCluster.createdBy, email: '' }, selectedCluster.createdAt)}
          </Descriptions.Item>
        )}
        {selectedCluster?.updatedBy && (
          <Descriptions.Item label="Last Updated By">
            {generateUserString({ name: selectedCluster.updatedBy || '', email: '' }, selectedCluster.updatedAt)}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};

export default ClusterDetailsModal;

const generateTagsForAdminEmails = (adminEmails: any[]) => {
  return adminEmails.map((email, index) => <Tag key={index}>{email}</Tag>);
};

const generateUserString = (user: { name?: string; email?: string }, date: string | Date | undefined) => {
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
