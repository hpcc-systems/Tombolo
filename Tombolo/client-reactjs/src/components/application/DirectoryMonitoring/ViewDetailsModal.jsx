import React from 'react';
import { Descriptions, Modal, Button, Tooltip, Tag } from 'antd';
import cronstrue from 'cronstrue';

import { Constants } from '../../common/Constants.js';
import { getDayLabel, getMonthLabel, getDateLabel, getWeekLabel } from '../../common/scheduleOptions.js';

function ViewDetailsModal({
  displayViewDetailsModal,
  setDisplayViewDetailsModal,
  selectedMonitoring,
  setSelectedMonitoring,
  clusters,
  teamsHooks,
}) {
  // When cancel button is clicked, close the modal and reset the selectedMonitoring
  const handleCancel = () => {
    setDisplayViewDetailsModal(false);
    setSelectedMonitoring(null);
  };

  //Destructure the selectedMonitoring object
  if (selectedMonitoring === null) return null; // If selectedMonitoring is null, return null (don't display the modal)
  const {
    name,
    description,
    directory,
    createdAt,
    createdBy,
    updatedBy,
    active,
    approvalStatus,
    approvedAt,
    approvedBy,
    metaData,
    cluster_id,
    approvalNote,
    approved,
  } = selectedMonitoring;
  const { notificationMetaData, schedule, pattern } = metaData;
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
      <Descriptions column={1} bordered={true} size="small" className="directory__monitoring_tiny-description">
        <Descriptions.Item label="Monitoring name " className="tiny-description">
          {name}
        </Descriptions.Item>
        <Descriptions.Item label="Description">{description}</Descriptions.Item>
        <Descriptions.Item label="Cluster">
          {clusters.find((c) => c.id === cluster_id)?.name || (
            <Tag style={{ color: 'var(--danger)' }}>Deleted cluster</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Directory name">{directory}</Descriptions.Item>
        <Descriptions.Item label="File Name pattern">{pattern ? pattern : 'No Pattern Set'}</Descriptions.Item>
        {schedule && <Descriptions.Item label="Frequency">{schedule[0].frequency}</Descriptions.Item>}
        {schedule && schedule.length > 0 && (
          <Descriptions.Item label="Directory Schedule">
            {generateTagsForSchedule(schedule).map((s, i) => (
              <Tag key={i}>{s}</Tag>
            ))}
          </Descriptions.Item>
        )}
        {metaData?.expectedMoveByTime && (
          <Descriptions.Item label="Expected File Move By Time">{metaData.expectedMoveByTime}</Descriptions.Item>
        )}
        {notificationMetaData &&
          notificationMetaData.notificationCondition &&
          notificationMetaData.notificationCondition.length > 0 && (
            <Descriptions.Item label="Notify when">
              {notificationMetaData.notificationCondition.map((condition, i) => (
                <Tag key={i}>{condition.replace(/([A-Z])/g, ' $1').trim()}</Tag>
              ))}
            </Descriptions.Item>
          )}
        {notificationMetaData.primaryContacts && notificationMetaData.primaryContacts.length > 0 && (
          <Descriptions.Item label="Primary contact(s)">
            {notificationMetaData.primaryContacts.map((email, index) =>
              index < notificationMetaData.primaryContacts.length - 1 ? (
                <span key={index}>{email}, </span>
              ) : (
                <span key={index}>{email}, </span>
              )
            )}
          </Descriptions.Item>
        )}
        {notificationMetaData.secondaryContacts && notificationMetaData.secondaryContacts.length > 0 && (
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
        {notificationMetaData.notifyContacts && notificationMetaData.notifyContacts.length > 0 && (
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
        {notificationMetaData.teamsHooks && notificationMetaData.teamsHooks.length > 0 && (
          <Descriptions.Item label="Teams channel(s)">
            {getHookTags({ AllTeamsHooks: teamsHooks, hookIds: notificationMetaData.teamsHooks })}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Active">
          {active && approved ? (
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
        {approvalNote && <Descriptions.Item label="Approver's comment">{approvalNote}</Descriptions.Item>}
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
                <div>User ID : {JSON.parse(updatedBy).id}</div>
                <div>Email : {JSON.parse(updatedBy).email}</div>
              </>
            }>
            <span style={{ color: 'var(--primary)' }}>{JSON.parse(updatedBy).name} </span>
          </Tooltip>
          on {new Date(createdAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default ViewDetailsModal;

//Generate tags for schedule
const generateTagsForSchedule = (schedule) => {
  const tags = [];
  schedule.forEach((s) => {
    if (s.frequency === 'daily') {
      tags.push('Everyday');
    }
    if (s.frequency === 'weekly') {
      let tempData = 'Every week on';
      s.days.forEach((d, i) => {
        tempData += ` ${getDayLabel(d)} ${i < s.days.length - 1 ? ',' : ''}`;
      });
      tags.push(tempData);
    }
    if (s.scheduleBy === 'dates') {
      let tempData = 'Every month on';
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

// Get hooks tags
const getHookTags = ({ AllTeamsHooks, hookIds }) => {
  const hooks = AllTeamsHooks.filter((hook) => hookIds.includes(hook.id));
  const deletedHooks = hookIds.filter((id) => !hooks.find((hook) => hook.id === id));
  const currentTags = hooks.map((hook, i) => (
    <Tooltip key={i} title={hook.url}>
      <Tag style={{ color: 'var(--primary)' }} key={i}>
        {hook.name}
      </Tag>
    </Tooltip>
  ));
  const deletedTags = deletedHooks.map((_hook, i) => (
    <Tooltip key={i} title="This hook has been deleted. To remove it, please edit the directory monitoring settings.">
      <Tag color="warning" key={i}>
        Deleted
      </Tag>
    </Tooltip>
  ));

  return [...currentTags, ...deletedTags];
};

//Approval status tags colors
const approvalStatusTagColors = {
  Approved: 'var(--success)',
  Rejected: 'var(--danger)',
  Pending: 'var(--warning)',
};