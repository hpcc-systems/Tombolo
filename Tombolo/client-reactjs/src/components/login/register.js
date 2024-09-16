import React from 'react';
import { Form, Input, Button } from 'antd';

const Register = () => {
  const onFinish = (values) => {
    console.log('Received values of form: ', values);
    // Add your logic to register the user here
    alert('register user code fires here');
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
      <Form.Item
        name="firstName"
        label="First Name"
        rules={[
          {
            required: true,
            message: 'Please input your first name!',
          },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input />
      </Form.Item>
      <Form.Item
        name="lastName"
        label="Last Name"
        rules={[
          {
            required: true,
            message: 'Please input your last name!',
          },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input />
      </Form.Item>

      <Form.Item
        name="email"
        label="Email"
        rules={[
          {
            type: 'email',
            message: 'Please enter a valid email address!',
          },
          {
            required: true,
            message: 'Please input your email!',
          },
          { max: 256, message: 'Maximum of 256 characters allowed' },
        ]}>
        <Input />
      </Form.Item>

      <Form.Item
        name="password"
        label="Password"
        rules={[
          {
            required: true,
            message: 'Please input your password!',
          },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input.Password />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Register
        </Button>
      </Form.Item>
    </Form>
  );
};

export default Register;
