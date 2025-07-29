import { isEmail } from 'validator';
import { Form, Select } from 'antd';
import React from 'react';

export default function EmailTagInput({ label, name, required }) {
  return (
    <Form.Item
      label={label}
      name={name}
      required={required}
      rules={[
        {
          validator: (_, value) => {
            if (required) {
              if (!value || value.length === 0) {
                return Promise.reject(new Error('Please add at least one email!'));
              }
            } else {
              if (!value) {
                return Promise.resolve();
              }
            }

            if (value.length > 20) {
              return Promise.reject(new Error('Max 20 emails allowed'));
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
