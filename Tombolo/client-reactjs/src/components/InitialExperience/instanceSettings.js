import React from 'react';
import { Form, Input } from 'antd';

const InstanceSettings = ({ instanceForm }) => {
  return (
    <Form form={instanceForm} layout="vertical">
      <Form.Item
        label="Instance Name"
        name="name"
        rules={[
          { required: true, message: 'Please enter your instance name' },
          { max: 64, message: 'Maximum of 256 characters allowed' },
        ]}>
        <Input />
      </Form.Item>
      <Form.Item
        label="Instance Description"
        name="description"
        rules={[
          { required: true, message: 'Please enter your instance description' },
          { max: 256, message: 'Maximum of 256 characters allowed' },
        ]}>
        <Input.TextArea rows={5} />
      </Form.Item>
    </Form>
  );
};

export default InstanceSettings;
