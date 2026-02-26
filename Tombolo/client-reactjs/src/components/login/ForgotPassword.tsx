import React from 'react';
import { Form, Input, Button, Divider } from 'antd';
import { Link } from 'react-router-dom';

import { handleSuccess } from '../common/handleResponse';
import authService from '@/services/auth.service';
import styles from './login.module.css';

const ForgotPassword: React.FC = () => {
  const onFinish = async (values: any) => {
    try {
      await authService.handlePasswordResetRequest(values.email);
    } catch (_err) {
      console.error(_err);
    } finally {
      handleSuccess('If an account with this email exists, a password reset link will be sent to the email address.');
    }
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
      <Divider>Forgot Password?</Divider>
      <Form.Item
        label="Email"
        name="email"
        normalize={(value: any) => value?.trim()}
        rules={[{ required: true, whitespace: true, type: 'email', message: 'Invalid e-mail address.' }, { max: 64, message: 'Maximum of 64 characters allowed' }]}
      >
        <Input size="large" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" className="fullWidth">
          Reset Password
        </Button>
      </Form.Item>
      <p className={styles.helperLink}>
        <span>Remembered your password?</span> <Link to="/login">Log in</Link>
      </p>
    </Form>
  );
};

export default ForgotPassword;
