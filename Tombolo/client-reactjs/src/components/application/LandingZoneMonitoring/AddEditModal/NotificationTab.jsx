//Packages
import React from 'react';
import { Form, Card, Select } from 'antd';
import { isEmail } from 'validator';
import { useSelector } from 'react-redux';
import AsrSpecificNotification from './ASRSpecificNotification';

//Constants

function NotificationTab({ form }) {
  // Redux
  const {
    applicationReducer: {
      application: { applicationId },
      integrations,
    },
  } = useSelector((state) => state);
  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );
  // JSX
  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item
          label="Primary Contact(s)"
          name="primaryContacts"
          required
          rules={[
            {
              validator: (_, value) => {
                if (!value || value.length === 0) {
                  return Promise.reject(new Error('Please add at least one email!'));
                }
                if (value.length > 20) {
                  return Promise.reject(new Error('Too many emails'));
                }
                if (!value.every((v) => isEmail(v))) {
                  return Promise.reject(new Error('One or more emails are invalid'));
                }
                return Promise.resolve();
              },
            },
          ]}>
          <Select
            mode="tags"
            allowClear
            placeholder="Enter a comma-delimited list of email addresses"
            tokenSeparators={[',']}
          />
        </Form.Item>

        {asrIntegration && <AsrSpecificNotification />}
      </Form>
    </Card>
  );
}

export default NotificationTab;
