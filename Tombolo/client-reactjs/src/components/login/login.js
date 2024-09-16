import React from 'react';
import { Form, Input, Button } from 'antd';

const Login = () => {
  const onFinish = (values) => {
    console.log('Received values:', values);
    alert('login user code fires here');
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
      <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Please input your username!' }]}>
        <Input />
      </Form.Item>

      <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
        <Input.Password />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Log in
        </Button>
      </Form.Item>

      <Form.Item>
        <a href="/reset-password">Forgot password?</a>
      </Form.Item>
    </Form>
  );
};

export default Login;
