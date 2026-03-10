import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Form, Select } from 'antd';
import EmailTagInput from '../EmailTagInput';
import AsrSpecificNotificationsDetails from './AsrSpecificNotificationDetails';

const NotificationContacts: React.FC<any> = ({ children, enableOwnerSupervisorContact }) => {
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
      {enableOwnerSupervisorContact ? (
        <Form.Item label="Notify Owner and Supervisor" name="ownerAndSupervisor">
          <Select placeholder="Select an option" style={{ width: '100%' }} mode="multiple">
            <Select.Option value="owner">Notify User ( workunit owner)</Select.Option>
            <Select.Option value="supervisor">Notify User's Supervisor</Select.Option>
          </Select>
        </Form.Item>
      ) : null}
    </Card>
  );
};

export default NotificationContacts;
