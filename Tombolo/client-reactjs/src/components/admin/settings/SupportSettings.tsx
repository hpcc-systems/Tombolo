import React from 'react';
import { Card, Typography, Space } from 'antd';
import startCase from 'lodash/startCase';

const { Text } = Typography;

interface InstanceSettings {
  metaData?: any;
}

interface SupportSettingsProps {
  instanceSettings: InstanceSettings;
}

const SupportSettings: React.FC<SupportSettingsProps> = ({ instanceSettings }) => {
  const { metaData } = instanceSettings ?? {};
  const supportEmailRecipientsRoles: string[] = metaData?.supportEmailRecipientsRoles
    ? metaData.supportEmailRecipientsRoles.map((role: string) => startCase(role))
    : [];

  const accessRequestEmailRecipientsRoles: string[] = metaData?.accessRequestEmailRecipientsRoles
    ? metaData.accessRequestEmailRecipientsRoles.map((role: string) => startCase(role))
    : [];

  return (
    <div>
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
            {metaData?.supportEmailRecipientsRoles?.length > 0 ? supportEmailRecipientsRoles.join(', ') : ' N/A'}
          </Text>
          <Text>
            <strong>Email:</strong>{' '}
            {metaData?.supportEmailRecipients ? metaData.supportEmailRecipients.join(', ') : ' N/A'}
          </Text>
        </Space>
      </Card>

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
            {metaData?.accessRequestEmailRecipientsRoles?.length > 0
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
  );
};

export default SupportSettings;
