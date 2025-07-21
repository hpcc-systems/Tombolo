import { isEmail } from 'validator';
import { Form, Select } from 'antd';
import React from 'react';

function PrimaryContacts() {
  return (
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
  );
}

export default PrimaryContacts;
