import React from 'react';
import { Form, Input, Popover } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

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
        <Input />
      </Form.Item>
      <Form.Item
        label={
          <>
            Contact Email{' '}
            <Popover
              content={
                <>
                  Contact Email is displayed as a point of contact for your users for things such as requesting access
                  to the application, reporting issues, or asking questions.
                </>
              }>
              <InfoCircleOutlined style={{ marginLeft: '.5rem' }} />
            </Popover>
          </>
        }
        name="contactEmail"
        rules={[
          {
            required: true,
            whitespace: true,
            type: 'email',
            message: 'Invalid e-mail address.',
          },
          {
            required: true,
            message: 'Please input your contact email',
          },
          { max: 256, message: 'Maximum of 256 characters allowed' },
        ]}>
        <Input />
      </Form.Item>
    </Form>
  );
};

export default InstanceSettings;
