//Packages
import React from 'react';
import { Form, Select } from 'antd';
import NotificationContacts from '../../../common/Monitoring/NotificationContacts';

//Constants
const { Option } = Select;
const directoryStatuses = [
  { label: 'File Not Moving', value: 'threshold' },
  { label: 'File Detected', value: 'fileDetected,' },
  { label: 'Maximum File Count', value: 'maximumFileCount' },
  { label: 'Minimum File Count', value: 'minimumFilecount' },
];

function NotificationTab({ form, teamsHooks }) {
  return (
    <NotificationContacts form={form}>
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
    </NotificationContacts>
  );
}

export default NotificationTab;
