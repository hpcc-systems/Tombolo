import React from 'react';
import { Descriptions, Modal, Button, Tooltip, Tag } from 'antd';
import cronstrue from 'cronstrue';
import _ from 'lodash';

import { Constants } from '../../common/Constants';
import { getDayLabel, getMonthLabel, getDateLabel, getWeekLabel } from '../../common/scheduleOptions.js';

function MonitoringDetailsModal({
  displayMonitoringDetailsModal,
  setDisplayMonitoringDetailsModal,
  selectedMonitoring,
  setSelectedMonitoring,
  clusters,
  domains,
  productCategories,
}) {
  // When cancel button is clicked, close the modal and reset the selectedMonitoring
  const handleCancel = () => {
    setDisplayMonitoringDetailsModal(false);
    setSelectedMonitoring(null);
  };

  //Destructure the selectedMonitoring object
  if (selectedMonitoring === null) return null; // If selectedMonitoring is null, return null (don't display the modal)
  const {
    monitoringName,
    description,
    monitoringScope,
    jobName,
    createdAt,
    createdBy,
    lastUpdatedBy,
    isActive,
    approvalStatus,
    approvedAt,
    approvedBy,
    metaData,
    clusterId,
    approverComment,
  } = selectedMonitoring;
  const { requireComplete } = metaData;
  const { asrSpecificMetaData, notificationMetaData, schedule } = metaData;
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
      <Descriptions column={1} bordered={true} size="small" className="job__monitoring_tiny-description">
        <Descriptions.Item label="Monitoring name " className="tiny-description">
          {monitoringName}
        </Descriptions.Item>
        <Descriptions.Item label="Description">{description}</Descriptions.Item>
        <Descriptions.Item label="Cluster">
          {clusters.find((c) => c.id === clusterId)?.name || (
            <Tag style={{ color: 'var(--danger)' }}>Deleted cluster</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Monitoring scope">
          {monitoringScope.replace(/([A-Z])/g, ' $1').trim()}
        </Descriptions.Item>
        {monitoringScope !== 'ClusterWideMonitoring' && (
          <Descriptions.Item label="Job name / pattern">{jobName}</Descriptions.Item>
        )}
        {schedule && <Descriptions.Item label="Frequency">{_.capitalize(schedule[0].frequency)}</Descriptions.Item>}
        {schedule && schedule.length > 0 && (
          <Descriptions.Item label="Job Schedule">
            {generateTagsForSchedule(schedule).map((s, i) => (
              <Tag key={i}>{s}</Tag>
            ))}
          </Descriptions.Item>
        )}

        {metaData?.expectedStartTime && (
          <Descriptions.Item label="Expected Start Time">{metaData.expectedStartTime}</Descriptions.Item>
        )}
        {metaData?.expectedCompletionTime && (
          <Descriptions.Item label="Expected Completion Time">{metaData.expectedCompletionTime}</Descriptions.Item>
        )}
        <Descriptions.Item label="Require complete">{requireComplete ? 'Yes' : 'No'}</Descriptions.Item>
        {/* ----------------- ASR SPECIFIC ------------------------------------------------------- */}
        {asrSpecificMetaData?.jobMonitorType && (
          <Descriptions.Item label="Job Monitoring Type">{asrSpecificMetaData.jobMonitorType}</Descriptions.Item>
        )}
        {asrSpecificMetaData?.domain && (
          <Descriptions.Item label="Domain">
            {domains.filter((d) => d.value === asrSpecificMetaData.domain)[0]?.label || (
              <Tag color="red"> Deleted domain</Tag>
            )}
          </Descriptions.Item>
        )}
        {asrSpecificMetaData?.productCategory && (
          <Descriptions.Item label="Product category">
            {productCategories.filter((c) => c.value === asrSpecificMetaData.productCategory)[0]?.label || (
              <Tag color="red"> Deleted product</Tag>
            )}
          </Descriptions.Item>
        )}
        {asrSpecificMetaData?.severity !== undefined && asrSpecificMetaData?.severity !== null && (
          <Descriptions.Item label="Severity">{asrSpecificMetaData.severity}</Descriptions.Item>
        )}
        {/* ---------NOTIFICATION TRIGGERS AND CONTACTS --------------------------------------------- */}
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
                <span key={index}>{email},</span>
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
                <span key={index}>{email},</span>
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
                <span key={index}>{email},</span>
              ) : (
                <span key={index}>{email}</span>
              )
            )}
          </Descriptions.Item>
        )}
        {/* ---------------------------------------------------------------------------------------- */}
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
                  <div>User ID : {JSON.parse(approvedBy).id}</div>
                  <div>Email : {JSON.parse(approvedBy).email}</div>
                </>
              }>
              <span style={{ color: 'var(--primary)' }}>{JSON.parse(approvedBy).name}</span>
            </Tooltip>
            on {new Date(approvedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Created by">
          <Tooltip
            title={
              <>
                <div>User ID : {JSON.parse(createdBy).id}</div>
                <div>Email : {JSON.parse(createdBy).email}</div>
              </>
            }>
            <span style={{ color: 'var(--primary)' }}>{JSON.parse(createdBy).name} </span>
          </Tooltip>
          on {new Date(createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
        </Descriptions.Item>
        <Descriptions.Item label="Last updated by">
          <Tooltip
            title={
              <>
                <div>User ID : {JSON.parse(lastUpdatedBy).id}</div>
                <div>Email : {JSON.parse(lastUpdatedBy).email}</div>
              </>
            }>
            <span style={{ color: 'var(--primary)' }}>{JSON.parse(lastUpdatedBy).name} </span>
          </Tooltip>
          on {new Date(createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default MonitoringDetailsModal;

// Interpret run window
const interpretRunWindow = (schedule) => {
  const runWindow = schedule[0].runWindow || '';
  if (runWindow === '') {
    return '';
  } else if (runWindow === 'daily') return 'Anytime';
  else {
    return _.capitalize(runWindow);
  }
};

//Generate tags for schedule
const generateTagsForSchedule = (schedule) => {
  const tags = [];
  schedule.forEach((s) => {
    if (s.frequency === 'daily') {
      tags.push(interpretRunWindow(schedule));
    }
    if (s.frequency === 'weekly') {
      let tempData = `Every Week ${interpretRunWindow(schedule)} on`;
      s.days.forEach((d, i) => {
        tempData += ` ${getDayLabel(d)} ${i < s.days.length - 1 ? ',' : ''}`;
      });
      tags.push(tempData);
    }
    if (s.scheduleBy === 'dates') {
      let tempData = `Every month ${interpretRunWindow(schedule)}`;
      s.dates.forEach((d, i) => {
        tempData += ` ${getDateLabel(d)} ${i < s.dates.length - 1 ? ',' : ''}`;
      });
      tags.push(tempData);
    }
    if (s.scheduleBy === 'weeks-day') {
      let tempData = '';
      tempData += s.weeks.map((w) => ` ${getWeekLabel(w)}`);
      tempData += ` - ${getDayLabel(s.day)} each month`;
      tags.push(tempData);
    }
    if (s.scheduleBy === 'month-date') {
      let tempData = '';
      tempData += getMonthLabel(s.month);
      tempData += ` ${getDateLabel(s.date)}`;
      tags.push(tempData);
    }
    if (s.scheduleBy === 'week-day-month') {
      let tempData = '';
      tempData += getWeekLabel(s.week);
      tempData += ` ${getDayLabel(s.day)}`;
      tempData += ` of ${getMonthLabel(s.month)}`;
      tags.push(tempData);
    }
    if (s.frequency === 'cron') {
      tags.push(cronstrue.toString(s.cron));
    }
  });

  return tags;
};

//Approval status tags colors
const approvalStatusTagColors = {
  Approved: 'var(--success)',
  Rejected: 'var(--danger)',
  Pending: 'var(--warning)',
};
