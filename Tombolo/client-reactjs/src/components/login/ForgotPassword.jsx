// Imports from libraries
import React from 'react';
import { Form, Input, Button, Divider } from 'antd';
import { Link } from 'react-router-dom';

// Local imports
import { authHeader } from '../common/AuthHeader';
import { handleError, handleSuccess } from '../common/handleResponse';
import styles from './login.module.css';

const ForgotPassword = () => {
  const onFinish = async (values) => {
    try {
      const url = '/api/auth/handlePasswordResetRequest';
      await fetch(url, { headers: authHeader(), method: 'POST', body: JSON.stringify(values) });

      handleSuccess('If a user with this email exists, a password reset link will be sent to the email address.');
    } catch (err) {
      handleError(err.message);
    }
  };

  return (
    <Form onFinish={onFinish} layout="vertical">
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
      <p className={styles.helperLink}>
        <span>Remembered your password?</span> <Link to="/login">Log in</Link>
      </p>
    </Form>
  );
};

export default ForgotPassword;
