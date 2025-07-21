// Packages
import React, { useState, useEffect } from 'react';
import { Descriptions, Tooltip, Tag, Tabs } from 'antd';

//Local Imports
import { formatDateTime } from '../../../common/CommonUtil';
import './notifications.css';
import { getNotificationHtmlCode } from './notificationUtil';

function NotificationDetails({ selectedNotification }) {
  // Destructure metaData
  const { metaData } = selectedNotification;

  const [fetchingNotificationDetails, setFetchingNotificationDetails] = useState(true);
  const [notificationHtmlCode, setNotificationHtmlCode] = useState(null);

  useEffect(() => {
    const fetchNotificationDetails = async () => {
      if (selectedNotification) {
        try {
          const { id } = selectedNotification;

          const notificationHtmlCode = await getNotificationHtmlCode(id);
          setNotificationHtmlCode(notificationHtmlCode);
        } catch (err) {
          console.log(err);
        } finally {
          setFetchingNotificationDetails(false);
        }
      }
    };

    fetchNotificationDetails();
  }, [selectedNotification]);

  // JSX
  return (
    <Tabs>
      <Tabs.TabPane tab="Summary" key="0">
        <Descriptions column={1} bordered={true} size="small" className="notifications_tiny-description">
          <Descriptions.Item label="Origin ">
            {selectedNotification.notificationOrigin || <Tag>Unknown</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Reason ">{selectedNotification.notificationTitle}</Descriptions.Item>

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

          {/* ASR specific metadata  ------------------------------------*/}

          {metaData?.asrSpecificMetaData && metaData?.asrSpecificMetaData?.jiraTickets && (
            <Descriptions.Item label="Jira Tickets">
              {metaData?.asrSpecificMetaData.jiraTickets.map((t, i) => (
                <Tag key={i}>{t}</Tag>
              ))}
            </Descriptions.Item>
          )}
          {metaData?.asrSpecificMetaData && metaData?.asrSpecificMetaData?.interceptionStage && (
            <Descriptions.Item label="Interception Stage">
              {metaData?.asrSpecificMetaData.interceptionStage}
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

          {selectedNotification.comment && (
            <Descriptions.Item label="Comment">{selectedNotification.comment}</Descriptions.Item>
          )}
          {selectedNotification.notifiedAt && (
            <Descriptions.Item label="Notified on">{formatDateTime(selectedNotification.notifiedAt)}</Descriptions.Item>
          )}
        </Descriptions>
      </Tabs.TabPane>
      <Tabs.TabPane tab="Details" key="1">
        {fetchingNotificationDetails ? (
          <div className="notificationDetails_notAvailable">Loading...</div>
        ) : notificationHtmlCode ? (
          <div className="notificationDetails" dangerouslySetInnerHTML={{ __html: notificationHtmlCode }} />
        ) : (
          <div className="notificationDetails_notAvailable">No details available</div>
        )}
      </Tabs.TabPane>
    </Tabs>
  );
}

export default NotificationDetails;
