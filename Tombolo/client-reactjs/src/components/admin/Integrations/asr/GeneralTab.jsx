// Package imports
import React, { useState, useEffect } from 'react';
import { Space, Tag, Card } from 'antd';
import { CheckSquareFilled, CloseSquareFilled } from '@ant-design/icons';

// Local imports
import '../integrations.css';

function GeneralTab({ integrationDetails, teamsChannels }) {
  const [severity3AlertRecipients, setSeverity3AlertRecipients] = useState(null);
  const [megaphoneAlertRecipients, setMegaphoneAlertRecipients] = useState(null);
  const [nocAlerts, setNocAlerts] = useState(null);
  const [minSeverityLevelForNocAlert, setMinSeverityLevelForNocAlert] = useState(null);

  // Effects
  useEffect(() => {
    const severity3EmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.severity3Alerts?.emailContacts || [];
    const megaphoneEmailContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.emailContacts || [];
    const megaPhoneTeamsContacts =
      integrationDetails?.appSpecificIntegrationMetaData?.megaPhoneAlerts?.teamsChannel || [];
    const nocEmailContacts = integrationDetails?.appSpecificIntegrationMetaData?.nocAlerts?.emailContacts || [];
    const minSeverityLevelForNocAlert =
      integrationDetails?.appSpecificIntegrationMetaData?.nocAlerts?.severityLevelForNocAlerts || null;

    setSeverity3AlertRecipients({ emailContacts: severity3EmailContacts });
    setMegaphoneAlertRecipients({ emailContacts: megaphoneEmailContacts, teamsChannel: megaPhoneTeamsContacts });
    setNocAlerts({ emailContacts: nocEmailContacts });
    setMinSeverityLevelForNocAlert(minSeverityLevelForNocAlert);
  }, [integrationDetails]);

  // JSX for General Tab
  return (
    <Space direction="vertical">
      <div>
        {integrationDetails?.appSpecificIntegrationMetaData?.severity3Alerts?.active ? (
          <>
            <Card
              size="small"
              title={
                <Space>
                  <CheckSquareFilled style={{ color: 'var(--primary)' }} />
                  <span>
                    Severity 3 alerts <span style={{ color: 'var(--primary)', fontWeight: '800' }}>ACTIVE</span>
                  </span>
                </Space>
              }>
              {severity3AlertRecipients?.emailContacts.map((e, i) => {
                return (
                  <Tag color="blue" key={i}>
                    {e}
                  </Tag>
                );
              })}
            </Card>
          </>
        ) : (
          <Card size="small">
            <Space>
              <CloseSquareFilled style={{ color: 'var(--danger)' }} />
              <span>
                Severity 3 alerts <span style={{ color: 'var(--danger)', fontWeight: '800' }}>INACTIVE</span>
              </span>
            </Space>
          </Card>
        )}
      </div>

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

      <div>
        {integrationDetails?.appSpecificIntegrationMetaData?.nocAlerts?.active ? (
          <>
            <Card
              size="small"
              title={
                <Space>
                  <CheckSquareFilled style={{ color: 'var(--primary)' }} />
                  <span>
                    NOC alerts <span style={{ color: 'var(--primary)', fontWeight: '800' }}>ACTIVE</span> for severity{' '}
                    {minSeverityLevelForNocAlert < 3 ? (
                      <span style={{ color: 'var(--primary)', fontWeight: '800' }}>
                        {minSeverityLevelForNocAlert} and above
                      </span>
                    ) : (
                      ''
                    )}
                  </span>
                </Space>
              }>
              {nocAlerts.emailContacts.map((e, i) => {
                return (
                  <Tag color="blue" key={i}>
                    {e}
                  </Tag>
                );
              })}
            </Card>
          </>
        ) : (
          <Card size="small">
            <Space>
              <CloseSquareFilled style={{ color: 'var(--danger)' }} />
              <span>
                NOC alerts <span style={{ color: 'var(--danger)', fontWeight: '800' }}>INACTIVE</span>
              </span>
            </Space>
          </Card>
        )}
      </div>
    </Space>
  );
}

export default GeneralTab;
