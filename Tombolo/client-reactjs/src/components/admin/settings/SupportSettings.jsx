import React from 'react';
import { Card, Typography, Space } from 'antd';
import _ from 'lodash';

const { Text } = Typography;

function SupportSettings({ instanceSettings }) {
  const { metaData } = instanceSettings;
  let supportEmailRecipientsRoles = [];
  let accessRequestEmailRecipientsRoles = [];

  // If supportEmailRecipientsRoles is not empty, capitalize
  if (metaData?.supportEmailRecipientsRoles) {
    supportEmailRecipientsRoles = metaData.supportEmailRecipientsRoles.map((role) => {
      return _.startCase(role);
    });
  }

  // if accessRequestEmailRecipientsRoles is not empty, capitalize
  if (metaData?.accessRequestEmailRecipientsRoles) {
    accessRequestEmailRecipientsRoles = metaData.accessRequestEmailRecipientsRoles.map((role) => {
      return _.startCase(role);
    });
  }

  return (
    <>
      <div>
        {/* <Title level={4} type="primary">
          Below are the current recipients for support emails and access requests.{' '}
        </Title> */}
        {/* Support Emails */}
        <Card
          title={
            <span style={{ fontSize: '1.1rem' }}>
              Who receives support emails (e.g., password resets, application issues, etc.)
            </span>
          }
          style={{ marginTop: 24, width: 800 }}
          size="small"
          bordered={false}>
          <Space direction="vertical" size="small">
            <Text>
              <strong>Roles:</strong>{' '}
              {metaData?.supportEmailRecipientsRoles.length > 0 ? supportEmailRecipientsRoles.join(', ') : ' N/A'}
            </Text>
            <Text>
              <strong>Email:</strong>{' '}
              {metaData?.supportEmailRecipients ? metaData.supportEmailRecipients.join(', ') : ' N/A'}
            </Text>
          </Space>
        </Card>

        {/* Access Requests */}
        <Card
          title={
            <span style={{ fontSize: '1.1rem' }}>
              Who receives access request emails (e.g., application access, role access, etc.)
            </span>
          }
          style={{ marginTop: 24, width: 800 }}
          bordered={false}
          size="small">
          <Space direction="vertical" size="small">
            <Text>
              <strong>Roles:</strong>{' '}
              {metaData?.accessRequestEmailRecipientsRoles.length > 0
                ? accessRequestEmailRecipientsRoles.join(', ')
                : ' N/A'}
            </Text>
            <Text>
              <strong>Email:</strong>{' '}
              {metaData?.accessRequestEmailRecipientsEmail
                ? metaData.accessRequestEmailRecipientsEmail.join(', ')
                : ' N/A'}
            </Text>
          </Space>
        </Card>
      </div>
    </>
  );
}

export default SupportSettings;
