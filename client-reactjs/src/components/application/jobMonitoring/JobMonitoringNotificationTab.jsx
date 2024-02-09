//Packages
import React from 'react';
import { useSelector } from 'react-redux';
import { Form, Card, Select } from 'antd';
import { isEmail } from 'validator';

//Local Imports
import AsrSpecificNotificationsDetails from './AsrSpecificNotificationsDetails';

//Constants
const { Option } = Select;
const jobStatuses = [
  { label: 'Completed', value: 'Completed' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Aborted', value: 'Aborted' },
  { label: 'Blocked', value: 'Blocked' },
  { label: 'Threshold Exceeded', value: 'ThresholdExceeded' }, //TODO - If threshold exceed option is selected make threshold time input value required
];

function JobMonitoringNotificationTab({ form, teamsHooks }) {
  //Redux
  const {
    applicationReducer: { integrations },
  } = useSelector((state) => state);
  const asrIntegration = integrations?.find((integration) => integration.name === 'ASR') !== undefined;

  // JSX
  return (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item
          name="notificationCondition"
          label="Notify when"
          rules={[{ required: true, message: 'Select one or more options' }]}>
          <Select mode="multiple" placeholder="Select one">
            {jobStatuses.map((status) => (
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

        {asrIntegration && <AsrSpecificNotificationsDetails />}
      </Form>
    </Card>
  );
}

export default JobMonitoringNotificationTab;
