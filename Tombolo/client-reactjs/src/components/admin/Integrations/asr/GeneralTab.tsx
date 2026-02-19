import React, { useState, useEffect } from 'react';
import { Space, Tag, Card } from 'antd';
import { CheckSquareFilled, CloseSquareFilled } from '@ant-design/icons';

interface Props {
  integrationDetails?: any;
  teamsChannels?: any[];
}

const GeneralTab: React.FC<Props> = ({ integrationDetails, teamsChannels = [] }) => {
  const [megaphoneAlertRecipients, setMegaphoneAlertRecipients] = useState<any>(null);

  useEffect(() => {
    const megaphoneEmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.emailContacts || [];
    const megaPhoneTeamsContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.teamsChannel || [];

    setMegaphoneAlertRecipients({ emailContacts: megaphoneEmailContacts, teamsChannel: megaPhoneTeamsContacts });
  }, [integrationDetails]);

  return (
    <Space direction="vertical">
      <div>
        {integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.active ? (
          <Card
            size="small"
            title={
              <Space>
                <CheckSquareFilled style={{ color: 'var(--primary)' }} />
                <span>
                  Megaphone alerts <span style={{ color: 'var(--primary)', fontWeight: '800' }}>ACTIVE</span>
                </span>
              </Space>
            }>
            {megaphoneAlertRecipients?.emailContacts.map((e: string, i: number) => (
              <Tag color="blue" key={i}>
                {e}
              </Tag>
            ))}
            {megaphoneAlertRecipients?.teamsChannel.map((t: any, i: number) =>
              teamsChannels.map(tc => {
                if (tc.id === t) {
                  return (
                    <Tag color="blue" key={i}>
                      {tc.name}
                    </Tag>
                  );
                }
                return null;
              })
            )}
          </Card>
        ) : (
          <Card size="small">
            <Space>
              <CloseSquareFilled style={{ color: 'var(--danger)' }} />
              <span>
                Megaphone alerts <span style={{ color: 'var(--danger)', fontWeight: '800' }}>INACTIVE</span>
              </span>
            </Space>
          </Card>
        )}
      </div>
    </Space>
  );
};

export default GeneralTab;
