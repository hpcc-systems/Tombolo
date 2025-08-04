// Package imports
import React, { useState, useEffect } from 'react';
import { Space, Tag, Card } from 'antd';
import { CheckSquareFilled, CloseSquareFilled } from '@ant-design/icons';

function GeneralTab({ integrationDetails, teamsChannels }) {
  const [megaphoneAlertRecipients, setMegaphoneAlertRecipients] = useState(null);

  // Effects
  useEffect(() => {
    const megaphoneEmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.emailContacts || [];
    const megaPhoneTeamsContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.teamsChannel || [];

    setMegaphoneAlertRecipients({ emailContacts: megaphoneEmailContacts, teamsChannel: megaPhoneTeamsContacts });
  }, [integrationDetails]);

  // JSX for General Tab
  return (
    <Space direction="vertical">
      <div>
        {integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.active ? (
          <>
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
              {megaphoneAlertRecipients?.emailContacts.map((e, i) => {
                return (
                  <Tag color="blue" key={i}>
                    {e}
                  </Tag>
                );
              })}
              {megaphoneAlertRecipients?.teamsChannel.map((t, i) => {
                return teamsChannels.map((tc) => {
                  if (tc.id === t) {
                    return (
                      <Tag color="blue" key={i}>
                        {tc.name}
                      </Tag>
                    );
                  }
                  return null;
                });
              })}
            </Card>
          </>
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
}

export default GeneralTab;
