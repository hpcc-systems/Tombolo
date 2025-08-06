/* eslint-disable  */
import React, { useEffect, useState } from 'react';
import { Descriptions, Modal, Button, Tooltip, Tag } from 'antd';
import { formatDateTimeShort } from '../../common/CommonUtil';

import _ from 'lodash';

function ViewDetailsModal({
  clusterMonitoring,
  setDisplayViewDetailsModal,
  selectedMonitoring,
  setSelectedMonitoring,
  domains,
  productCategories,
}) {
  // When cancel button is clicked, close the modal and reset the selectedMonitoring
  const handleCancel = () => {
    setDisplayViewDetailsModal(false);
    setSelectedMonitoring(null);
  };

  // Monitoring Types
  const monitoringTypes = {
    spaceUsage: 'Space Usage Monitoring',
    fileMovement: 'File Movement Monitoring',
    fileCount: 'File Count Monitoring',
  };

  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState(null);

  useEffect(() => {
    if (!selectedMonitoring) return;
    if (selectedMonitoring['metaData.asrSpecificMetaData.domain']) {
      const d = domains.find((domain) => domain.value === selectedMonitoring['metaData.asrSpecificMetaData.domain']);
      setSelectedDomain(d);
    }
    if (selectedMonitoring['metaData.asrSpecificMetaData.productCategory']) {
      const pc = productCategories.find(
        (productCategory) =>
          productCategory.value === selectedMonitoring['metaData.asrSpecificMetaData.productCategory']
      );
      setSelectedProductCategory(pc);
    }
  }, [selectedMonitoring]);

  return (
    <Modal
      maskClosable={false}
      width={800}
      style={{ maxHeight: '95vh', overflow: 'auto' }}
      closable={true}
      onCancel={handleCancel}
      open={true}
      footer={
        <Button type="primary" onClick={handleCancel}>
          Close
        </Button>
      }>
      <Descriptions column={1} bordered={true} size="small" className="tiny-description">
        <Descriptions.Item label="Monitoring Name">{selectedMonitoring.monitoringName}</Descriptions.Item>
        <Descriptions.Item label="Monitoring Type">{selectedMonitoring.description}</Descriptions.Item>
        <Descriptions.Item label="Monitoring Description">
          <Tooltip title={`${selectedMonitoring.cluster.thor_host}:${selectedMonitoring.cluster.thor_port}`}>
            {selectedMonitoring.cluster.name}
          </Tooltip>
        </Descriptions.Item>
        {selectedMonitoring.clusterMonitoringType && (
          <Descriptions.Item label="Monitoring Type">
            {selectedMonitoring.clusterMonitoringType.map((type) => (
              <Tag key={type} color="var(--primary)">
                {_.capitalize(type)}
              </Tag>
            ))}
          </Descriptions.Item>
        )}
        {/* Approval Status -> approvalStatus, if approved green tag */}
        <Descriptions.Item label="Approval Status">
          <Tag color={approvalStatusTagColors[selectedMonitoring.approvalStatus]}>
            {_.capitalize(selectedMonitoring.approvalStatus)}
          </Tag>
        </Descriptions.Item>
        {/* Approval Active yes|no  -> isActive . tag green  for Yes */}
        <Descriptions.Item label="Approval Active">
          <Tag color={selectedMonitoring.isActive ? 'var(--success)' : 'var(--danger)'}>
            {selectedMonitoring.isActive ? 'Yes' : 'No'}
          </Tag>
        </Descriptions.Item>
        {
          /* if approverComments available show it */
          selectedMonitoring.approverComments && (
            <Descriptions.Item label="Approver Comments">{selectedMonitoring.approverComments}</Descriptions.Item>
          )
        }
        {/* Created By -> createdBy. creator.firstName + creator.lastName, ttol tip creator.email, add time stamp like this  */}
        <Descriptions.Item label="Created By">
          <Tooltip title={selectedMonitoring.creator.email}>
            {selectedMonitoring.creator.firstName} {selectedMonitoring.creator.lastName} on{' '}
            <span style={{ color: 'var(--primary)' }}>{formatDateTimeShort(selectedMonitoring.createdAt)}</span>
          </Tooltip>
        </Descriptions.Item>
        {/* Updated By -> updatedBy. updater.firstName + updater.lastName, ttol tip updater.email , first check if its avilable*/}
        {selectedMonitoring.updater && (
          <Descriptions.Item label="Updated By">
            <Tooltip title={selectedMonitoring.updater.email}>
              {selectedMonitoring.updater.firstName} {selectedMonitoring.updater.lastName} on{' '}
              <span style={{ color: 'var(--primary)' }}>{formatDateTimeShort(selectedMonitoring.updatedAt)}</span>
            </Tooltip>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
}

export default ViewDetailsModal;

const approvalStatusTagColors = {
  approved: 'var(--success)',
  rejected: 'var(--danger)',
  pending: 'var(--warning)',
};
