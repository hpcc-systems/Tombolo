import React from 'react';
import { Form, Card, Select } from 'antd';

const { Option } = Select;

function NotificationTab({ form, _isEditing, _selectedMonitoring }) {

  // Notification condition options
  const notificationConditions = [
    { value: 'buildFailed', label: 'Build not available for use' },
    {value: 'failedToGetBuildInfo', label: 'Failed to get build info' },
  ];

  return (
    <Card size="small" style={{ marginBottom: '1rem' }}>
      <Form form={form} layout="vertical"
      // Select both notification conditions by default
      initialValues={{ notificationConditions: ['buildFailed', 'failedToGetBuildInfo'] }}
    
      >
        <Form.Item
          label="Notification Conditions"
          name="notificationConditions"
          rules={[{ required: true, message: 'Please select at least one notification condition' }]}>
          <Select
            mode="multiple"
            placeholder="Select notification conditions"
            optionLabelProp="label">
            {notificationConditions.map((condition) => (
              <Option key={condition.value} value={condition.value} label={condition.label}>
                {condition.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          label={
            <span>
              Primary Contact Emails <span style={{ color: 'red' }}>*</span>
            </span>
          }
          name="primaryContacts"
          rules={[{ required: true, message: 'Primary contact emails are required' }]}>
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Enter primary contact email addresses (required)"
            tokenSeparators={[',', ' ']}
          />
        </Form.Item>

        <Form.Item
          label="Secondary Contact Emails"
          name="secondaryContacts">
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Enter secondary contact email addresses (optional)"
            tokenSeparators={[',', ' ']}
          />
        </Form.Item>

        <Form.Item
          label="Notify Contact Emails"
          name="notifyContacts">
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Enter notify contact email addresses (optional)"
            tokenSeparators={[',', ' ']}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}

export default NotificationTab;