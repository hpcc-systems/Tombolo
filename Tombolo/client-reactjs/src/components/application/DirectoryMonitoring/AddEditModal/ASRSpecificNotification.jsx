import React from 'react';
import { Form, Select } from 'antd';
import { isEmail } from 'validator';

function AsrSpecificNotification() {
  return (
    <>
      <Form.Item
        label="Secondary Contact(s)"
        name="secondaryContacts"
        required={false}
        rules={[
          {
            validator: (_, value) => {
              if (!value) {
                return Promise.resolve();
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
        <Select mode="tags" placeholder="Enter a comma-delimited list of email addresses" tokenSeparators={[',']} />
      </Form.Item>
      <Form.Item
        label="Notify Contact(s)"
        name="notifyContacts"
        rules={[
          {
            validator: (_, value) => {
              if (!value) {
                return Promise.resolve();
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
        <Select mode="tags" placeholder="Enter a comma-delimited list of email addresses" tokenSeparators={[',']} />
      </Form.Item>
    </>
  );
}

export default AsrSpecificNotification;
