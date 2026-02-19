import React, { useEffect, useState } from 'react';
import { Descriptions, Modal, Button, Tooltip, Tag } from 'antd';
import { formatDateTimeShort } from '../../common/CommonUtil';
import { APPROVAL_STATUS } from '@/components/common/Constants';

interface Props {
  displayViewDetailsModal: boolean;
  setDisplayViewDetailsModal: (v: boolean) => void;
  selectedMonitoring: any | null;
  setSelectedMonitoring: (m: any | null) => void;
  domains: any[];
  productCategories: any[];
}

const approvalStatusTagColors: Record<string, string> = {
  approved: 'var(--success)',
  rejected: 'var(--danger)',
  pending: 'var(--warning)',
};

function ViewDetailsModal({
  displayViewDetailsModal,
  setDisplayViewDetailsModal,
  selectedMonitoring,
  setSelectedMonitoring,
  domains,
  productCategories,
}: Props) {
  const handleCancel = () => {
    setDisplayViewDetailsModal(false);
    setSelectedMonitoring(null);
  };

  const monitoringTypes: Record<string, string> = {
    spaceUsage: 'Space Usage Monitoring',
    fileMovement: 'File Movement Monitoring',
    fileCount: 'File Count Monitoring',
  };

  const [selectedDomain, setSelectedDomain] = useState<any | null>(null);
  const [selectedProductCategory, setSelectedProductCategory] = useState<any | null>(null);
  useEffect(() => {
    if (!selectedMonitoring) return;
    if (selectedMonitoring['metaData.asrSpecificMetaData.domain']) {
      const d = domains.find(domain => domain.value === selectedMonitoring['metaData.asrSpecificMetaData.domain']);
      setSelectedDomain(d);
    }
    if (selectedMonitoring['metaData.asrSpecificMetaData.productCategory']) {
      const pc = productCategories.find(
        productCategory => productCategory.value === selectedMonitoring['metaData.asrSpecificMetaData.productCategory']
      );
      setSelectedProductCategory(pc);
    }
  }, [selectedMonitoring]);

  if (selectedMonitoring === null) return null;
  const { monitoringName, description, lzMonitoringType, isActive, approvalStatus, approverComment } =
    selectedMonitoring;
  return (
    <Modal
      maskClosable={false}
      width={800}
      style={{ maxHeight: '95vh', overflow: 'auto' }}
      closable={true}
      onCancel={handleCancel}
      open={displayViewDetailsModal}
      footer={
        <Button type="primary" onClick={handleCancel}>
          Close
        </Button>
      }>
      <Descriptions column={1} bordered={true} size="small" className="tiny-description">
        <Descriptions.Item label="Monitoring Type ">{monitoringTypes[lzMonitoringType]}</Descriptions.Item>
        <Descriptions.Item label="Monitoring name ">{monitoringName}</Descriptions.Item>
        <Descriptions.Item label="Description ">{description}</Descriptions.Item>
        <Descriptions.Item label="Cluster ">
          <Tooltip title={`${selectedMonitoring['cluster.thor_host']}:${selectedMonitoring['cluster.thor_port']}`}>
            <span style={{ color: 'var(--primary)' }}>{selectedMonitoring['cluster.name']}</span>
          </Tooltip>
        </Descriptions.Item>
        <Descriptions.Item label="Landing Zone ">
          {selectedMonitoring['metaData.monitoringData.dropzone']}
        </Descriptions.Item>
        {selectedMonitoring['metaData.monitoringData.machine'] && (
          <Descriptions.Item label="Machine ">
            {selectedMonitoring['metaData.monitoringData.machine']}
          </Descriptions.Item>
        )}
        {selectedMonitoring['metaData.monitoringData.directory'] && (
          <Descriptions.Item label="Directory ">
            {selectedMonitoring['metaData.monitoringData.directory']}
          </Descriptions.Item>
        )}
        {selectedMonitoring['metaData.monitoringData.fileName'] && (
          <Descriptions.Item label="File ">{selectedMonitoring['metaData.monitoringData.fileName']}</Descriptions.Item>
        )}
        {selectedMonitoring['metaData.monitoringData.threshold'] && (
          <Descriptions.Item label="Threshold in Minutes ">
            {selectedMonitoring['metaData.monitoringData.threshold']}
          </Descriptions.Item>
        )}
        {selectedMonitoring['metaData.monitoringData.maxDepth'] && (
          <Descriptions.Item label="Max Depth ">
            {selectedMonitoring['metaData.monitoringData.maxDepth']}
          </Descriptions.Item>
        )}
        {selectedDomain && <Descriptions.Item label="Domain ">{selectedDomain.label}</Descriptions.Item>}
        {selectedProductCategory && (
          <Descriptions.Item label="Product Category ">{selectedProductCategory.label}</Descriptions.Item>
        )}
        {selectedMonitoring['metaData.asrSpecificMetaData.severity'] && (
          <Descriptions.Item label="Severity ">
            {selectedMonitoring['metaData.asrSpecificMetaData.severity']}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Active ">
          <Tag color={isActive ? 'var(--success)' : 'var(--danger)'}>{isActive ? 'Yes' : 'No'}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Approval Status ">
          <Tag color={approvalStatusTagColors[approvalStatus]}>{approvalStatus}</Tag>
          {approvalStatus !== APPROVAL_STATUS.PENDING && (
            <span style={{ color: 'var(--primary)' }}>
              by {selectedMonitoring['approver.firstName'] || ''} {selectedMonitoring['approver.lastName'] || ''} on{' '}
              <span style={{ color: 'var(--primary)' }}>{formatDateTimeShort(selectedMonitoring.approvedAt)}</span>
            </span>
          )}
        </Descriptions.Item>

        {selectedMonitoring['metaData.contacts.primaryContacts'] && (
          <Descriptions.Item label="Primary Contact ">
            {selectedMonitoring['metaData.contacts.primaryContacts'].join(', ')}
          </Descriptions.Item>
        )}

        {selectedMonitoring['metaData.contacts.secondaryContacts'] &&
          selectedMonitoring['metaData.contacts.secondaryContacts'].length > 0 && (
            <Descriptions.Item label="Secondary Contact ">
              {selectedMonitoring['metaData.contacts.secondaryContacts'].join(', ')}
            </Descriptions.Item>
          )}

        {selectedMonitoring['metaData.contacts.notifyContacts'] &&
          selectedMonitoring['metaData.contacts.notifyContacts'] > 0 && (
            <Descriptions.Item label="Notify Contacts ">
              {selectedMonitoring['metaData.contacts.notifyContacts'].join(', ')}
            </Descriptions.Item>
          )}
        {approverComment && (
          <Descriptions.Item label="Approver Comment " span={2}>
            {approverComment}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Created By ">
          {selectedMonitoring['creator.firstName'] || ''} {selectedMonitoring['creator.lastName'] || ''} on{' '}
          <span style={{ color: 'var(--primary)' }}>{formatDateTimeShort(selectedMonitoring.createdAt)}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Updated By ">
          {selectedMonitoring['updater.firstName'] || ''} {selectedMonitoring['updater.lastName'] || ''} on{' '}
          <span style={{ color: 'var(--primary)' }}>{formatDateTimeShort(selectedMonitoring.updatedAt)}</span>
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default ViewDetailsModal;
