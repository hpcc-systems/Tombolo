import { useSelector } from 'react-redux';
import { Card, Form } from 'antd';
import React from 'react';
import EmailTagInput from '../EmailTagInput';
import AsrSpecificNotificationsDetails from './AsrSpecificNotificationDetails';

export default function NotificationContacts({ form, children }) {
  // Redux
  const applicationId = useSelector((state) => state.application.application.applicationId);
  const integrations = useSelector((state) => state.application.integrations);

  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  return (
    <Card>
      <Form form={form} layout="vertical">
        {children}
        <EmailTagInput label="Primary Contact(s)" name="primaryContacts" required={true} />
        {asrIntegration && <AsrSpecificNotificationsDetails />}
      </Form>
    </Card>
  );
}
