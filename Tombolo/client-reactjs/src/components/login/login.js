import React from 'react';
import { Form, Input, Button, Divider } from 'antd';
import msLogo from '../../images/mslogo.png';

const Login = () => {
  const onFinish = (values) => {
    console.log('Received values:', values);
    alert('login user code fires here');
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
      <Divider>Log In With</Divider>
      <Form.Item>
        <Button style={{ background: 'black', color: 'white' }}>
          <img src={msLogo} style={{ height: '3rem', width: 'auto' }} />
        </Button>
      </Form.Item>
      <Divider>Or</Divider>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Please input your email!' },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input size="large" />
      </Form.Item>
      <Form.Item
        label={
          <>
            <span>Password&nbsp;</span>
          </>
        }
        name="password"
        rules={[
          { required: true, message: 'Please input your password!' },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input.Password size="large" />
      </Form.Item>
      <a href="/reset-password">Forgot password?</a>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Log in
        </Button>
      </Form.Item>
      <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
        <span>Need an account?</span> <a href="/register">Register</a>
      </p>
    </Form>
  );
};

export default Login;
