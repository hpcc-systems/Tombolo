import React from 'react';
import { Form, Card, Select } from 'antd';

function NotificationTab({ form, _isEditing, _selectedMonitoring }) {
  return (
    <Card size="small" style={{ marginBottom: '1rem' }}>
      <Form form={form} layout="vertical">
        <Form.Item
          label={
            <span>
              Primary Contact Emails <span style={{ color: 'red' }}>*</span>
            </span>
          }
          name="primaryContactEmails"
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
          name="secondaryContactEmails">
          <Select
            mode="tags"
            style={{ width: '100%' }}
            placeholder="Enter secondary contact email addresses (optional)"
            tokenSeparators={[',', ' ']}
          />
        </Form.Item>

        <Form.Item
          label="Notify Contact Emails"
          name="notifyContactEmails">
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