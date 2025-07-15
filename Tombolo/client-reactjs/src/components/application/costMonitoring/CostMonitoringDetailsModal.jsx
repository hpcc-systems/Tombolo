import React from 'react';
import { Descriptions, Modal, Button, Tooltip, Tag } from 'antd';

import { Constants } from '../../common/Constants';

function CostMonitoringDetailsModal({
  displayMonitoringDetailsModal,
  setDisplayMonitoringDetailsModal,
  selectedMonitoring,
  setSelectedMonitoring,
  clusters,
}) {
  // When cancel button is clicked, close the modal and reset the selectedMonitoring
  const handleCancel = () => {
    setDisplayMonitoringDetailsModal(false);
    setSelectedMonitoring(null);
  };

  // Destructure the selectedMonitoring object
  if (selectedMonitoring === null) return null; // If selectedMonitoring is null, return null (don't display the modal)

  const {
    monitoringName,
    description,
    createdAt,
    createdBy,
    lastUpdatedBy,
    isActive,
    approvalStatus,
    approvedAt,
    approvedBy,
    metaData,
    clusterIds,
    approverComment,
  } = selectedMonitoring;

  const { notificationMetaData, users, costThreshold, timeWindow } = metaData || {};

  // Get cluster names from cluster IDs
  const getClusterNames = (clusterIds) => {
    if (!clusterIds || clusterIds.length === 0) return 'None';

    return clusterIds.map((clusterId) => {
      const cluster = clusters.find((c) => c.id === clusterId);
      return cluster ? cluster.name : `Unknown (${clusterId})`;
    });
  };

  const clusterNames = getClusterNames(clusterIds);

  return (
    <Modal
      maskClosable={false}
      width={800}
      style={{ maxHeight: '95vh', overflow: 'auto' }}
      closable={true}
      onCancel={handleCancel}
      open={displayMonitoringDetailsModal}
      footer={
        <Button type="primary" onClick={handleCancel}>
          Close
        </Button>
      }>
      <Descriptions
        column={1}
        bordered={true}
        size="small"
        className="cost__monitoring_tiny-description"
        title="Cost Monitoring Details">
        <Descriptions.Item label="Monitoring name" className="tiny-description">
          {monitoringName}
        </Descriptions.Item>

        <Descriptions.Item label="Description">{description || 'No description provided'}</Descriptions.Item>

        <Descriptions.Item label="Clusters">
          {clusterNames.length > 0 ? (
            clusterNames.map((name, index) => (
              <Tag key={index} style={{ marginBottom: '4px' }}>
                {name.includes('Unknown') ? <span style={{ color: 'var(--danger)' }}>{name}</span> : name}
              </Tag>
            ))
          ) : (
            <Tag style={{ color: 'var(--warning)' }}>No clusters assigned</Tag>
          )}
        </Descriptions.Item>

        {/* Cost Monitoring Specific Fields */}
        {users && users.length > 0 && (
          <Descriptions.Item label="Monitored Users">
            {users.map((user, index) => (
              <Tag key={index} style={{ marginBottom: '4px' }}>
                {user}
              </Tag>
            ))}
          </Descriptions.Item>
        )}

        {costThreshold && <Descriptions.Item label="Cost Threshold">${costThreshold}</Descriptions.Item>}

        {timeWindow && <Descriptions.Item label="Time Window">{timeWindow}</Descriptions.Item>}

        {/* Notification Settings */}
        {notificationMetaData &&
          notificationMetaData.notificationCondition &&
          notificationMetaData.notificationCondition.length > 0 && (
            <Descriptions.Item label="Notify when">
              {notificationMetaData.notificationCondition.map((condition, i) => (
                <Tag key={i}>{condition.replace(/([A-Z])/g, ' $1').trim()}</Tag>
              ))}
            </Descriptions.Item>
          )}

        {notificationMetaData?.primaryContacts && notificationMetaData.primaryContacts.length > 0 && (
          <Descriptions.Item label="Primary contact(s)">
            {notificationMetaData.primaryContacts.map((email, index) =>
              index < notificationMetaData.primaryContacts.length - 1 ? (
                <span key={index}>{email}, </span>
              ) : (
                <span key={index}>{email}</span>
              )
            )}
          </Descriptions.Item>
        )}

        {notificationMetaData?.secondaryContacts && notificationMetaData.secondaryContacts.length > 0 && (
          <Descriptions.Item label="Secondary contact(s)">
            {notificationMetaData.secondaryContacts.map((email, index) =>
              index < notificationMetaData.secondaryContacts.length - 1 ? (
                <span key={index}>{email}, </span>
              ) : (
                <span key={index}>{email}</span>
              )
            )}
          </Descriptions.Item>
        )}

        {notificationMetaData?.notifyContacts && notificationMetaData.notifyContacts.length > 0 && (
          <Descriptions.Item label="Notify contact(s)">
            {notificationMetaData.notifyContacts.map((email, index) =>
              index < notificationMetaData.notifyContacts.length - 1 ? (
                <span key={index}>{email}, </span>
              ) : (
                <span key={index}>{email}</span>
              )
            )}
          </Descriptions.Item>
        )}

        {/* Status Information */}
        <Descriptions.Item label="Active">
          {isActive ? (
            <Tag color="var(--success)" key={'yes'}>
              Yes
            </Tag>
          ) : (
            <Tag color="var(--danger)" key={'no'}>
              No
            </Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Approval status">
          <Tag color={approvalStatusTagColors[approvalStatus]} key={approvalStatus}>
            {approvalStatus}
          </Tag>
        </Descriptions.Item>

        {approverComment && <Descriptions.Item label="Approver's comment">{approverComment}</Descriptions.Item>}

        {approvedBy && (
          <Descriptions.Item label="Approved by">
            <Tooltip
              title={
                <>
                  <div>User ID: {approvedBy.id}</div>
                  <div>Email: {approvedBy.email}</div>
                </>
              }>
              <span style={{ color: 'var(--primary)' }}>{approvedBy.name}</span>
            </Tooltip>{' '}
            on {new Date(approvedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Created by">
          <Tooltip
            title={
              <>
                <div>User ID: {createdBy.id}</div>
                <div>Email: {createdBy.email}</div>
              </>
            }>
            <span style={{ color: 'var(--primary)' }}>{createdBy.name}</span>
          </Tooltip>{' '}
          on {new Date(createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
        </Descriptions.Item>

        <Descriptions.Item label="Last updated by">
          <Tooltip
            title={
              <>
                <div>User ID: {lastUpdatedBy.id}</div>
                <div>Email: {lastUpdatedBy.email}</div>
              </>
            }>
            <span style={{ color: 'var(--primary)' }}>{lastUpdatedBy.name}</span>
          </Tooltip>{' '}
          on {new Date(createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default CostMonitoringDetailsModal;

// Approval status tag colors
const approvalStatusTagColors = {
  Approved: 'var(--success)',
  Rejected: 'var(--danger)',
  Pending: 'var(--warning)',
};
