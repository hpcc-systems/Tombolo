import React from 'react';
import { Form, Input, Button, Divider, message } from 'antd';
import { authHeader } from '../common/AuthHeader';

const ForgotPassword = () => {
  const onFinish = async (values) => {
    try {
      const url = '/api/auth/handlePasswordResetRequest';
      await fetch(url, { headers: authHeader(), method: 'POST', body: JSON.stringify(values) });

      success();
    } catch (err) {
      message.error(err.message);
    }
  };

  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: 'success',
      content: 'If a user with this email exists, a password reset link will be sent to the email address.',
      duration: 10,
      style: {
        marginTop: '20vh',
      },
    });
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
      {contextHolder}
      <Divider>Forgot Password?</Divider>
      <Form.Item
        label="Email"
        name="email"
        rules={[
          {
            required: true,
            whitespace: true,
            type: 'email',
            message: 'Invalid e-mail address.',
          },
          { max: 64, message: 'Maximum of 64 characters allowed' },
        ]}>
        <Input size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="fullWidth">
          Reset Password
        </Button>
      </Form.Item>
      <p style={{ width: '100%', textAlign: 'center', marginTop: '1rem' }}>
        <span>Remembered your password?</span> <a href="/login">Log in</a>
      </p>
    </Form>
  );
};

export default ForgotPassword;
