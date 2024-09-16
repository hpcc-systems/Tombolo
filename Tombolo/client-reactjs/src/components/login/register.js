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
