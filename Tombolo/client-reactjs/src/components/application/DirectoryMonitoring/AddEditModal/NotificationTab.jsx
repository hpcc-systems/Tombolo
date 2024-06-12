//Packages
import React from 'react';
import { Form, Card, Select } from 'antd';
import { isEmail } from 'validator';

//Constants
const { Option } = Select;
const directoryStatuses = [
  { label: 'File Not Moving', value: 'threshold' },
  { label: 'File Detected', value: 'fileDetected,' },
  { label: 'Maximum File Count', value: 'maximumFileCount' },
  { label: 'Minimum File Count', value: 'minimumFilecount' },
];

function NotificationTab({ form, teamsHooks }) {
  // JSX
  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item
          name="notificationCondition"
          label="Notify when"
          rules={[{ required: true, message: 'Select one or more options' }]}>
          <Select mode="multiple" placeholder="Select one">
            {directoryStatuses.map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Teams Channel" name="teamsHooks">
          <Select placeholder="Select a teams Channel " mode="multiple">
            {teamsHooks.map((team) => (
              <Option key={team.id} value={team.id}>
                {team.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

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
      </Form>
    </Card>
  );
}

export default NotificationTab;
