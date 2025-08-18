import React, { useEffect, useState } from 'react';
import { Descriptions, Modal, Button, Tooltip, Tag } from 'antd';
import { formatDateTimeShort } from '../../common/CommonUtil';

import _ from 'lodash';

function ViewDetailsModal({
  setDisplayViewDetailsModal,
  selectedMonitoring,
  setSelectedMonitoring,
  domains = [],
  productCategories = [],
}) {
  // When cancel button is clicked, close the modal and reset the selectedMonitoring
  const handleCancel = () => {
    setDisplayViewDetailsModal(false);
    setSelectedMonitoring(null);
  };

  // Monitoring Types
  const monitoringTypes = {
    status: 'Cluster Status',
    usage: 'Cluster Usage',
  };

  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState(null);

  useEffect(() => {
    if (!selectedMonitoring) return;
    if (selectedMonitoring?.metaData?.asrSpecificMetaData?.domain) {
      const d = domains.find((domain) => domain.value === selectedMonitoring.metaData.asrSpecificMetaData.domain);

      setSelectedDomain(d);
    }
    if (selectedMonitoring?.metaData.asrSpecificMetaData?.productCategory) {
      const pc = productCategories.find(
        (productCategory) => productCategory.value === selectedMonitoring.metaData.asrSpecificMetaData.productCategory
      );

      setSelectedProductCategory(pc);
    }
  }, [selectedMonitoring, selectedDomain]);

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
        <Descriptions.Item label={<b>Monitoring Name</b>} className="cluster__monitoring_tiny-description">
          {selectedMonitoring.monitoringName}
        </Descriptions.Item>
        <Descriptions.Item label={<b>Monitoring Type</b>}>{selectedMonitoring.description}</Descriptions.Item>
        <Descriptions.Item label={<b>Monitoring Description</b>}>
          <Tooltip title={`${selectedMonitoring.cluster.thor_host}:${selectedMonitoring.cluster.thor_port}`}>
            {selectedMonitoring.cluster.name}
          </Tooltip>
        </Descriptions.Item>
        {/* ASR Specific Meta Data */}
        {selectedDomain && <Descriptions.Item label={<b>Domain</b>}>{selectedDomain.label}</Descriptions.Item>}
        {selectedProductCategory && (
          <Descriptions.Item label={<b>Product Category</b>}>{selectedProductCategory.label}</Descriptions.Item>
        )}
        {selectedMonitoring.metaData?.asrSpecificMetaData?.severity && (
          <Descriptions.Item label={<b>Severity</b>}>
            {selectedMonitoring.metaData.asrSpecificMetaData.severity}
          </Descriptions.Item>
        )}
        {selectedMonitoring.clusterMonitoringType && (
          <Descriptions.Item label={<b>Monitoring Type</b>}>
            {selectedMonitoring.clusterMonitoringType.map((type) => (
              <Tag key={type} color="var(--primary)">
                {monitoringTypes[type]}
              </Tag>
            ))}
          </Descriptions.Item>
        )}
        <Descriptions.Item label={<b>Approval Status</b>}>
          {selectedMonitoring.approvalStatus === 'pending' ? (
            <Tag color={approvalStatusTagColors[selectedMonitoring.approvalStatus]}> Pending </Tag>
          ) : (
            <>
              <Tag color={approvalStatusTagColors[selectedMonitoring.approvalStatus]}>
                {_.capitalize(selectedMonitoring.approvalStatus)}
              </Tag>{' '}
              {`by ${selectedMonitoring.approver.firstName}
              ${selectedMonitoring.approver.lastName} on ${formatDateTimeShort(selectedMonitoring.approvedAt)}`}
            </>
          )}
        </Descriptions.Item>
        {selectedMonitoring.approverComment && (
          <Descriptions.Item label={<b>Approver Comment</b>}>{selectedMonitoring.approverComment}</Descriptions.Item>
        )}

        <Descriptions.Item label={<b>Active</b>}>
          <Tag color={selectedMonitoring.isActive ? 'var(--success)' : 'var(--danger)'}>
            {selectedMonitoring.isActive ? 'Yes' : 'No'}
          </Tag>
        </Descriptions.Item>
        {selectedMonitoring.approverComments && (
          <Descriptions.Item label={<b>Approver Comments</b>}>{selectedMonitoring.approverComments}</Descriptions.Item>
        )}
        {/* Created By -> createdBy. creator.firstName + creator.lastName, ttol tip creator.email, add time stamp like this  */}
        <Descriptions.Item label={<b>Created By</b>}>
          <Tooltip title={selectedMonitoring.creator.email}>
            {selectedMonitoring.creator.firstName} {selectedMonitoring.creator.lastName} on{' '}
            <span style={{ color: 'var(--primary)' }}>{formatDateTimeShort(selectedMonitoring.createdAt)}</span>
          </Tooltip>
        </Descriptions.Item>
        {selectedMonitoring.updater && (
          <Descriptions.Item label={<b>Updated By</b>}>
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
