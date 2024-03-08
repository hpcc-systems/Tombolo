// Package imports
import React, { useState, useEffect } from 'react';
import { Space, Tag, Card } from 'antd';
import { CheckSquareFilled, CloseSquareFilled } from '@ant-design/icons';

// Local imports
import '../integrations.css';

function GeneralTab({ integrationDetails }) {
  const [severity3AlertRecipients, setSeverity3AlertRecipients] = useState(null);
  const [megaphoneAlertRecipients, setMegaphoneAlertRecipients] = useState(null);

  // Effects
  useEffect(() => {
    const severity3EmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.severity3Alerts?.emailContacts || [];
    const megaphoneEmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.emailContacts || [];
    const megaPhoneTeamsContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.teamsChannel || [];

    setSeverity3AlertRecipients({ emailContacts: severity3EmailContacts });
    setMegaphoneAlertRecipients({ emailContacts: megaphoneEmailContacts, teamsChannel: megaPhoneTeamsContacts });
  }, [integrationDetails]);

  // JSX for General Tab
  return (
    <>
      <div>
        {integrationDetails?.appSpecificIntegrationMetaData?.severity3Alerts?.active ? (
          <>
            <Space>
              <CheckSquareFilled style={{ color: 'var(--primary)' }} />
              <span>
                Severity 3 alerts <span style={{ color: 'var(--primary)', fontWeight: '800' }}>ACTIVE</span>
              </span>
            </Space>
            <div>
              <Card size="small">
                {severity3AlertRecipients?.emailContacts.map((e, i) => {
                  return (
                    <Tag color="blue" key={i}>
                      {e}
                    </Tag>
                  );
                })}
              </Card>
            </div>
          </>
        ) : (
          <>
            <Space>
              <CloseSquareFilled style={{ color: 'var(--danger)' }} />
              <span>
                Severity 3 alerts <span style={{ color: 'var(--danger)', fontWeight: '800' }}>INACTIVE</span>
              </span>
            </Space>
          </>
        )}
      </div>

      <div>
        {integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.active ? (
          <>
            <Space>
              <CheckSquareFilled style={{ color: 'var(--primary)' }} />
              <span>
                Megaphone alerts <span style={{ color: 'var(--primary)', fontWeight: '800' }}>ACTIVE</span>
              </span>
            </Space>
            <div>
              <Card size="small">
                {megaphoneAlertRecipients?.emailContacts.map((e, i) => {
                  return (
                    <Tag color="blue" key={i}>
                      {e}
                    </Tag>
                  );
                })}
                {megaphoneAlertRecipients?.teamsChannel.map((t, i) => {
                  return (
                    <Tag color="blue" key={i}>
                      {t}
                    </Tag>
                  );
                })}
              </Card>
            </div>
          </>
        ) : (
          <>
            <Space>
              <CloseSquareFilled style={{ color: 'var(--danger)' }} />
              <span>
                Megaphone alerts <span style={{ color: 'var(--danger)', fontWeight: '800' }}>INACTIVE</span>
              </span>
            </Space>
          </>
        )}
      </div>
    </>
  );
}

export default GeneralTab;
