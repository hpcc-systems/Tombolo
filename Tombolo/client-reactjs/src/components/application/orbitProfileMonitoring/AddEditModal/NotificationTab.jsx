import React from 'react';
import { Form, Select } from 'antd';

function NotificationTab({ form, _isEditing, _selectedMonitoring }) {
  return (
    <Form form={form} layout="vertical">
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

      <Form.Item label="Secondary Contact Emails" name="secondaryContacts">
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="Enter secondary contact email addresses (optional)"
          tokenSeparators={[',', ' ']}
        />
      </Form.Item>

      <Form.Item label="Notify Contact Emails" name="notifyContacts">
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="Enter notify contact email addresses (optional)"
          tokenSeparators={[',', ' ']}
        />
      </Form.Item>
    </Form>
  );
}

export default NotificationTab;
