import React from 'react';
import { Form, Select } from 'antd';

const { Option } = Select;

function NotificationTab({ form, _isEditing, _selectedMonitoring }) {
  // Build status options for notification conditions
  const buildStatuses = [
    { label: 'Build Available For Use', value: 'build_available_for_use' },
    { label: 'Discarded', value: 'discarded' },
    { label: 'Failed QA QAHeld', value: 'failed_qa_qaheld' },
    { label: 'Graveyard', value: 'graveyard' },
    { label: 'Passed QA', value: 'passed_qa' },
    { label: 'Passed QA No Release', value: 'passed_qa_no_release' },
    { label: 'Production', value: 'production' },
    { label: 'Skipped', value: 'skipped' },
  ];

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
