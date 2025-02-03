import React from 'react';
import { Form, Checkbox, Divider, Select } from 'antd';

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
        name="supportEmailRecipients"
        label="Custom Email Address"
        rules={[
          {
            validator: (_, value) => {
              const roles = supportSettingsForm.getFieldValue('supportEmailRecipientsRoles');
              if (!roles?.length && (!value || !value.length)) {
                return Promise.reject('Please provide either a role or a custom email address');
              }
              if (value && value.some((email) => !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))) {
                return Promise.reject('Please enter valid email addresses');
              }
              return Promise.resolve();
            },
          },
        ]}>
        <Select mode="tags" placeholder="Separate with comma (,)" tokenSeparators={[',', ' ']} />
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
          {
            validator: (_, value) => {
              const roles = supportSettingsForm.getFieldValue('supportEmailRecipientsRoles');
              if (!roles?.length && (!value || !value.length)) {
                return Promise.reject('Please provide either a role or a custom email address');
              }
              if (value && value.some((email) => !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))) {
                return Promise.reject('Please enter valid email addresses');
              }
              return Promise.resolve();
            },
          },
        ]}>
        <Select mode="tags" placeholder="Separate with comma (,)" tokenSeparators={[',', ' ']} />
      </Form.Item>
    </Form>
  );
}

export default SupportSettingsForm;
