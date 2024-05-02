// Packages
import React from 'react';
import { Descriptions, Tooltip, Tag } from 'antd';

//Local Imports
import { formatDateTime } from '../../../common/CommonUtil';
import './notifications.css';

function NotificationDetails({ selectedNotification, monitorings, domains, productCategories }) {
  // Destructure metaData
  const {
    metaData: { asrSpecificMetaData },
  } = selectedNotification;

  // JSX
  return (
    <>
      <Descriptions column={1} bordered={true} size="small" className="notifications_tiny-description">
        <Descriptions.Item label="Origin ">
          {monitorings.find((m) => m.id === selectedNotification.notificationOrigin)?.name || <Tag>Unknown</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Reason ">{selectedNotification.notificationTitle}</Descriptions.Item>
        <Descriptions.Item label=" Details ">
          <div className="notifications__fixed-size-description-item tiny-scroll-bar">
            {selectedNotification.notificationDescription}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Status ">{selectedNotification.status}</Descriptions.Item>
        {selectedNotification.recipients && (
          <Descriptions.Item label="Recipient(s) ">
            <div className="notifications__fixed-size-description-item tiny-scroll-bar">
              {selectedNotification?.recipients?.intended.map((r, i) => (
                <Tag key={i}>{r}</Tag>
              ))}
            </div>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Channel ">{selectedNotification.notificationChannel}</Descriptions.Item>

        {/* ASR specific metadata  ------------------------------------*/}

        {asrSpecificMetaData && asrSpecificMetaData?.severity && (
          <Descriptions.Item label="Severity">{asrSpecificMetaData.severity}</Descriptions.Item>
        )}

        {asrSpecificMetaData && asrSpecificMetaData?.domain && (
          <Descriptions.Item label="Domain ">
            {domains.find((d) => d.id === asrSpecificMetaData.domain)?.name || <Tag>Unknown</Tag>}
          </Descriptions.Item>
        )}
        {asrSpecificMetaData && asrSpecificMetaData?.productCategory && (
          <Descriptions.Item label="Product Category">
            {productCategories.find((pc) => pc.id === asrSpecificMetaData.productCategory)?.name || <Tag>Unknown</Tag>}
          </Descriptions.Item>
        )}
        {asrSpecificMetaData && asrSpecificMetaData?.jiraTickets && (
          <Descriptions.Item label="Jira Tickets">
            {asrSpecificMetaData.jiraTickets.map((t, i) => (
              <Tag key={i}>{t}</Tag>
            ))}
          </Descriptions.Item>
        )}
        {asrSpecificMetaData && asrSpecificMetaData?.interceptionStage && (
          <Descriptions.Item label="Interception Stage">{asrSpecificMetaData.interceptionStage}</Descriptions.Item>
        )}
        {asrSpecificMetaData && asrSpecificMetaData?.primaryContact && (
          <Descriptions.Item label="Primary Contact(s)">
            <div className="notifications__fixed-size-description-item tiny-scroll-bar">
              {asrSpecificMetaData.primaryContact.map((pc, i) => (
                <Tag key={i}>{pc}</Tag>
              ))}
            </div>
          </Descriptions.Item>
        )}
        {asrSpecificMetaData && asrSpecificMetaData?.secondaryContact && (
          <Descriptions.Item label="Secondary Contact(s)">
            <div className="notifications__fixed-size-description-item">
              {asrSpecificMetaData.secondaryContact.map((sc, i) => (
                <Tag key={i}>{sc}</Tag>
              ))}
            </div>
            .
          </Descriptions.Item>
        )}
        {asrSpecificMetaData && asrSpecificMetaData?.notifyContact && (
          <Descriptions.Item label="Notify Contact(s)">
            <div className="notifications__fixed-size-description-item">
              {asrSpecificMetaData.notifyContact.map((nc, i) => (
                <Tag key={i}>{nc}</Tag>
              ))}
            </div>
          </Descriptions.Item>
        )}

        {/* -------------------------------------------------------------------------------------------- */}

        <Descriptions.Item label="Created By" className="notifications__wider-tooltip">
          <Tooltip
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
            title={
              <>
                <div>{`User ID : ${selectedNotification?.createdBy.id}`}</div>
                <div>{`Email : ${selectedNotification?.createdBy.email}`}</div>
              </>
            }>
            <span className="notificationDetails__value-with-tooltip">{`${selectedNotification.createdBy.name}`}</span>{' '}
            on{' '}
          </Tooltip>
          {formatDateTime(selectedNotification.createdAt)}{' '}
        </Descriptions.Item>

        {selectedNotification.updatedBy && (
          <Descriptions.Item label="Updated By " className="notifications__wider-tooltip">
            <Tooltip
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              title={
                <>
                  <div>{`User ID: ${selectedNotification?.updatedBy?.id}`}</div>
                  <div>{`Email: ${selectedNotification?.updatedBy?.email}`}</div>
                </>
              }>
              <span className="notificationDetails__value-with-tooltip">{`${selectedNotification.updatedBy.name}`}</span>{' '}
              on{' '}
            </Tooltip>
            {formatDateTime(selectedNotification.updatedAt)}{' '}
          </Descriptions.Item>
        )}

        {selectedNotification.resolutionDateTime && (
          <Descriptions.Item label="Resolved By " className="notifications__wider-tooltip">
            <Tooltip
              getPopupContainer={(triggerNode) => triggerNode.parentNode}
              title={
                <>
                  <div>{`User ID: ${selectedNotification?.updatedBy?.id}`}</div>
                  <div>{`Email: ${selectedNotification?.updatedBy?.email}`}</div>
                </>
              }>
              <span className="notificationDetails__value-with-tooltip">{`${selectedNotification.updatedBy.name}`}</span>{' '}
              on{' '}
            </Tooltip>
            {formatDateTime(selectedNotification.resolutionDateTime)}{' '}
          </Descriptions.Item>
        )}

        <Descriptions.Item label="Comment">{selectedNotification.comment}</Descriptions.Item>
        {selectedNotification.notifiedAt && (
          <Descriptions.Item label="Notified on">{formatDateTime(selectedNotification.notifiedAt)}</Descriptions.Item>
        )}
      </Descriptions>
    </>
  );
}

export default NotificationDetails;
