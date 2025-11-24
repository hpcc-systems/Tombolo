import React from 'react';
import { Descriptions, Modal, Button, Tooltip, Tag } from 'antd';

import { Constants } from '../Constants';

import styles from './monitoring.module.css';

function MonitoringDetailsModal({
  displayMonitoringDetailsModal,
  setDisplayMonitoringDetailsModal,
  selectedMonitoring,
  setSelectedMonitoring,
  clusters,
  domains,
  productCategories,
  children,
  monitoringTypeName,
}) {
  // When the cancel button is clicked, close the modal and reset the selectedMonitoring
  const handleCancel = () => {
    setDisplayMonitoringDetailsModal(false);
    setSelectedMonitoring(null);
  };

  // Destructure the selectedMonitoring object
  if (selectedMonitoring === null) return null; // If selectedMonitoring is null, return null (don't display the modal)

  const {
    // Used for monitoring types that don't store FK uuid in these fields
    approvedBy,
    createdBy,
    lastUpdatedBy,
    updatedBy,
    approver,
    creator,
    updater,
    monitoringName,
    description,
    createdAt,
    updatedAt,
    isActive,
    approvalStatus,
    approvedAt,
    metaData,
    approverComment,
  } = selectedMonitoring;

  let updatedByVal = lastUpdatedBy ? lastUpdatedBy : updatedBy;

  let clusterIds;
  if (selectedMonitoring.clusterIds) {
    clusterIds = selectedMonitoring.clusterIds;
  } else if (selectedMonitoring.clusterId) {
    clusterIds = [selectedMonitoring.clusterId];
  } else {
    console.error('Unable to handle cluster ID(s) for details modal');
  }

  const fkUuids = creator || approver || updater;

  const { asrSpecificMetaData, notificationMetaData, monitoringData } = metaData || {};

  // Prefer new monitoringData (from orbitProfileMonitoring) but keep fallback to older notificationMetaData
  const effectiveMonitoringData = monitoringData || notificationMetaData || {};

  // Get cluster names from cluster IDs
  const getClusterNames = clusterIds => {
    if (!clusterIds || clusterIds.length === 0) return [];

    // "*" means all clusters
    if (clusterIds[0] === '*') return clusters.map(cluster => cluster.name);

    return clusterIds.map(clusterId => {
      const cluster = clusters.find(c => c.id === clusterId);
      return cluster ? cluster.name : `Unknown (${clusterId})`;
    });
  };

  const clusterNames = getClusterNames(clusterIds);

  const AuditInfo = () => {
    if (fkUuids) {
      return (
        <>
          {approver && (
            <Descriptions.Item label="Approved by">
              <Tooltip title={<div>Email: {approver.email}</div>}>
                <span style={{ color: 'var(--primary)' }}>{`${approver.firstName} ${approver.lastName}`}</span>
              </Tooltip>{' '}
              on {new Date(approvedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
            </Descriptions.Item>
          )}

          <Descriptions.Item label="Created by">
            <Tooltip title={<div>Email: {creator.email}</div>}>
              <span style={{ color: 'var(--primary)' }}>{`${creator.firstName} ${creator.lastName}`}</span>
            </Tooltip>{' '}
            on {new Date(createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
          </Descriptions.Item>

          {updater && (
            <Descriptions.Item label="Last updated by">
              <Tooltip title={<div>Email: {updater.email}</div>}>
                <span style={{ color: 'var(--primary)' }}>{`${updater.firstName} ${updater.lastName}`}</span>
              </Tooltip>{' '}
              on {new Date(updatedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
            </Descriptions.Item>
          )}
        </>
      );
    }

    const updatedByObj = JSON.parse(updatedByVal || '{}');
    const createdByObj = JSON.parse(createdBy || '{}');
    const approvedByObj = approvedBy ? JSON.parse(approvedBy || '{}') : null;

    return (
      <>
        {approvedByObj && (
          <Descriptions.Item label="Approved by">
            <Tooltip title={<div>Email: {approvedByObj.email}</div>}>
              <span style={{ color: 'var(--primary)' }}>{approvedByObj.name}</span>
            </Tooltip>{' '}
            on {new Date(approvedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Created by">
          <Tooltip title={<div>Email: {createdByObj.email}</div>}>
            <span style={{ color: 'var(--primary)' }}>{createdByObj.name}</span>
          </Tooltip>{' '}
          on {new Date(createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
        </Descriptions.Item>

        <Descriptions.Item label="Last updated by">
          <Tooltip title={<div>Email: {updatedByObj.email}</div>}>
            <span style={{ color: 'var(--primary)' }}>{updatedByObj.name}</span>
          </Tooltip>{' '}
          on {new Date(updatedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
        </Descriptions.Item>
      </>
    );
  };

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
        className={styles.monitoring_tiny_description}
        title={`${monitoringTypeName} Details`}>
        <Descriptions.Item label="Monitoring name" className="tiny-description">
          {monitoringName}
        </Descriptions.Item>

        <Descriptions.Item label="Description">{description || 'No description provided'}</Descriptions.Item>

        <Descriptions.Item label="Cluster(s)">
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

        {/* CUSTOM MONITORING DETAILS (children) */}
        {children}

        {/* ASR Specific metadata */}
        {asrSpecificMetaData?.jobMonitorType && (
          <Descriptions.Item label="Job Monitoring Type">{asrSpecificMetaData.jobMonitorType}</Descriptions.Item>
        )}

        {asrSpecificMetaData?.domain && (
          <Descriptions.Item label="Domain">
            {domains.filter(d => d.value === asrSpecificMetaData.domain)[0]?.label || (
              <Tag color="red"> Deleted domain</Tag>
            )}
          </Descriptions.Item>
        )}

        {asrSpecificMetaData?.productCategory && (
          <Descriptions.Item label="Product category">
            {productCategories.filter(c => c.value === asrSpecificMetaData.productCategory)[0]?.label || (
              <Tag color="red"> Deleted product</Tag>
            )}
          </Descriptions.Item>
        )}

        {asrSpecificMetaData?.severity !== undefined && asrSpecificMetaData?.severity !== null && (
          <Descriptions.Item label="Severity">{asrSpecificMetaData.severity}</Descriptions.Item>
        )}

        {/* Notification Settings (new monitoringData preferred, fallback to notificationMetaData) */}
        {effectiveMonitoringData?.notificationConditions &&
          effectiveMonitoringData.notificationConditions.length > 0 && (
            <Descriptions.Item label="Notify when">
              {effectiveMonitoringData.notificationConditions.map((condition, i) => {
                const label =
                  condition === 'updateInterval'
                    ? 'Build not following correct interval'
                    : condition === 'buildStatus'
                      ? 'Build status'
                      : condition;
                return (
                  <Tag key={i} style={{ marginBottom: '4px' }}>
                    {label}
                  </Tag>
                );
              })}
            </Descriptions.Item>
          )}

        {effectiveMonitoringData?.buildStatus && effectiveMonitoringData.buildStatus.length > 0 && (
          <Descriptions.Item label="Build status(es)">
            {effectiveMonitoringData.buildStatus.map((s, i) => (
              <Tag key={`bs-${i}`} style={{ marginBottom: '4px' }}>
                {s}
              </Tag>
            ))}
          </Descriptions.Item>
        )}

        {(effectiveMonitoringData?.updateInterval || effectiveMonitoringData?.updateInterval === 0) && (
          <Descriptions.Item label="Update Interval (days)">{effectiveMonitoringData.updateInterval}</Descriptions.Item>
        )}

        {effectiveMonitoringData?.updateIntervalDays && effectiveMonitoringData.updateIntervalDays.length > 0 && (
          <Descriptions.Item label="Update Interval Days">
            {effectiveMonitoringData.updateIntervalDays.map((d, i) => (
              <Tag key={`uid-${i}`} style={{ marginBottom: '4px' }}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </Tag>
            ))}
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

        {AuditInfo()}
      </Descriptions>
    </Modal>
  );
}

export default MonitoringDetailsModal;

// Approval status tag colors
const approvalStatusTagColors = {
  Approved: 'var(--success)',
  Rejected: 'var(--danger)',
  Pending: 'var(--warning)',
};
