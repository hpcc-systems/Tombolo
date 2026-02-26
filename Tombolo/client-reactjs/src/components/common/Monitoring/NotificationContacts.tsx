import React from 'react';
import { useSelector } from 'react-redux';
import { Card } from 'antd';
import EmailTagInput from '../EmailTagInput';
import AsrSpecificNotificationsDetails from './AsrSpecificNotificationDetails';

const NotificationContacts: React.FC<any> = ({ children }) => {
  const applicationId = useSelector((state: any) => state.application?.application?.applicationId);
  const integrations = useSelector((state: any) => state.application?.integrations || []);

  const asrIntegration = integrations.some(
    (integration: any) => integration.name === 'ASR' && integration.application_id === applicationId
  );

  return (
    <Card>
      {children}
      <EmailTagInput label="Primary Contact(s)" name="primaryContacts" required={true} />
      {asrIntegration && <AsrSpecificNotificationsDetails />}
    </Card>
  );
};

export default NotificationContacts;
