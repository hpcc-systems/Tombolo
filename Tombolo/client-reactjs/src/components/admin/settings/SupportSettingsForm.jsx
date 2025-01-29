import React from 'react';
import { Form, Input, Checkbox, Divider } from 'antd';

function SupportSettingsForm({ supportSettingsForm, instanceSettings }) {
  return (
    <Form layout="vertical" form={supportSettingsForm} initialValues={instanceSettings.metaData}>
      {/* Support Emails */}
      <Form.Item
        name="supportEmailRecipientsRoles"
        required
        label={
          <span style={{ fontWeight: 500, fontSize: '1rem' }}>
            Configure who should receive support emails (e.g., password resets, application issues, etc.)
          </span>
        }>
        <Checkbox.Group>
          <Checkbox value="owner">All Admins</Checkbox>
          <Checkbox value="administrator">All Owners</Checkbox>
        </Checkbox.Group>
      </Form.Item>
      <Form.Item
        name="supportEmailRecipientsEmail"
        label="Custom Email Address"
        rules={[
          { type: 'email', message: 'Please enter a valid email address' },
          {
            validator: (_, value) => {
              const roles = supportSettingsForm.getFieldValue('supportEmailRecipientsRoles');
              if (!roles?.length && !value) {
                return Promise.reject('Please provide either a role or a custom email address');
              }
              return Promise.resolve();
            },
          },
        ]}>
        <Input placeholder="Enter email (e.g., support@example.com)" style={{ width: '60%' }} />
      </Form.Item>

      <Divider />

      {/* Access Requests */}
      <Form.Item
        name="accessRequestEmailRecipientsRoles"
        required
        label={
          <span style={{ fontWeight: 500, fontSize: '1rem' }}>
            Configure who should receive access request emails (e.g., application access or role requests)
          </span>
        }>
        <Checkbox.Group>
          <Checkbox value="owner">All Owners</Checkbox>
          <Checkbox value="administrator">All Admins</Checkbox>
        </Checkbox.Group>
      </Form.Item>
      <Form.Item
        name="accessRequestEmailRecipientsEmail"
        label="Custom Email Address"
        rules={[
          { type: 'email', message: 'Please enter a valid email address' },
          {
            validator: (_, value) => {
              const roles = supportSettingsForm.getFieldValue('accessRequestEmailRecipientsRoles');
              if (!roles?.length && !value) {
                return Promise.reject('Please provide either a role or a custom email address');
              }
              return Promise.resolve();
            },
          },
        ]}>
        <Input placeholder="Enter email (e.g., access@example.com)" style={{ width: '60%' }} />
      </Form.Item>
    </Form>
  );
}

export default SupportSettingsForm;
